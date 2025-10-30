import axios from "axios";
import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const facebookCredentialsSchema = z.object({
  accessToken: z.string().min(1, "Facebook access token is required"),
  pageId: z.string().min(1, "Facebook page ID is required"),
  adAccountId: z.string().min(1, "Facebook ad account ID is required"),
});

const createPostSchema = z.object({
  message: z.string().min(1, "Message is required"),
  link: z.string().url().optional(),
});

const createAdSchema = z.object({
  campaignId: z.string().min(1),
  creativeId: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(["ACTIVE", "PAUSED"]).default("PAUSED"),
});

const pageInsightsSchema = z.object({
  metric: z.string().min(1),
  period: z.enum(["day", "week", "days_28"]).default("day"),
});

interface FacebookCredentials {
  accessToken: string;
  pageId: string;
  adAccountId: string;
}

function resolveCredentials(auth: ConnectorAuthContext): FacebookCredentials {
  const accessToken = auth.accessToken ?? auth.apiKey ?? auth.metadata?.accessToken;
  const pageId = auth.metadata?.pageId;
  const adAccountId = auth.metadata?.adAccountId;

  const parsed = facebookCredentialsSchema.safeParse({ accessToken, pageId, adAccountId });
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map(err => err.message).join(", "));
  }

  return parsed.data as FacebookCredentials;
}

const GRAPH_BASE = "https://graph.facebook.com/v18.0";

async function facebookRequest<T>(
  method: "GET" | "POST",
  path: string,
  creds: FacebookCredentials,
  params: Record<string, unknown>,
) {
  const url = `${GRAPH_BASE}/${path}`;
  const response = await axios({
    method,
    url,
    params: method === "GET" ? { ...params, access_token: creds.accessToken } : undefined,
    data: method === "POST" ? { ...params, access_token: creds.accessToken } : undefined,
  });
  return response.data as T;
}

export class FacebookConnector extends Connector {
  constructor() {
    super({
      name: "facebook",
      displayName: "Facebook",
      description: "Manage Facebook pages and ads via the Marketing API.",
      category: "social",
      iconUrl: "https://static.xx.fbcdn.net/rsrc.php/yo/r/iRmz9lCMBD2.ico",
      websiteUrl: "https://www.facebook.com",
      authType: "oauth2",
      authConfig: {
        authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
        scopes: ["pages_manage_posts", "pages_read_engagement", "ads_management", "pages_read_engagement"],
      },
    });
  }

  private getCredentials(auth: ConnectorAuthContext) {
    return resolveCredentials(auth);
  }

  actions = [
    {
      id: "createPost",
      name: "Create Page Post",
      description: "Publish a post to a Facebook page feed.",
      inputSchema: createPostSchema,
      execute: async ({ auth, input }) => {
        const payload = createPostSchema.parse(input);
        const creds = this.getCredentials(auth);

        const result = await retryManager.run(() =>
          facebookRequest<{ id: string }>(
            "POST",
            `${creds.pageId}/feed`,
            creds,
            {
              message: payload.message,
              link: payload.link,
            },
          )
        );

        return { postId: result.id };
      },
    },
    {
      id: "createAd",
      name: "Create Ad",
      description: "Create an ad under an existing campaign using a prepared creative.",
      inputSchema: createAdSchema,
      execute: async ({ auth, input }) => {
        const payload = createAdSchema.parse(input);
        const creds = this.getCredentials(auth);

        const result = await retryManager.run(() =>
          facebookRequest<{ id: string }>(
            "POST",
            `${creds.adAccountId}/ads`,
            creds,
            {
              name: payload.name,
              status: payload.status,
              campaign_id: payload.campaignId,
              creative: { creative_id: payload.creativeId },
            },
          )
        );

        return { adId: result.id };
      },
    },
    {
      id: "getPageInsights",
      name: "Get Page Insights",
      description: "Fetch insights for a Facebook page.",
      inputSchema: pageInsightsSchema,
      execute: async ({ auth, input }) => {
        const payload = pageInsightsSchema.parse(input);
        const creds = this.getCredentials(auth);

        const result = await retryManager.run(() =>
          facebookRequest<{ data: Array<{ name: string; values: Array<{ value: number }> }> }>(
            "GET",
            `${creds.pageId}/insights`,
            creds,
            {
              metric: payload.metric,
              period: payload.period,
            },
          )
        );

        const insightMap: Record<string, number> = {};
        for (const entry of result.data ?? []) {
          const latest = entry.values.at(-1)?.value;
          if (typeof latest === "number") {
            insightMap[entry.name] = latest;
          }
        }

        return insightMap;
      },
    },
  ];

  triggers = [];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      const creds = this.getCredentials(auth);
      await retryManager.run(() =>
        facebookRequest("GET", "me", creds, {
          fields: "id,name",
        })
      );
      return true;
    } catch {
      return false;
    }
  }
}
