import { Buffer } from "node:buffer";
import { URLSearchParams } from "node:url";
import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const whatsappSendInput = z.object({
  to: z.string().min(1, "Recipient phone number is required"),
  message: z.string().min(1, "Message body is required"),
  from: z.string().optional(),
  statusCallbackUrl: z.string().url().optional(),
});

const whatsappTemplateInput = z.object({
  to: z.string().min(1, "Recipient phone number is required"),
  templateName: z.string().min(1, "Template name is required"),
  params: z.array(z.string()).default([]),
  languageCode: z.string().default("en_US"),
  from: z.string().optional(),
  statusCallbackUrl: z.string().url().optional(),
});

const whatsappStatusInput = z.object({
  messageId: z.string().min(1, "Message SID is required"),
});

const whatsappMetadataSchema = z.object({
  accountSid: z.string().min(1).optional(),
  authToken: z.string().min(1).optional(),
  fromNumber: z.string().min(1).optional(),
});

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  defaultFrom?: string;
}

function resolveTwilioCredentials(auth: ConnectorAuthContext): TwilioCredentials {
  const metadata = whatsappMetadataSchema.parse(auth.metadata ?? {});
  const accountSid = auth.apiKey ?? metadata.accountSid;
  const authToken = auth.apiSecret ?? auth.accessToken ?? metadata.authToken;

  if (!accountSid) {
    throw new Error(
      "WhatsApp connector requires a Twilio account SID (provide via apiKey or metadata.accountSid)",
    );
  }

  if (!authToken) {
    throw new Error(
      "WhatsApp connector requires a Twilio auth token (provide via apiSecret, accessToken, or metadata.authToken)",
    );
  }

  return {
    accountSid,
    authToken,
    defaultFrom: metadata.fromNumber,
  };
}

function ensureWhatsappPrefix(value: string) {
  return value.startsWith("whatsapp:") ? value : `whatsapp:${value}`;
}

function renderTemplateMessage(templateName: string, params: string[], languageCode: string) {
  if (params.length === 0) {
    return `[${languageCode}] ${templateName}`;
  }
  return `[${languageCode}] ${templateName}: ${params.join(", ")}`;
}

async function twilioRequest<T>(
  creds: TwilioCredentials,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = new URL(`https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/${path}`);
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString("base64")}`,
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    let detail: string | undefined;
    try {
      detail = await response.text();
    } catch {
      detail = undefined;
    }
    const message = detail ? `Twilio API error ${response.status}: ${detail}` : `Twilio API error ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export class WhatsAppConnector extends Connector {
  constructor() {
    super({
      name: "whatsapp",
      displayName: "WhatsApp",
      description: "Send WhatsApp session and template messages via Twilio.",
      category: "communication",
      iconUrl: "https://static.xx.fbcdn.net/rsrc.php/yv/r/B8BxsscfVBr.ico",
      websiteUrl: "https://www.twilio.com/whatsapp",
      authType: "api_key",
      authConfig: {
        instructions:
          "Provide your Twilio Account SID as the API key and Auth Token as the API secret. Optionally supply a default WhatsApp From number via metadata.fromNumber.",
      },
    });
  }

  actions = [
    {
      id: "sendMessage",
      name: "Send Message",
      description: "Send a WhatsApp session message using Twilio's WhatsApp API.",
      inputSchema: whatsappSendInput,
      execute: async ({ auth, input }) => {
        const payload = whatsappSendInput.parse(input);
        const creds = resolveTwilioCredentials(auth);
        const fromNumber = payload.from ?? creds.defaultFrom;

        if (!fromNumber) {
          throw new Error("WhatsApp connector requires a from number (provide in input.from or metadata.fromNumber)");
        }

        const bodyParams = new URLSearchParams();
        bodyParams.set("To", ensureWhatsappPrefix(payload.to));
        bodyParams.set("From", ensureWhatsappPrefix(fromNumber));
        bodyParams.set("Body", payload.message);
        if (payload.statusCallbackUrl) {
          bodyParams.set("StatusCallback", payload.statusCallbackUrl);
        }

        const result = await retryManager.run(async () =>
          twilioRequest<{
            sid: string;
            status: string;
            to: string;
            from: string;
            dateCreated: string;
          }>(creds, "Messages.json", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: bodyParams.toString(),
          }),
        );

        return {
          messageId: result.sid,
          status: result.status,
          to: result.to,
          from: result.from,
          createdAt: result.dateCreated,
        };
      },
    },
    {
      id: "sendTemplate",
      name: "Send Template Message",
      description: "Trigger an approved WhatsApp template with parameter substitution.",
      inputSchema: whatsappTemplateInput,
      execute: async ({ auth, input }) => {
        const payload = whatsappTemplateInput.parse(input);
        const creds = resolveTwilioCredentials(auth);
        const fromNumber = payload.from ?? creds.defaultFrom;

        if (!fromNumber) {
          throw new Error("WhatsApp connector requires a from number (provide in input.from or metadata.fromNumber)");
        }

        const bodyParams = new URLSearchParams();
        bodyParams.set("To", ensureWhatsappPrefix(payload.to));
        bodyParams.set("From", ensureWhatsappPrefix(fromNumber));
        bodyParams.set("Body", renderTemplateMessage(payload.templateName, payload.params, payload.languageCode));
        bodyParams.set("PersistentAction", `template_name=${payload.templateName}`);
        if (payload.statusCallbackUrl) {
          bodyParams.set("StatusCallback", payload.statusCallbackUrl);
        }

        const result = await retryManager.run(async () =>
          twilioRequest<{
            sid: string;
            status: string;
            to: string;
            from: string;
            dateCreated: string;
          }>(creds, "Messages.json", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: bodyParams.toString(),
          }),
        );

        return {
          messageId: result.sid,
          status: result.status,
          to: result.to,
          from: result.from,
          createdAt: result.dateCreated,
        };
      },
    },
    {
      id: "getMessageStatus",
      name: "Get Message Status",
      description: "Fetch delivery state for a previously sent WhatsApp message.",
      inputSchema: whatsappStatusInput,
      execute: async ({ auth, input }) => {
        const payload = whatsappStatusInput.parse(input);
        const creds = resolveTwilioCredentials(auth);

        const result = await retryManager.run(async () =>
          twilioRequest<{
            sid: string;
            status: string;
            to: string;
            from: string;
            dateUpdated: string | null;
            errorCode: number | null;
            errorMessage: string | null;
            numSegments: string;
          }>(creds, `Messages/${encodeURIComponent(payload.messageId)}.json`),
        );

        return {
          messageId: result.sid,
          status: result.status,
          to: result.to,
          from: result.from,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
          segments: Number(result.numSegments ?? "0"),
          updatedAt: result.dateUpdated,
        };
      },
    },
  ];

  triggers = [];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      const creds = resolveTwilioCredentials(auth);
      await twilioRequest(creds, "Messages.json?PageSize=1", { method: "GET" });
      return true;
    } catch {
      return false;
    }
  }
}
