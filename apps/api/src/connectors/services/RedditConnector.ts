import Snoowrap from "snoowrap";
import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const redditCredentialsSchema = z.object({
  username: z.string().min(1, "Reddit username is required"),
  password: z.string().min(1, "Reddit password is required"),
  clientId: z.string().min(1, "Reddit client ID is required"),
  clientSecret: z.string().min(1, "Reddit client secret is required"),
  userAgent: z
    .string()
    .min(1)
    .default("NeonHubRedditConnector/1.0 (+https://neonhub.ai)"),
});

const submitPostSchema = z
  .object({
    subreddit: z.string().min(2, "Subreddit is required"),
    title: z.string().min(1, "Title is required").max(300),
    text: z.string().optional(),
    url: z.string().url().optional(),
    flairId: z.string().optional(),
  })
  .refine(
    payload => !!payload.text || !!payload.url,
    "Either text or url must be provided",
  );

const submitCommentSchema = z.object({
  submissionId: z.string().min(3, "Submission ID is required"),
  body: z.string().min(1, "Comment body is required"),
});

const subredditInfoSchema = z.object({
  subreddit: z.string().min(2, "Subreddit is required"),
});

type SnoowrapClient = any;

function resolveCredentials(auth: ConnectorAuthContext) {
  const metadata = auth.metadata ?? {};
  return redditCredentialsSchema.parse({
    username: metadata.username,
    password: metadata.password,
    clientId: auth.apiKey ?? metadata.clientId,
    clientSecret: auth.apiSecret ?? metadata.clientSecret,
    userAgent: metadata.userAgent,
  });
}

function createClient(auth: ConnectorAuthContext): SnoowrapClient {
  const creds = resolveCredentials(auth);
  return new Snoowrap({
    userAgent: creds.userAgent,
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
    username: creds.username,
    password: creds.password,
  }) as unknown as SnoowrapClient;
}

export class RedditConnector extends Connector {
  constructor() {
    super({
      name: "reddit",
      displayName: "Reddit",
      description: "Publish posts, join discussions, and fetch subreddit insights from Reddit.",
      category: "social",
      iconUrl: "https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png",
      websiteUrl: "https://www.reddit.com",
      authType: "api_key",
      authConfig: {
        requiredFields: ["username", "password", "clientId", "clientSecret"],
        instructions:
          "Provide Reddit API credentials. Set clientId/clientSecret via apiKey/apiSecret, and username/password via metadata.",
      },
    });
  }

  private getClient(auth: ConnectorAuthContext) {
    return createClient(auth);
  }

  actions = [
    {
      id: "submitPost",
      name: "Submit Post",
      description: "Publish a post to the specified subreddit.",
      inputSchema: submitPostSchema,
      execute: async ({ auth, input }) => {
        const payload = submitPostSchema.parse(input);
        const client = this.getClient(auth);

        const subreddit = client.getSubreddit(payload.subreddit);
        const submissionPromise = payload.url
          ? subreddit.submitLink({
              title: payload.title,
              url: payload.url,
              flairId: payload.flairId,
            })
          : subreddit.submitSelfpost({
              title: payload.title,
              text: payload.text ?? "",
              flairId: payload.flairId,
            });

        const submission = (await retryManager.run(() =>
          Promise.resolve(submissionPromise) as Promise<unknown>
        )) as Snoowrap.Submission;

        return {
          id: submission.id,
          name: submission.name,
          url: submission.url,
          permalink: submission.permalink,
          subreddit: submission.subreddit_name_prefixed,
        };
      },
    },
    {
      id: "submitComment",
      name: "Submit Comment",
      description: "Reply to an existing Reddit submission.",
      inputSchema: submitCommentSchema,
      execute: async ({ auth, input }) => {
        const payload = submitCommentSchema.parse(input);
        const client = this.getClient(auth);
        const submission = client.getSubmission(payload.submissionId);

        const commentPromise = submission.reply(payload.body);
        const comment = (await retryManager.run(() =>
          Promise.resolve(commentPromise) as Promise<unknown>
        )) as Snoowrap.Comment;

        return {
          id: comment.id,
          name: comment.name,
          body: comment.body,
          permalink: comment.permalink,
        };
      },
    },
    {
      id: "getSubredditInfo",
      name: "Get Subreddit Info",
      description: "Fetch metadata about a subreddit including subscriber counts and moderation status.",
      inputSchema: subredditInfoSchema,
      execute: async ({ auth, input }) => {
        const payload = subredditInfoSchema.parse(input);
        const client = this.getClient(auth);
        const subreddit = client.getSubreddit(payload.subreddit);

        const infoPromise = subreddit.fetch();
        const info = (await retryManager.run(() =>
          Promise.resolve(infoPromise) as Promise<unknown>
        )) as Snoowrap.Subreddit;

        return {
          id: info.id,
          name: info.display_name,
          title: info.title,
          description: info.public_description,
          subscribers: info.subscribers,
          activeAccounts: info.accounts_active_is_fuzzed ? undefined : info.active_user_count,
          over18: info.over18,
        };
      },
    },
  ];

  triggers = [];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      const client = this.getClient(auth);
      await retryManager.run(() => Promise.resolve(client.getMe()) as Promise<unknown>);
      return true;
    } catch {
      return false;
    }
  }
}
