import { connectorRegistry } from "./base/ConnectorRegistry.js";
import { SlackConnector } from "./services/SlackConnector.js";
import { GmailConnector } from "./services/GmailConnector.js";
import { GoogleSheetsConnector } from "./services/GoogleSheetsConnector.js";
import { TrelloConnector } from "./services/TrelloConnector.js";
import { StripeConnector } from "./services/StripeConnector.js";
import { NotionConnector } from "./services/NotionConnector.js";
import { AsanaConnector } from "./services/AsanaConnector.js";
import { HubSpotConnector } from "./services/HubSpotConnector.js";
import { TwitterConnector } from "./services/TwitterConnector.js";
import { DiscordConnector } from "./services/DiscordConnector.js";
import { GoogleSearchConsoleConnector } from "./services/GoogleSearchConsoleConnector.js";
import { SMSConnector } from "./services/SMSConnector.js";
import { WhatsAppConnector } from "./services/WhatsAppConnector.js";
import { RedditConnector } from "./services/RedditConnector.js";
import { InstagramConnector } from "./services/InstagramConnector.js";
import { FacebookConnector } from "./services/FacebookConnector.js";
import { YouTubeConnector } from "./services/YouTubeConnector.js";
import { TikTokConnector } from "./services/TikTokConnector.js";
import { GoogleAdsConnector } from "./services/GoogleAdsConnector.js";
import { ShopifyConnector } from "./services/ShopifyConnector.js";
import { LinkedInConnector } from "./services/LinkedInConnector.js";

const connectors = [
  new SlackConnector(),
  new GmailConnector(),
  new GoogleSheetsConnector(),
  new TrelloConnector(),
  new StripeConnector(),
  new NotionConnector(),
  new AsanaConnector(),
  new HubSpotConnector(),
  new TwitterConnector(),
  new DiscordConnector(),
  new GoogleSearchConsoleConnector(),
  new SMSConnector(),
  new WhatsAppConnector(),
  new RedditConnector(),
  new InstagramConnector(),
  new FacebookConnector(),
  new YouTubeConnector(),
  new TikTokConnector(),
  new GoogleAdsConnector(),
  new ShopifyConnector(),
  new LinkedInConnector(),
];

export async function registerConnectors() {
  await connectorRegistry.registerAll(connectors);
}

export { connectorRegistry };
