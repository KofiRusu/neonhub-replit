import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type {
  ConnectorActionDefinition,
  ConnectorAuthContext,
  ConnectorTriggerDefinition,
} from "../base/types.js";

export class GoogleSearchConsoleConnector extends Connector {
  readonly actions: ConnectorActionDefinition[] = [];

  readonly triggers: ConnectorTriggerDefinition[] = [];

  constructor() {
    super({
      name: "google-search-console",
      displayName: "Google Search Console",
      description: "Sync impressions, clicks, and keyword performance directly from Google Search Console.",
      category: "GOOGLE_SEARCH_CONSOLE",
      iconUrl: "https://www.gstatic.com/images/icons/material/product/2x/search_console_64dp.png",
      websiteUrl: "https://search.google.com/search-console",
      authType: "oauth2",
      authConfig: {
        scopes: [
          "https://www.googleapis.com/auth/webmasters.readonly",
        ],
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://oauth2.googleapis.com/token",
      },
    });
  }

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    return Boolean(auth.accessToken);
  }
}
