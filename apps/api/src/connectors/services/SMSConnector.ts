import { Buffer } from "node:buffer";
import { URLSearchParams } from "node:url";
import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const smsSendInput = z.object({
  to: z.string().min(1, "Recipient phone number is required"),
  message: z.string().min(1, "Message body is required"),
  from: z.string().optional(),
  statusCallbackUrl: z.string().url().optional(),
});

const smsStatusInput = z.object({
  messageId: z.string().min(1, "Message SID is required"),
});

const smsMetadataSchema = z.object({
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
  const metadata = smsMetadataSchema.parse(auth.metadata ?? {});
  const accountSid = auth.apiKey ?? metadata.accountSid;
  const authToken = auth.apiSecret ?? auth.accessToken ?? metadata.authToken;

  if (!accountSid) {
    throw new Error("SMS connector requires a Twilio account SID (provide via apiKey or metadata.accountSid)");
  }

  if (!authToken) {
    throw new Error("SMS connector requires a Twilio auth token (provide via apiSecret, accessToken, or metadata.authToken)");
  }

  return {
    accountSid,
    authToken,
    defaultFrom: metadata.fromNumber,
  };
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

export class SMSConnector extends Connector {
  constructor() {
    super({
      name: "sms",
      displayName: "SMS",
      description: "Send transactional and marketing SMS messages via Twilio.",
      category: "communication",
      iconUrl: "https://www.twilio.com/docs/static/img/favicons/favicon-32x32.png",
      websiteUrl: "https://www.twilio.com",
      authType: "api_key",
      authConfig: {
        instructions:
          "Provide your Twilio Account SID as the API key and Auth Token as the API secret. Optionally supply a default From number via metadata.fromNumber.",
      },
    });
  }

  actions = [
    {
      id: "sendSms",
      name: "Send SMS",
      description: "Deliver an SMS message using your Twilio messaging credentials.",
      inputSchema: smsSendInput,
      execute: async ({ auth, input }) => {
        const payload = smsSendInput.parse(input);
        const creds = resolveTwilioCredentials(auth);
        const fromNumber = payload.from ?? creds.defaultFrom;

        if (!fromNumber) {
          throw new Error("SMS connector requires a from number (provide in input.from or metadata.fromNumber)");
        }

        const bodyParams = new URLSearchParams();
        bodyParams.set("To", payload.to);
        bodyParams.set("From", fromNumber);
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
      id: "getMessageStatus",
      name: "Get Message Status",
      description: "Fetch the latest delivery status for a previously sent SMS.",
      inputSchema: smsStatusInput,
      execute: async ({ auth, input }) => {
        const payload = smsStatusInput.parse(input);
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
