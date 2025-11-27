import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { recordToolExecution } from "../services/tool-execution.service.js";
import { GmailMockConnector } from "./services/gmail-mock.js";
import { SlackMockConnector } from "./services/slack-mock.js";
import { TwilioMockConnector } from "./services/twilio-mock.js";
import {
  GoogleSheetsMockConnector,
  TrelloMockConnector,
  NotionMockConnector,
  AsanaMockConnector,
  HubSpotMockConnector,
} from "./services/workspace-mock.js";
import { GmailConnector } from "./services/GmailConnector.js";
import { SlackConnector } from "./services/SlackConnector.js";
import { SMSConnector } from "./services/SMSConnector.js";
import { StripeConnector } from "./services/StripeConnector.js";
import { ShopifyConnector } from "./services/ShopifyConnector.js";
import { GoogleSearchConsoleConnector } from "./services/GoogleSearchConsoleConnector.js";
import { YouTubeConnector } from "./services/YouTubeConnector.js";
import { TwitterConnector } from "./services/TwitterConnector.js";
import { FacebookConnector } from "./services/FacebookConnector.js";
import { InstagramConnector } from "./services/InstagramConnector.js";
import { LinkedInConnector } from "./services/LinkedInConnector.js";
import { GoogleSheetsConnector } from "./services/GoogleSheetsConnector.js";
import { TrelloConnector } from "./services/TrelloConnector.js";
import { NotionConnector } from "./services/NotionConnector.js";
import { AsanaConnector } from "./services/AsanaConnector.js";
import { HubSpotConnector } from "./services/HubSpotConnector.js";
import { DiscordConnector } from "./services/DiscordConnector.js";
import { WhatsAppConnector } from "./services/WhatsAppConnector.js";
import { RedditConnector } from "./services/RedditConnector.js";
import { TikTokConnector } from "./services/TikTokConnector.js";
import { GoogleAdsConnector } from "./services/GoogleAdsConnector.js";
import {
  MockStripeConnector,
  MockShopifyConnector,
  MockWhatsAppConnector,
  MockInstagramConnector,
  MockFacebookConnector,
  MockLinkedInConnector,
  MockXConnector,
  MockGoogleAdsConnector,
  MockGSCConnector,
  MockDiscordConnector,
  MockRedditConnector,
  MockTikTokConnector,
  MockYouTubeConnector,
} from "./mock/MockConnector.js";

/**
 * Phase 3 connector plan:
 *  - Use runtime env flags (`CONNECTORS_LIVE_MODE`, `USE_MOCK_CONNECTORS`, `NODE_ENV`) to flip between
 *    deterministic mocks and real connectors without code changes.
 *  - Expose mocks for every category (email, social, support/workspace, trends/analytics) so that tests
 *    and offline environments behave deterministically.
 *  - Keep telemetry consistent by forcing every connector method through `recordToolExecution`.
 */

export type ConnectorType =
  | "gmail"
  | "slack"
  | "twilio"
  | "sms"
  | "stripe"
  | "shopify"
  | "google-search-console"
  | "google-ads"
  | "google-sheets"
  | "trello"
  | "notion"
  | "asana"
  | "hubspot"
  | "youtube"
  | "twitter"
  | "facebook"
  | "instagram"
  | "linkedin"
  | "whatsapp"
  | "discord"
  | "reddit"
  | "tiktok";

type ConnectorMode = "mock" | "real";

let lastLoggedMode: ConnectorMode | null = null;

function shouldUseMocks(): boolean {
  if (process.env.CONNECTORS_LIVE_MODE === "true") {
    return false;
  }
  if (env.CONNECTORS_LIVE_MODE === true) {
    return false;
  }
  if (process.env.USE_MOCK_CONNECTORS === "true") {
    return true;
  }
  if (env.USE_MOCK_CONNECTORS === true) {
    return true;
  }
  return env.NODE_ENV === "test";
}

function resolveMode(): ConnectorMode {
  const mode: ConnectorMode = shouldUseMocks() ? "mock" : "real";
  if (mode !== lastLoggedMode) {
    lastLoggedMode = mode;
    if (mode === "mock") {
      logger.info("🎭 Connector mock mode ENABLED (USE_MOCK_CONNECTORS=true or NODE_ENV=test)");
    } else {
      logger.info("🔌 Connector real mode ENABLED (CONNECTORS_LIVE_MODE=true)");
    }
  }
  return mode;
}

export class ConnectorFactory {
  static create(
    type: ConnectorType,
    credentials?: { accessToken?: string; apiKey?: string; [key: string]: unknown },
  ): unknown {
    const mode = resolveMode();
    const connector = mode === "mock" ? this.createMock(type) : this.createReal(type, credentials);
    return attachToolTelemetry(connector, type);
  }

  static isMockMode(): boolean {
    return resolveMode() === "mock";
  }

  private static createMock(type: ConnectorType): any {
    logger.debug({ type }, "Creating mock connector");
    switch (type) {
      case "gmail":
        return new GmailMockConnector();
      case "slack":
        return new SlackMockConnector();
      case "twilio":
      case "sms":
        return new TwilioMockConnector();
      case "stripe":
        return new MockStripeConnector();
      case "shopify":
        return new MockShopifyConnector();
      case "google-search-console":
        return new MockGSCConnector();
      case "google-ads":
        return new MockGoogleAdsConnector();
      case "youtube":
        return new MockYouTubeConnector();
      case "twitter":
        return new MockXConnector();
      case "facebook":
        return new MockFacebookConnector();
      case "instagram":
        return new MockInstagramConnector();
      case "linkedin":
        return new MockLinkedInConnector();
      case "whatsapp":
        return new MockWhatsAppConnector();
      case "discord":
        return new MockDiscordConnector();
      case "reddit":
        return new MockRedditConnector();
      case "tiktok":
        return new MockTikTokConnector();
      case "google-sheets":
        return new GoogleSheetsMockConnector();
      case "trello":
        return new TrelloMockConnector();
      case "notion":
        return new NotionMockConnector();
      case "asana":
        return new AsanaMockConnector();
      case "hubspot":
        return new HubSpotMockConnector();
      default:
        return createGenericMockProxy(type);
    }
  }

  private static createReal(
    type: ConnectorType,
    _credentials?: { accessToken?: string; apiKey?: string; [key: string]: unknown },
  ): any {
    logger.debug({ type }, "Creating real connector (production mode)");
    switch (type) {
      case "gmail":
        return new GmailConnector();
      case "slack":
        return new SlackConnector();
      case "twilio":
      case "sms":
        return new SMSConnector();
      case "stripe":
        return new StripeConnector();
      case "shopify":
        return new ShopifyConnector();
      case "google-search-console":
        return new GoogleSearchConsoleConnector();
      case "google-ads":
        return new GoogleAdsConnector();
      case "youtube":
        return new YouTubeConnector();
      case "twitter":
        return new TwitterConnector();
      case "facebook":
        return new FacebookConnector();
      case "instagram":
        return new InstagramConnector();
      case "linkedin":
        return new LinkedInConnector();
      case "google-sheets":
        return new GoogleSheetsConnector();
      case "trello":
        return new TrelloConnector();
      case "notion":
        return new NotionConnector();
      case "asana":
        return new AsanaConnector();
      case "hubspot":
        return new HubSpotConnector();
      case "discord":
        return new DiscordConnector();
      case "whatsapp":
        return new WhatsAppConnector();
      case "reddit":
        return new RedditConnector();
      case "tiktok":
        return new TikTokConnector();
      default:
        throw new Error(`Unknown connector type: ${type}`);
    }
  }
}

class GenericMockConnector {
  constructor(private type: ConnectorType) {}

  async execute(method: string, payload: unknown): Promise<unknown> {
    logger.debug({ connector: this.type, method, payload }, "[MOCK] Generic connector invoked");
    return {
      success: true,
      connector: this.type,
      method,
      id: `${this.type}-mock-${Date.now()}`,
      payload,
    };
  }
}

function createGenericMockProxy(type: ConnectorType) {
  const target = new GenericMockConnector(type);
  return new Proxy(target, {
    get(obj, prop, receiver) {
      if (prop in obj) {
        return Reflect.get(obj, prop, receiver);
      }
      if (typeof prop === "symbol" || prop === "then") {
        return undefined;
      }
      return async (...args: unknown[]) => obj.execute(String(prop), args.length <= 1 ? args[0] : args);
    },
  });
}

function attachToolTelemetry<T extends object>(connector: T, type: ConnectorType): T {
  if (!connector || typeof connector !== "object") {
    return connector;
  }

  const wrapped = new Map<PropertyKey, (...args: unknown[]) => Promise<unknown>>();

  return new Proxy(connector, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function" || prop === "constructor") {
        return value;
      }

      if (wrapped.has(prop)) {
        return wrapped.get(prop);
      }

      const instrumented = async (...args: unknown[]) => {
        const payload = args.length <= 1 ? args[0] : args;
        return recordToolExecution(type, String(prop), payload, () =>
          Promise.resolve(value.apply(target, args)),
        );
      };

      wrapped.set(prop, instrumented);
      return instrumented;
    },
  });
}
