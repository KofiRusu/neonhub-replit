import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const instagramCredentialsSchema = z.object({
  accessToken: z.string().min(1, "Instagram access token is required"),
  pageId: z.string().min(1, "Instagram page ID is required"),
});

const publishPostSchema = z.object({
  imageUrl: z.string().url("Image URL must be valid"),
  caption: z.string().max(2200).optional(),
});

const publishStorySchema = z.object({
  mediaUrl: z.string().url("Media URL must be valid"),
});

const insightsSchema = z.object({
  postId: z.string().min(1, "Post ID is required"),
});

interface InstagramCredentials {
  accessToken: string;
  pageId: string;
}

function resolveCredentials(auth: ConnectorAuthContext): InstagramCredentials {
  const accessToken = auth.accessToken ?? auth.apiKey ?? auth.metadata?.accessToken;
  const pageId = auth.metadata?.pageId ?? auth.apiSecret;

  const parsed = instagramCredentialsSchema.safeParse({ accessToken, pageId });
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map(err => err.message).join(", "));
  }

  return parsed.data as InstagramCredentials;
}

const API_BASE = "https://graph.instagram.com/v18.0";

async function instagramFetch<T>(path: string, creds: InstagramCredentials, init: RequestInit = {}) {
  const url = new URL(`${API_BASE}/${path}`);
  url.searchParams.set("access_token", creds.accessToken);

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Instagram API error ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

async function uploadMedia(creds: InstagramCredentials, mediaUrl: string, caption?: string) {
  const result = await instagramFetch<{ id: string }>(
    `${creds.pageId}/media`,
    creds,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: mediaUrl,
        caption,
      }),
    },
  );

  return result.id;
}

async function publishContainer(creds: InstagramCredentials, creationId: string) {
  return instagramFetch<{ id: string }>(
    `${creds.pageId}/media_publish`,
    creds,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ creation_id: creationId }),
    },
  );
}

async function createStory(creds: InstagramCredentials, mediaUrl: string) {
  const result = await instagramFetch<{ id: string }>(
    `${creds.pageId}/media`,
    creds,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        media_type: "STORIES",
        media_url: mediaUrl,
      }),
    },
  );

  return result.id;
}

export class InstagramConnector extends Connector {
  constructor() {
    super({
      name: "instagram",
      displayName: "Instagram",
      description: "Publish media and retrieve insights through the Instagram Graph API.",
      category: "social",
      iconUrl: "https://static.xx.fbcdn.net/rsrc.php/ym/r/36B424nhiPl.ico",
      websiteUrl: "https://www.instagram.com",
      authType: "oauth2",
      authConfig: {
        authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
        scopes: ["instagram_basic", "instagram_content_publish", "instagram_manage_insights"],
      },
    });
  }

  private getCredentials(auth: ConnectorAuthContext) {
    return resolveCredentials(auth);
  }

  actions = [
    {
      id: "publishPost",
      name: "Publish Post",
      description: "Publish an image post to Instagram with an optional caption.",
      inputSchema: publishPostSchema,
      execute: async ({ auth, input }) => {
        const payload = publishPostSchema.parse(input);
        const creds = this.getCredentials(auth);

        const containerId = await retryManager.run(() => uploadMedia(creds, payload.imageUrl, payload.caption));
        const publishResult = await retryManager.run(() => publishContainer(creds, containerId));

        return {
          creationId: containerId,
          mediaId: publishResult.id,
        };
      },
    },
    {
      id: "publishStory",
      name: "Publish Story",
      description: "Publish a story to Instagram using an external media URL.",
      inputSchema: publishStorySchema,
      execute: async ({ auth, input }) => {
        const payload = publishStorySchema.parse(input);
        const creds = this.getCredentials(auth);

        const creationId = await retryManager.run(() => createStory(creds, payload.mediaUrl));
        const publishResult = await retryManager.run(() => publishContainer(creds, creationId));

        return {
          creationId,
          mediaId: publishResult.id,
        };
      },
    },
    {
      id: "getInsights",
      name: "Get Insights",
      description: "Retrieve insights for a published Instagram media item.",
      inputSchema: insightsSchema,
      execute: async ({ auth, input }) => {
        const payload = insightsSchema.parse(input);
        const creds = this.getCredentials(auth);

        const metrics = ["impressions", "reach", "saved", "likes", "comments"].join(",");
        const { data } = await retryManager.run(() =>
          instagramFetch<{ data: Array<{ name: string; values: Array<{ value: number }> }> }>(
            `${payload.postId}/insights?metric=${metrics}`,
            creds,
            { method: "GET" },
          )
        );

        const insightMap: Record<string, number> = {};
        for (const entry of data ?? []) {
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
      await retryManager.run(() => instagramFetch("me", creds, { method: "GET" }));
      return true;
    } catch {
      return false;
    }
  }
}
