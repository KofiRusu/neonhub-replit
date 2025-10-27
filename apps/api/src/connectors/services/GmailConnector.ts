import { Buffer } from "node:buffer";
import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const gmailSendInput = z.object({
  to: z.string().min(3, "Recipient is required"),
  subject: z.string().optional(),
  body: z.string().min(1, "Email body is required"),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  from: z.string().optional(),
});

const gmailNewEmailInput = z.object({
  labelIds: z.array(z.string()).default(["INBOX"]),
  q: z.string().optional(),
});

async function gmailFetch<T>(path: string, auth: ConnectorAuthContext, init: RequestInit = {}): Promise<T> {
  if (!auth.accessToken) {
    throw new Error("Gmail connector requires an access token");
  }

  const response = await fetch(`https://gmail.googleapis.com/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gmail API error ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

function toRFC822(input: z.infer<typeof gmailSendInput>) {
  const headers = [
    `To: ${input.to}`,
    input.from ? `From: ${input.from}` : undefined,
    input.cc ? `Cc: ${input.cc}` : undefined,
    input.bcc ? `Bcc: ${input.bcc}` : undefined,
    input.subject ? `Subject: ${input.subject}` : undefined,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
  ]
    .filter(Boolean)
    .join("\r\n");

  return `${headers}\r\n\r\n${input.body}`;
}

export class GmailConnector extends Connector {
  constructor() {
    super({
      name: "gmail",
      displayName: "Gmail",
      description: "Send and receive email using Gmail.",
      category: "communication",
      iconUrl: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico",
      websiteUrl: "https://mail.google.com",
      authType: "oauth2",
      authConfig: {
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.readonly"],
      },
    });
  }

  actions = [
    {
      id: "sendEmail",
      name: "Send Email",
      description: "Send an email via the authenticated Gmail account.",
      inputSchema: gmailSendInput,
      execute: async ({ auth, input }) => {
        const parsed = gmailSendInput.parse(input);
        const raw = Buffer.from(toRFC822(parsed)).toString("base64url");

        const result = await retryManager.run(async () =>
          gmailFetch<{ id: string; threadId: string }>("gmail/v1/users/me/messages/send", auth, {
            method: "POST",
            body: JSON.stringify({ raw }),
          })
        );

        return result;
      },
    },
  ];

  triggers = [
    {
      id: "newEmail",
      name: "New Email",
      description: "Triggers when a new email appears in the selected labels.",
      pollingIntervalSeconds: 120,
      inputSchema: gmailNewEmailInput,
      run: async ({ auth, settings, cursor }) => {
        const parsed = gmailNewEmailInput.parse(settings ?? {});
        const params = new URLSearchParams({
          maxResults: "10",
        });
        for (const label of parsed.labelIds) {
          params.append("labelIds", label);
        }
        if (parsed.q) params.set("q", parsed.q);
        if (cursor) params.set("pageToken", cursor);

        const list = await retryManager.run(async () =>
          gmailFetch<{
            messages?: Array<{ id: string; threadId: string }>;
            nextPageToken?: string;
            resultSizeEstimate: number;
          }>(`gmail/v1/users/me/messages?${params.toString()}`, auth, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          })
        );

        const items = list.messages ?? [];

        return {
          cursor: list.nextPageToken || cursor || null,
          items,
        };
      },
    },
  ];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      await gmailFetch("gmail/v1/users/me/profile", auth, { method: "GET" });
      return true;
    } catch {
      return false;
    }
  }
}
