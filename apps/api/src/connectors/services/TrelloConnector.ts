import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const createCardSchema = z.object({
  key: z.string().optional(),
  token: z.string().optional(),
  listId: z.string().min(1),
  name: z.string().min(1),
  desc: z.string().optional(),
  due: z.string().optional(),
});

const moveCardSchema = z.object({
  key: z.string().optional(),
  token: z.string().optional(),
  cardId: z.string().min(1),
  listId: z.string().min(1),
});

function resolveAuth(auth: ConnectorAuthContext, input: { key?: string; token?: string }) {
  const apiKey = input.key || auth.apiKey;
  const apiToken = input.token || auth.apiSecret || auth.accessToken;
  if (!apiKey || !apiToken) {
    throw new Error("Trello connector requires an API key and token");
  }
  return { apiKey, apiToken };
}

async function trelloFetch<T>(path: string, auth: ConnectorAuthContext, params: Record<string, string>, init: RequestInit = {}) {
  const url = new URL(`https://api.trello.com/1/${path}`);
  const search = new URLSearchParams({
    key: auth.apiKey || "",
    token: auth.apiSecret || auth.apiKey || "",
  });
  for (const [key, value] of Object.entries(params)) {
    search.set(key, value);
  }
  url.search = search.toString();

  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Trello API error ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export class TrelloConnector extends Connector {
  constructor() {
    super({
      name: "trello",
      displayName: "Trello",
      description: "Create and manage Trello cards.",
      category: "productivity",
      iconUrl: "https://trello.com/favicon.ico",
      websiteUrl: "https://trello.com",
      authType: "api_key",
      authConfig: {
        requiredFields: ["apiKey", "apiToken"],
      },
    });
  }

  actions = [
    {
      id: "createCard",
      name: "Create Card",
      description: "Create a Trello card in the specified list.",
      inputSchema: createCardSchema,
      execute: async ({ auth, input }) => {
        const payload = createCardSchema.parse(input);
        const { apiKey, apiToken } = resolveAuth(auth, payload);
        const result = await retryManager.run(() =>
          fetch("https://api.trello.com/1/cards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idList: payload.listId,
              name: payload.name,
              desc: payload.desc,
              due: payload.due,
              key: apiKey,
              token: apiToken,
            }),
          }).then(async res => {
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`Trello API error ${res.status}: ${text}`);
            }
            return res.json();
          })
        );
        return result;
      },
    },
    {
      id: "moveCard",
      name: "Move Card",
      description: "Move an existing card to another list.",
      inputSchema: moveCardSchema,
      execute: async ({ auth, input }) => {
        const payload = moveCardSchema.parse(input);
        const { apiKey, apiToken } = resolveAuth(auth, payload);
        const url = new URL(`https://api.trello.com/1/cards/${payload.cardId}`);
        url.searchParams.set("key", apiKey);
        url.searchParams.set("token", apiToken);
        const result = await retryManager.run(async () => {
          const res = await fetch(url.toString(), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idList: payload.listId }),
          });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Trello API error ${res.status}: ${text}`);
          }
          return res.json();
        });
        return result;
      },
    },
  ];

  triggers = [];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    if (!auth.apiKey || !auth.apiSecret) return false;
    try {
      await trelloFetch("members/me", auth, {}, { method: "GET" });
      return true;
    } catch {
      return false;
    }
  }
}
