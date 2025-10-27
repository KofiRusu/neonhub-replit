import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const createPageSchema = z.object({
  parentDatabaseId: z.string().min(1),
  title: z.string().min(1),
  properties: z.record(z.unknown()).optional(),
  content: z.string().optional(),
});

const queryDatabaseSchema = z.object({
  databaseId: z.string().min(1),
  filter: z.record(z.unknown()).optional(),
});

async function notionFetch<T>(auth: ConnectorAuthContext, path: string, init: RequestInit = {}) {
  if (!auth.accessToken) {
    throw new Error("Notion connector requires an access token");
  }

  const response = await fetch(`https://api.notion.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion API error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

export class NotionConnector extends Connector {
  constructor() {
    super({
      name: "notion",
      displayName: "Notion",
      description: "Create pages and query databases in Notion.",
      category: "productivity",
      iconUrl: "https://www.notion.so/images/favicon.ico",
      websiteUrl: "https://notion.so",
      authType: "oauth2",
      authConfig: {
        authorizeUrl: "https://api.notion.com/v1/oauth/authorize",
        tokenUrl: "https://api.notion.com/v1/oauth/token",
        scopes: ["read", "update"],
      },
    });
  }

  actions = [
    {
      id: "createPage",
      name: "Create Page",
      description: "Create a page inside a Notion database.",
      inputSchema: createPageSchema,
      execute: async ({ auth, input }) => {
        const payload = createPageSchema.parse(input);
        const body: any = {
          parent: { database_id: payload.parentDatabaseId },
          properties: payload.properties ?? {
            Title: {
              title: [{ text: { content: payload.title } }],
            },
          },
        };
        if (payload.content) {
          body.children = [
            {
              object: "block",
              type: "paragraph",
              paragraph: {
                rich_text: [{ type: "text", text: { content: payload.content } }],
              },
            },
          ];
        }
        return retryManager.run(() =>
          notionFetch(auth, "pages", {
            method: "POST",
            body: JSON.stringify(body),
          })
        );
      },
    },
  ];

  triggers = [
    {
      id: "databaseUpdated",
      name: "Database Updated",
      description: "Triggers when items are added or updated in a Notion database.",
      pollingIntervalSeconds: 180,
      inputSchema: queryDatabaseSchema,
      run: async ({ auth, settings, cursor }) => {
        const payload = queryDatabaseSchema.parse(settings ?? {});
        const body: any = {
          sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
          page_size: 20,
        };
        if (payload.filter) body.filter = payload.filter;

        const result = await notionFetch<{
          results: Array<{ id: string; last_edited_time: string }>;
          next_cursor: string | null;
          has_more: boolean;
        }>(auth, `databases/${payload.databaseId}/query`, {
          method: "POST",
          body: JSON.stringify({ ...body, start_cursor: cursor || undefined }),
        });

        return {
          cursor: result.next_cursor,
          items: result.results,
        };
      },
    },
  ];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      await notionFetch(auth, "users/me", { method: "GET" });
      return true;
    } catch {
      return false;
    }
  }
}
