/**
 * Mock Connector Factory
 * Routes to mock implementations when USE_MOCK_CONNECTORS=true
 */

import { z } from "zod";
import { env } from "../../config/env.js";
import { Connector } from "../base/Connector.js";
import type {
  ConnectorActionDefinition,
  ConnectorMetadata,
  ConnectorTriggerDefinition,
} from "../base/types.js";
import {
  MockEmailConnector,
  MockSMSConnector,
  MockSlackConnector,
  MockStripeConnector,
  MockWhatsAppConnector,
  MockInstagramConnector,
  MockFacebookConnector,
  MockLinkedInConnector,
  MockXConnector,
  MockGoogleAdsConnector,
  MockGA4Connector,
  MockGSCConnector,
  MockShopifyConnector,
  MockDiscordConnector,
  MockRedditConnector,
  MockTikTokConnector,
  MockYouTubeConnector,
  type ConnectorResponse,
} from "./MockConnector.js";

export type ConnectorType =
  | "EMAIL"
  | "GMAIL"
  | "SMS"
  | "TWILIO"
  | "SLACK"
  | "STRIPE"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "LINKEDIN"
  | "X"
  | "GOOGLE_ADS"
  | "GOOGLE_ANALYTICS"
  | "GOOGLE_SEARCH_CONSOLE"
  | "SHOPIFY"
  | "DISCORD"
  | "REDDIT"
  | "TIKTOK"
  | "YOUTUBE";

/**
 * Get mock connector instance
 */
export function getMockConnector(type: ConnectorType): any {
  switch (type) {
    case "EMAIL":
    case "GMAIL":
      return new MockEmailConnector();
    case "SMS":
    case "TWILIO":
      return new MockSMSConnector();
    case "SLACK":
      return new MockSlackConnector();
    case "STRIPE":
      return new MockStripeConnector();
    case "WHATSAPP":
      return new MockWhatsAppConnector();
    case "INSTAGRAM":
      return new MockInstagramConnector();
    case "FACEBOOK":
      return new MockFacebookConnector();
    case "LINKEDIN":
      return new MockLinkedInConnector();
    case "X":
      return new MockXConnector();
    case "GOOGLE_ADS":
      return new MockGoogleAdsConnector();
    case "GOOGLE_ANALYTICS":
      return new MockGA4Connector();
    case "GOOGLE_SEARCH_CONSOLE":
      return new MockGSCConnector();
    case "SHOPIFY":
      return new MockShopifyConnector();
    case "DISCORD":
      return new MockDiscordConnector();
    case "REDDIT":
      return new MockRedditConnector();
    case "TIKTOK":
      return new MockTikTokConnector();
    case "YOUTUBE":
      return new MockYouTubeConnector();
    default:
      throw new Error(`Unknown connector type: ${type}`);
  }
}

/**
 * Check if mock connectors are enabled
 */
export function useMockConnectors(): boolean {
  return env.USE_MOCK_CONNECTORS === true || env.NODE_ENV === "test";
}

/**
 * Get connector (mock or real based on environment)
 * @param type Connector type
 * @param realConnectorFactory Factory function to create real connector
 * @returns Connector instance (mock or real)
 */
export function getConnector<T>(
  type: ConnectorType,
  realConnectorFactory: () => T
): T | ReturnType<typeof getMockConnector> {
  if (useMockConnectors()) {
    console.info(`[MOCK] Using mock connector for ${type}`);
    return getMockConnector(type);
  }

  try {
    return realConnectorFactory();
  } catch (error) {
    console.error(`Failed to create real connector for ${type}:`, error);
    console.info(`Falling back to mock connector for ${type}`);
    return getMockConnector(type);
  }
}

/**
 * Validate connector credentials
 * Throws error if credentials are missing and mocks are disabled
 */
const CONNECTOR_TYPE_ALIASES: Partial<Record<ConnectorType, ConnectorType>> = {
  EMAIL: "GMAIL",
  SMS: "TWILIO",
};

export function validateConnectorCredentials(
  type: ConnectorType,
  requiredEnvVars: string[]
): void {
  if (useMockConnectors()) {
    return; // Mocks don't need credentials
  }

  const normalizedType = CONNECTOR_TYPE_ALIASES[type] ?? type;
  const missing = requiredEnvVars.filter((varName) => {
    const value = process.env[varName];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required credentials for ${normalizedType} connector: ${missing.join(", ")}. ` +
        `Set USE_MOCK_CONNECTORS=true to use mock connectors for testing.`
    );
  }
}

type MockActionSpec<TInput, TResult = unknown> = {
  id: string;
  name: string;
  description: string;
  schema: z.ZodType<TInput>;
  handler: (input: TInput) => Promise<TResult>;
};

class MockConnectorAdapter extends Connector {
  readonly actions: ConnectorActionDefinition[];
  readonly triggers: ConnectorTriggerDefinition[] = [];

  constructor(metadata: ConnectorMetadata, specs: Array<MockActionSpec<any, any>>) {
    super({
      ...metadata,
      authType: metadata.authType ?? "none",
    });

    this.actions = specs.map(({ id, name, description, schema, handler }) => ({
      id,
      name,
      description,
      inputSchema: schema,
      execute: async ({ input }) => handler(schema.parse(input ?? {})),
    }));
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}

function unwrapResponse<T>(
  connectorName: string,
  actionId: string,
  response: ConnectorResponse<T>
): T {
  if (!response.success || typeof response.data === "undefined") {
    const reason = response.error ?? "unknown error";
    throw new Error(`Mock connector ${connectorName}.${actionId} failed: ${reason}`);
  }
  return response.data;
}

const emptyObjectSchema = z.object({});

function createGmailMockAdapter(): Connector {
  const mock = new MockEmailConnector();
  const sendEmailInput = z.object({
    to: z.string().email(),
    subject: z.string().min(1),
    body: z.string().min(1),
    from: z.string().email().optional(),
  });
  const listEmailsInput = z.object({
    maxResults: z.number().int().positive().max(50).optional(),
    query: z.string().optional(),
  });

  return new MockConnectorAdapter(
    {
      name: "gmail",
      displayName: "Gmail (Mock)",
      description: "Deterministic Gmail connector used for CI and local testing.",
      category: "communication",
      authType: "none",
    },
    [
      {
        id: "sendEmail",
        name: "Send Email",
        description: "Send a mock email with deterministic identifiers.",
        schema: sendEmailInput,
        handler: async (input) => unwrapResponse("gmail", "sendEmail", await mock.sendEmail(input)),
      },
      {
        id: "listEmails",
        name: "List Emails",
        description: "List mock inbox messages.",
        schema: listEmailsInput,
        handler: async (input) => unwrapResponse("gmail", "listEmails", await mock.listEmails(input)),
      },
    ]
  );
}

function createTwilioMockAdapter(): Connector {
  const mock = new MockSMSConnector();
  const sendSmsInput = z.object({
    to: z.string().min(3),
    body: z.string().min(1),
    from: z.string().optional(),
  });
  const statusInput = z.object({
    sid: z.string().min(1),
  });

  return new MockConnectorAdapter(
    {
      name: "twilio",
      displayName: "Twilio SMS (Mock)",
      description: "Predictable SMS connector for Twilio operations.",
      category: "communication",
      authType: "none",
    },
    [
      {
        id: "sendSMS",
        name: "Send SMS",
        description: "Send a deterministic SMS message.",
        schema: sendSmsInput,
        handler: async (input) => unwrapResponse("twilio", "sendSMS", await mock.sendSMS(input)),
      },
      {
        id: "messageStatus",
        name: "Get Message Status",
        description: "Fetch a deterministic delivery status for a message.",
        schema: statusInput,
        handler: async (input) => unwrapResponse("twilio", "getMessageStatus", await mock.getMessageStatus(input.sid)),
      },
    ]
  );
}

function createSlackMockAdapter(): Connector {
  const mock = new MockSlackConnector();
  const postMessageInput = z.object({
    channel: z.string().min(1),
    text: z.string().min(1),
    blocks: z.array(z.any()).optional(),
  });

  return new MockConnectorAdapter(
    {
      name: "slack",
      displayName: "Slack (Mock)",
      description: "Deterministic Slack connector for messaging flows.",
      category: "communication",
      authType: "none",
    },
    [
      {
        id: "postMessage",
        name: "Post Message",
        description: "Simulate sending a Slack message.",
        schema: postMessageInput,
        handler: async (input) => unwrapResponse("slack", "postMessage", await mock.postMessage(input)),
      },
      {
        id: "listChannels",
        name: "List Channels",
        description: "Return a deterministic channel roster.",
        schema: emptyObjectSchema,
        handler: async () => unwrapResponse("slack", "listChannels", await mock.listChannels()),
      },
    ]
  );
}

function createStripeMockAdapter(): Connector {
  const mock = new MockStripeConnector();
  const customerInput = z.object({
    email: z.string().email(),
    name: z.string().optional(),
  });
  const subscriptionInput = z.object({
    customerId: z.string().min(1),
    priceId: z.string().min(1),
  });

  return new MockConnectorAdapter(
    {
      name: "stripe",
      displayName: "Stripe (Mock)",
      description: "Deterministic billing connector for CI pipelines.",
      category: "billing",
      authType: "none",
    },
    [
      {
        id: "createCustomer",
        name: "Create Customer",
        description: "Create a mock Stripe customer.",
        schema: customerInput,
        handler: async (input) => unwrapResponse("stripe", "createCustomer", await mock.createCustomer(input)),
      },
      {
        id: "createSubscription",
        name: "Create Subscription",
        description: "Create a mock Stripe subscription.",
        schema: subscriptionInput,
        handler: async (input) => unwrapResponse("stripe", "createSubscription", await mock.createSubscription(input)),
      },
    ]
  );
}

function createGa4MockAdapter(): Connector {
  const mock = new MockGA4Connector();
  const reportInput = z.object({
    dateRanges: z
      .array(
        z.object({
          startDate: z.string().min(1),
          endDate: z.string().min(1),
        })
      )
      .optional(),
    metrics: z.array(z.object({ name: z.string().min(1) })).optional(),
  });

  return new MockConnectorAdapter(
    {
      name: "ga4",
      displayName: "Google Analytics 4 (Mock)",
      description: "Deterministic GA4 reporting for analytics workflows.",
      category: "analytics",
      authType: "none",
    },
    [
      {
        id: "runReport",
        name: "Run Report",
        description: "Generate a deterministic GA4 report payload.",
        schema: reportInput,
        handler: async (input) =>
          unwrapResponse(
            "ga4",
            "runReport",
            await mock.runReport({
              dateRanges: input.dateRanges ?? [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
              metrics: input.metrics ?? [{ name: "activeUsers" }],
            })
          ),
      },
    ]
  );
}

function createGscMockAdapter(): Connector {
  const mock = new MockGSCConnector();
  const queryInput = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    dimensions: z.array(z.string()).optional(),
  });

  return new MockConnectorAdapter(
    {
      name: "google-search-console",
      displayName: "Google Search Console (Mock)",
      description: "Deterministic search analytics for SEO automation.",
      category: "analytics",
      authType: "none",
    },
    [
      {
        id: "querySearchAnalytics",
        name: "Query Search Analytics",
        description: "Return deterministic search console metrics.",
        schema: queryInput,
        handler: async (input) =>
          unwrapResponse(
            "gsc",
            "querySearchAnalytics",
            await mock.querySearchAnalytics({
              startDate: input.startDate ?? "2024-01-01",
              endDate: input.endDate ?? "2024-01-31",
              dimensions: input.dimensions ?? ["query"],
            })
          ),
      },
    ]
  );
}

function createFacebookMockAdapter(): Connector {
  const mock = new MockFacebookConnector();
  const postInput = z.object({
    message: z.string().min(1),
    link: z.string().url().optional(),
  });

  return new MockConnectorAdapter(
    {
      name: "facebook",
      displayName: "Facebook (Mock)",
      description: "Deterministic Facebook connector for campaign flows.",
      category: "social",
      authType: "none",
    },
    [
      {
        id: "createPost",
        name: "Create Post",
        description: "Create a deterministic Facebook post payload.",
        schema: postInput,
        handler: async (input) => unwrapResponse("facebook", "createPost", await mock.createPost(input)),
      },
      {
        id: "getPageInsights",
        name: "Get Page Insights",
        description: "Return deterministic Facebook page insights.",
        schema: emptyObjectSchema,
        handler: async () => unwrapResponse("facebook", "getPageInsights", await mock.getPageInsights()),
      },
    ]
  );
}

function createInstagramMockAdapter(): Connector {
  const mock = new MockInstagramConnector();
  const mediaInput = z.object({
    caption: z.string().min(1),
    imageUrl: z.string().url(),
  });

  return new MockConnectorAdapter(
    {
      name: "instagram",
      displayName: "Instagram (Mock)",
      description: "Deterministic Instagram connector for creative testing.",
      category: "social",
      authType: "none",
    },
    [
      {
        id: "postMedia",
        name: "Post Media",
        description: "Publish deterministic Instagram media.",
        schema: mediaInput,
        handler: async (input) => unwrapResponse("instagram", "postMedia", await mock.postMedia(input)),
      },
      {
        id: "getInsights",
        name: "Get Insights",
        description: "Return deterministic Instagram insights.",
        schema: emptyObjectSchema,
        handler: async () => unwrapResponse("instagram", "getInsights", await mock.getInsights()),
      },
    ]
  );
}

function createLinkedInMockAdapter(): Connector {
  const mock = new MockLinkedInConnector();
  const shareInput = z.object({
    text: z.string().min(1),
    visibility: z.string().min(1),
  });

  return new MockConnectorAdapter(
    {
      name: "linkedin",
      displayName: "LinkedIn (Mock)",
      description: "Deterministic LinkedIn connector for B2B flows.",
      category: "social",
      authType: "none",
    },
    [
      {
        id: "sharePost",
        name: "Share Post",
        description: "Publish deterministic LinkedIn updates.",
        schema: shareInput,
        handler: async (input) => unwrapResponse("linkedin", "sharePost", await mock.sharePost(input)),
      },
      {
        id: "getAnalytics",
        name: "Get Analytics",
        description: "Return deterministic LinkedIn analytics.",
        schema: emptyObjectSchema,
        handler: async () => unwrapResponse("linkedin", "getAnalytics", await mock.getAnalytics()),
      },
    ]
  );
}

function createXMockAdapter(): Connector {
  const mock = new MockXConnector();
  const tweetInput = z.object({
    text: z.string().min(1),
  });
  const metricsInput = z.object({
    tweetId: z.string().min(1),
  });

  return new MockConnectorAdapter(
    {
      name: "x",
      displayName: "X / Twitter (Mock)",
      description: "Deterministic X connector for social orchestration.",
      category: "social",
      authType: "none",
    },
    [
      {
        id: "createTweet",
        name: "Create Tweet",
        description: "Publish deterministic tweets.",
        schema: tweetInput,
        handler: async (input) => unwrapResponse("x", "createTweet", await mock.createTweet(input)),
      },
      {
        id: "getTweetMetrics",
        name: "Get Tweet Metrics",
        description: "Return deterministic tweet metrics.",
        schema: metricsInput,
        handler: async (input) => unwrapResponse("x", "getTweetMetrics", await mock.getTweetMetrics(input.tweetId)),
      },
    ]
  );
}

function createTikTokMockAdapter(): Connector {
  const mock = new MockTikTokConnector();
  const uploadInput = z.object({
    videoUrl: z.string().url(),
    caption: z.string().min(1),
  });

  return new MockConnectorAdapter(
    {
      name: "tiktok",
      displayName: "TikTok (Mock)",
      description: "Deterministic TikTok connector for creative QA.",
      category: "social",
      authType: "none",
    },
    [
      {
        id: "uploadVideo",
        name: "Upload Video",
        description: "Upload deterministic TikTok video payloads.",
        schema: uploadInput,
        handler: async (input) => unwrapResponse("tiktok", "uploadVideo", await mock.uploadVideo(input)),
      },
    ]
  );
}

function createYouTubeMockAdapter(): Connector {
  const mock = new MockYouTubeConnector();
  const uploadInput = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    videoFile: z.string().min(1),
  });
  const analyticsInput = z.object({
    videoId: z.string().min(1),
  });

  return new MockConnectorAdapter(
    {
      name: "youtube",
      displayName: "YouTube (Mock)",
      description: "Deterministic YouTube connector for video flows.",
      category: "social",
      authType: "none",
    },
    [
      {
        id: "uploadVideo",
        name: "Upload Video",
        description: "Upload deterministic YouTube videos.",
        schema: uploadInput,
        handler: async (input) => unwrapResponse("youtube", "uploadVideo", await mock.uploadVideo(input)),
      },
      {
        id: "getVideoAnalytics",
        name: "Get Video Analytics",
        description: "Return deterministic YouTube analytics.",
        schema: analyticsInput,
        handler: async (input) =>
          unwrapResponse("youtube", "getVideoAnalytics", await mock.getVideoAnalytics(input.videoId)),
      },
    ]
  );
}

function createWhatsAppMockAdapter(): Connector {
  const mock = new MockWhatsAppConnector();
  const messageInput = z.object({
    to: z.string().min(3),
    body: z.string().min(1),
  });

  return new MockConnectorAdapter(
    {
      name: "whatsapp",
      displayName: "WhatsApp (Mock)",
      description: "Deterministic WhatsApp connector for messaging QA.",
      category: "communication",
      authType: "none",
    },
    [
      {
        id: "sendMessage",
        name: "Send Message",
        description: "Send deterministic WhatsApp messages.",
        schema: messageInput,
        handler: async (input) => unwrapResponse("whatsapp", "sendMessage", await mock.sendMessage(input)),
      },
    ]
  );
}

function createShopifyMockAdapter(): Connector {
  const mock = new MockShopifyConnector();

  return new MockConnectorAdapter(
    {
      name: "shopify",
      displayName: "Shopify (Mock)",
      description: "Deterministic Shopify connector for commerce flows.",
      category: "commerce",
      authType: "none",
    },
    [
      {
        id: "getProducts",
        name: "Get Products",
        description: "Return deterministic Shopify products.",
        schema: emptyObjectSchema,
        handler: async () => unwrapResponse("shopify", "getProducts", await mock.getProducts()),
      },
      {
        id: "getOrders",
        name: "Get Orders",
        description: "Return deterministic Shopify orders.",
        schema: emptyObjectSchema,
        handler: async () => unwrapResponse("shopify", "getOrders", await mock.getOrders()),
      },
    ]
  );
}

function createDiscordMockAdapter(): Connector {
  const mock = new MockDiscordConnector();
  const messageInput = z.object({
    channelId: z.string().min(1),
    content: z.string().min(1),
  });

  return new MockConnectorAdapter(
    {
      name: "discord",
      displayName: "Discord (Mock)",
      description: "Deterministic Discord connector for community automation.",
      category: "communication",
      authType: "none",
    },
    [
      {
        id: "sendMessage",
        name: "Send Message",
        description: "Send deterministic Discord messages.",
        schema: messageInput,
        handler: async (input) => unwrapResponse("discord", "sendMessage", await mock.sendMessage(input)),
      },
    ]
  );
}

export function createMockConnectorAdapters(): Connector[] {
  return [
    createGmailMockAdapter(),
    createTwilioMockAdapter(),
    createSlackMockAdapter(),
    createStripeMockAdapter(),
    createGa4MockAdapter(),
    createGscMockAdapter(),
    createFacebookMockAdapter(),
    createInstagramMockAdapter(),
    createLinkedInMockAdapter(),
    createXMockAdapter(),
    createTikTokMockAdapter(),
    createYouTubeMockAdapter(),
    createWhatsAppMockAdapter(),
    createShopifyMockAdapter(),
    createDiscordMockAdapter(),
  ];
}

// Export all mock connector classes
export {
  MockEmailConnector,
  MockSMSConnector,
  MockSlackConnector,
  MockStripeConnector,
  MockWhatsAppConnector,
  MockInstagramConnector,
  MockFacebookConnector,
  MockLinkedInConnector,
  MockXConnector,
  MockGoogleAdsConnector,
  MockGA4Connector,
  MockGSCConnector,
  MockShopifyConnector,
  MockDiscordConnector,
  MockRedditConnector,
  MockTikTokConnector,
  MockYouTubeConnector,
  // createMockConnectorAdapters already exported above
};
