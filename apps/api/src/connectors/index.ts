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
];

export async function registerConnectors() {
  await connectorRegistry.registerAll(connectors);
}

export { connectorRegistry };
