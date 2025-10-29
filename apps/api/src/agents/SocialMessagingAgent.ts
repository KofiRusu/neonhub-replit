import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { BrandVoiceService } from "../services/brand-voice.service.js";
import { PersonService } from "../services/person.service.js";
import { EventIntakeService } from "../services/event-intake.service.js";
import { queues } from "../queues/index.js";
import type { ConsentStatus } from "../types/agentic.js";

const PLATFORM_LIMITS: Record<string, number> = {
  instagram: 800,
  x: 280,
  reddit: 2000,
  whatsapp: 1000,
};

export type SocialDMArgs = {
  personId: string;
  platform: "instagram" | "x" | "reddit" | "whatsapp";
  objective: string;
  brandId: string;
  operatorId?: string;
};

async function enqueueSocialJob(queueName: "social.compose" | "social.send", payload: Record<string, unknown>) {
  try {
    await queues[queueName].add(queueName, payload, { removeOnComplete: 200, removeOnFail: 500 });
  } catch (error) {
    logger.warn({ error, queueName }, "Failed to enqueue social job");
  }
}

function enforcePlatformLimit(body: string, platform: string): string {
  const limit = PLATFORM_LIMITS[platform] ?? 500;
  if (body.length <= limit) {
    return body;
  }
  return `${body.slice(0, limit - 3)}...`;
}

export class SocialMessagingAgent {
  async sendDM(args: SocialDMArgs): Promise<void> {
    await enqueueSocialJob("social.compose", args);

    const person = await prisma.person.findUnique({
      where: { id: args.personId },
      select: {
        id: true,
        organizationId: true,
        primaryHandle: true,
        displayName: true,
      },
    });

    if (!person) {
      throw new Error(`Person not found for id ${args.personId}`);
    }

    const consentChannel = args.platform === "whatsapp" ? "sms" : "dm";
    const consent = (await PersonService.getConsent(args.personId, consentChannel)) as ConsentStatus | null;
    if (consent && consent !== "granted") {
      throw new Error(`Consent for ${consentChannel} not granted`);
    }

    const identity = await prisma.identity.findFirst({
      where: {
        personId: args.personId,
        channel: args.platform,
      },
      orderBy: { verifiedAt: "desc" },
    });

    const handle = identity?.value ?? person.primaryHandle;
    if (!handle) {
      logger.warn({ personId: args.personId, platform: args.platform }, "No handle available for social DM");
    }

    const memory = await PersonService.getMemory(args.personId, { limit: 5, includeVectors: false });

    const composition = await BrandVoiceService.compose({
      channel: "dm",
      objective: args.objective,
      personId: args.personId,
      brandId: args.brandId,
      constraints: {
        maxLength: PLATFORM_LIMITS[args.platform] ?? 500,
        platform: args.platform,
      },
    });

    const variant = composition.variants[0] ?? {
      body: composition.body,
      cta: composition.cta,
    };

    const body = enforcePlatformLimit(variant.body ?? composition.body, args.platform);

    // Placeholder for actual platform API integration
    logger.info(
      {
        personId: args.personId,
        platform: args.platform,
        handle,
        bodyLength: body.length,
      },
      "Dispatching social DM via connector",
    );

    await enqueueSocialJob("social.send", {
      ...args,
      handle,
    });

    await EventIntakeService.ingest({
      organizationId: person.organizationId,
      personId: args.personId,
      channel: "dm",
      type: "send",
      payload: {
        platform: args.platform,
        handle,
        body,
      },
      metadata: {
        brandId: args.brandId,
        objective: args.objective,
        operatorId: args.operatorId ?? null,
        memoryCount: memory.length,
      } as Prisma.JsonObject,
      source: `${args.platform}-agent`,
    });
  }
}

export const socialMessagingAgent = new SocialMessagingAgent();
