import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const createContactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  website: z.string().optional(),
});

const searchContactSchema = z.object({
  email: z.string().email(),
});

async function hubspotFetch<T>(auth: ConnectorAuthContext, path: string, init: RequestInit = {}) {
  const token = auth.accessToken || auth.apiKey;
  if (!token) throw new Error("HubSpot connector requires an access token");

  const response = await fetch(`https://api.hubapi.com/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HubSpot API error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

export class HubSpotConnector extends Connector {
  constructor() {
    super({
      name: "hubspot",
      displayName: "HubSpot",
      description: "Create and manage contacts in HubSpot CRM.",
      category: "crm",
      iconUrl: "https://static.hsappstatic.net/ui-addon-upgrades/static-4.15816/img/favicon.ico",
      websiteUrl: "https://hubspot.com",
      authType: "oauth2",
      authConfig: {
        authorizeUrl: "https://app.hubspot.com/oauth/authorize",
        tokenUrl: "https://api.hubapi.com/oauth/v1/token",
        scopes: ["contacts", "crm.objects.contacts.read", "crm.objects.contacts.write"],
      },
    });
  }

  actions = [
    {
      id: "createContact",
      name: "Create Contact",
      description: "Create a contact in HubSpot.",
      inputSchema: createContactSchema,
      execute: async ({ auth, input }) => {
        const payload = createContactSchema.parse(input);
        return retryManager.run(() =>
          hubspotFetch(auth, "crm/v3/objects/contacts", {
            method: "POST",
            body: JSON.stringify({
              properties: {
                email: payload.email,
                firstname: payload.firstName,
                lastname: payload.lastName,
                phone: payload.phone,
                company: payload.company,
                website: payload.website,
              },
            }),
          })
        );
      },
    },
  ];

  triggers = [
    {
      id: "contactCreated",
      name: "New Contact",
      description: "Triggers when a new contact is created.",
      pollingIntervalSeconds: 300,
      inputSchema: z.object({
        limit: z.number().min(1).max(100).default(20),
      }),
      run: async ({ auth, cursor, settings }) => {
        const limit = settings?.limit ?? 20;
        const params = new URLSearchParams({
          limit: String(limit),
          sort: "-createdate",
        });
        if (cursor) params.set("after", cursor);

        const result = await hubspotFetch<{
          results: Array<{ id: string; createdAt: string; properties: Record<string, unknown> }>;
          paging?: { next?: { after: string } };
        }>(auth, `crm/v3/objects/contacts?${params.toString()}`, { method: "GET" });

        return {
          cursor: result.paging?.next?.after ?? null,
          items: result.results,
        };
      },
    },
    {
      id: "findContactByEmail",
      name: "Find Contact By Email",
      description: "Look up a contact by email address.",
      inputSchema: searchContactSchema,
      run: async ({ auth, settings }) => {
        const payload = searchContactSchema.parse(settings ?? {});
        const result = await hubspotFetch<{
          results: Array<{ id: string; properties: Record<string, unknown> }>;
        }>(auth, "crm/v3/objects/contacts/search", {
          method: "POST",
          body: JSON.stringify({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName: "email",
                    operator: "EQ",
                    value: payload.email,
                  },
                ],
              },
            ],
          }),
        });

        return {
          cursor: null,
          items: result.results,
        };
      },
    },
  ];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      const token = auth.accessToken || auth.apiKey;
      if (!token) return false;
      await hubspotFetch(auth, `oauth/v1/access-tokens/${token}`, { method: "GET" });
      return true;
    } catch {
      return false;
    }
  }
}
