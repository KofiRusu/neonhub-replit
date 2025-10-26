import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const postTweetSchema = z.object({
  text: z.string().min(1).max(280),
  replyTo: z.string().optional(),
});

const searchTweetsSchema = z.object({
  query: z.string().min(1),
  maxResults: z.number().min(10).max(100).default(25),
});

async function twitterFetch<T>(auth: ConnectorAuthContext, path: string, init: RequestInit = {}) {
  const token = auth.accessToken || auth.apiKey;
  if (!token) throw new Error("Twitter connector requires a bearer token");

  const response = await fetch(`https://api.twitter.com/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twitter API error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

export class TwitterConnector extends Connector {
  constructor() {
    super({
      name: "twitter",
      displayName: "Twitter / X",
      description: "Publish tweets and monitor conversations on Twitter.",
      category: "social",
      iconUrl: "https://abs.twimg.com/favicons/twitter.ico",
      websiteUrl: "https://twitter.com",
      authType: "api_key",
      authConfig: {
        requiredFields: ["accessToken"],
      },
    });
  }

  actions = [
    {
      id: "postTweet",
      name: "Post Tweet",
      description: "Publish a tweet using the authenticated account.",
      inputSchema: postTweetSchema,
      execute: async ({ auth, input }) => {
        const payload = postTweetSchema.parse(input);
        return retryManager.run(() =>
          twitterFetch(auth, "2/tweets", {
            method: "POST",
            body: JSON.stringify({
              text: payload.text,
              reply: payload.replyTo ? { in_reply_to_tweet_id: payload.replyTo } : undefined,
            }),
          })
        );
      },
    },
  ];

  triggers = [
    {
      id: "searchTweets",
      name: "Search Tweets",
      description: "Triggers with the latest tweets that match a query.",
      pollingIntervalSeconds: 120,
      inputSchema: searchTweetsSchema,
      run: async ({ auth, settings, cursor }) => {
        const payload = searchTweetsSchema.parse(settings ?? {});
        const params = new URLSearchParams({
          query: payload.query,
          max_results: String(payload.maxResults),
          "tweet.fields": "created_at,author_id",
        });
        if (cursor) params.set("next_token", cursor);

        const result = await twitterFetch<{
          data?: Array<{ id: string; text: string; created_at: string; author_id: string }>;
          meta?: { next_token?: string };
        }>(auth, `2/tweets/search/recent?${params.toString()}`, { method: "GET" });

        return {
          cursor: result.meta?.next_token ?? null,
          items: result.data ?? [],
        };
      },
    },
  ];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      await twitterFetch(auth, "2/users/me", { method: "GET" });
      return true;
    } catch {
      return false;
    }
  }
}
