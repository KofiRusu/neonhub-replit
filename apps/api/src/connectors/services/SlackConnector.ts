import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const slackMessageInput = z.object({
  channel: z.string().min(1, "Channel is required"),
  text: z.string().min(1, "Message text is required"),
  threadTs: z.string().optional(),
});

const slackNewMessageInput = z.object({
  channel: z.string().min(1, "Channel ID is required"),
  oldest: z.string().optional(),
});

async function slackFetch<T>(path: string, auth: ConnectorAuthContext, init: RequestInit = {}): Promise<T> {
  if (!auth.accessToken) {
    throw new Error("Slack connector requires an access token");
  }

  const response = await fetch(`https://slack.com/api/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${auth.accessToken}`,
      ...(init.headers || {}),
    },
  });

  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error || "Unknown Slack API error");
  }
  return payload as T;
}

export class SlackConnector extends Connector {
  constructor() {
    super({
      name: "slack",
      displayName: "Slack",
      description: "Collaborate with your team by sending messages and reacting to events in Slack.",
      category: "communication",
      iconUrl: "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png",
      websiteUrl: "https://slack.com",
      authType: "oauth2",
      authConfig: {
        authorizeUrl: "https://slack.com/oauth/v2/authorize",
        tokenUrl: "https://slack.com/api/oauth.v2.access",
        scopes: ["chat:write", "channels:history", "channels:read", "groups:history", "groups:read"],
      },
    });
  }

  actions = [
    {
      id: "sendMessage",
      name: "Send Message",
      description: "Send a message to a Slack channel or DM.",
      inputSchema: slackMessageInput,
      execute: async ({ auth, input }) => {
        const payload = slackMessageInput.parse(input);
        const result = await retryManager.run(async () => slackFetch<{ ts: string }>("chat.postMessage", auth, {
          method: "POST",
          body: JSON.stringify({
            channel: payload.channel,
            text: payload.text,
            thread_ts: payload.threadTs,
          }),
        }));
        return result;
      },
    },
  ];

  triggers = [
    {
      id: "newMessage",
      name: "New Channel Message",
      description: "Triggers when a new message is posted in the selected channel.",
      pollingIntervalSeconds: 60,
      inputSchema: slackNewMessageInput,
      run: async ({ auth, settings, cursor }) => {
        const payload = slackNewMessageInput.parse(settings ?? {});
        const history = await retryManager.run(async () => slackFetch<{
          latest: string;
          messages: Array<{ ts: string; text: string; user?: string }>;
        }>("conversations.history", auth, {
          method: "POST",
          body: JSON.stringify({
            channel: payload.channel,
            oldest: cursor ?? payload.oldest,
            limit: 50,
          }),
        }));

        const items = (history.messages || []).map(msg => ({
          ts: msg.ts,
          text: msg.text,
          user: msg.user,
        }));

        return {
          cursor: history.latest,
          items,
        };
      },
    },
  ];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      await slackFetch("auth.test", auth, { method: "POST", body: "{}" });
      return true;
    } catch {
      return false;
    }
  }
}
