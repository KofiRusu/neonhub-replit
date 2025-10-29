import twilio from "twilio";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { BrandVoiceService } from "../services/brand-voice.service.js";
import { PersonService } from "../services/person.service.js";
import { EventIntakeService } from "../services/event-intake.service.js";
import { queues } from "../queues/index.js";
import type { ConsentStatus } from "../types/agentic.js";

const TWILIO_SID = env.TWILIO_SID ?? env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_TOKEN = env.TWILIO_AUTH_TOKEN ?? "";
const TWILIO_FROM = env.TWILIO_PHONE_NUMBER ?? "";

const twilioClient = TWILIO_SID && TWILIO_TOKEN ? twilio(TWILIO_SID, TWILIO_TOKEN) : null;

const MAX_SMS_LENGTH = 160;

export type SmsSendArgs = {
  personId: string;
  objective: string;
  brandId: string;
  operatorId?: string;
};

export type TwilioWebhook = {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  [key: string]: unknown;
};

function normalizePhone(value: string): string {
  return value.replace(/[^+\d]/g, "");
}

function shortenLinks(body: string): string {
  return body.replace(/https?:\/\/[\w./?-]+/g, (match) => {
    const hash = Buffer.from(match).toString("base64").slice(0, 6);
    return `https://n.hub/${hash}`;
  });
}

async function enqueueSmsJob(queueName: "sms.compose" | "sms.send", payload: Record<string, unknown>) {
  try {
    await queues[queueName].add(queueName, payload, { removeOnComplete: 200, removeOnFail: 500 });
  } catch (error) {
    logger.warn({ error, queueName }, "Failed to enqueue sms job");
  }
}

function enforceLength(body: string): string {
  if (body.length <= MAX_SMS_LENGTH) {
    return body;
  }
  return `${body.slice(0, MAX_SMS_LENGTH - 3)}...`;
}

export class SMSAgent {
  async send(args: SmsSendArgs): Promise<void> {
    await enqueueSmsJob("sms.compose", args);

    const person = await prisma.person.findUnique({
      where: { id: args.personId },
      select: {
        id: true,
        organizationId: true,
        primaryPhone: true,
        displayName: true,
      },
    });

    if (!person) {
      throw new Error(`Person not found for id ${args.personId}`);
    }

    const consent = (await PersonService.getConsent(args.personId, "sms")) as ConsentStatus | null;
    if (consent && consent !== "granted") {
      throw new Error(`SMS consent not granted for person ${args.personId}`);
    }

    const identity = await prisma.identity.findFirst({
      where: { personId: args.personId, type: "phone" },
      orderBy: { verifiedAt: "desc" },
    });

    const phone = normalizePhone(identity?.value ?? person.primaryPhone ?? "");
    if (!phone) {
      throw new Error(`Missing phone number for person ${args.personId}`);
    }

    const message = await BrandVoiceService.compose({
      channel: "sms",
      objective: args.objective,
      personId: args.personId,
      brandId: args.brandId,
      constraints: { maxLength: MAX_SMS_LENGTH },
    });

    const variant = message.variants[0] ?? {
      body: message.body,
      cta: message.cta,
    };

    const body = enforceLength(shortenLinks(variant.body ?? message.body));

    if (twilioClient && TWILIO_FROM) {
      await twilioClient.messages.create({
        from: TWILIO_FROM,
        to: phone,
        body,
      });
    } else {
      logger.info({ phone, bodyLength: body.length }, "Twilio not configured. Skipping SMS send");
    }

    await enqueueSmsJob("sms.send", {
      ...args,
      to: phone,
    });

    await EventIntakeService.ingest({
      organizationId: person.organizationId,
      personId: args.personId,
      channel: "sms",
      type: "send",
      payload: {
        body,
      },
      metadata: {
        brandId: args.brandId,
        objective: args.objective,
        operatorId: args.operatorId ?? null,
      },
      source: "sms-agent",
    });
  }

  async parseReply(inbound: TwilioWebhook): Promise<void> {
    const phone = normalizePhone(inbound.From);
    const identity = await prisma.identity.findFirst({
      where: { type: "phone", value: phone },
      select: {
        personId: true,
        person: {
          select: { organizationId: true },
        },
      },
    });

    if (!identity?.personId || !identity.person) {
      logger.warn({ phone }, "SMS reply received for unknown identity");
      return;
    }

    await EventIntakeService.ingest({
      organizationId: identity.person.organizationId,
      personId: identity.personId,
      channel: "sms",
      type: "reply",
      payload: {
        body: inbound.Body,
        messageSid: inbound.MessageSid,
      },
      metadata: {
        from: inbound.From,
        to: inbound.To,
      },
      source: "twilio-webhook",
    });
  }
}

export const smsAgent = new SMSAgent();
