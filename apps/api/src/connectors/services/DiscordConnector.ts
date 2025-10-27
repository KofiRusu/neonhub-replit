import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const sendMessageSchema = z.object({
  channelId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

async function discordFetch<T>(auth: ConnectorAuthContext, path: string, init: RequestInit = {}) {
  const token = auth.apiKey || auth.accessToken;
  if (!token) throw new Error("Discord connector requires a bot token");

  const response = await fetch(`https://discord.com/api/v10/${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord API error ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export class DiscordConnector extends Connector {
  constructor() {
    super({
      name: "discord",
      displayName: "Discord",
      description: "Send messages to Discord channels via a bot.",
      category: "communication",
      iconUrl: "https://discord.com/assets/847541504914fd33810e70a0ea73177e.ico",
      websiteUrl: "https://discord.com",
      authType: "api_key",
      authConfig: {
        requiredFields: ["apiKey"],
      },
    });
  }

  actions = [
    {
      id: "sendMessage",
      name: "Send Message",
      description: "Send a message to a Discord channel.",
      inputSchema: sendMessageSchema,
      execute: async ({ auth, input }) => {
        const payload = sendMessageSchema.parse(input);
        return retryManager.run(() =>
          discordFetch(auth, `channels/${payload.channelId}/messages`, {
            method: "POST",
            body: JSON.stringify({ content: payload.content }),
          })
        );
      },
    },
  ];

  triggers = [];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      await discordFetch(auth, "users/@me", { method: "GET" });
      return true;
    } catch {
      return false;
    }
  }
}
