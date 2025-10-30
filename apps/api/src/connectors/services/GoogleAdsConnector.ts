import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const credentialsSchema = z.object({
  accessToken: z.string().min(1, "Google Ads access token is required"),
  customerId: z.string().min(1, "Customer ID is required"),
  developerToken: z.string().min(1, "Developer token is required"),
  loginCustomerId: z.string().optional(),
});

const searchCampaignsInput = z.object({
  customerId: z.string().optional(),
  query: z
    .string()
    .default(
      "SELECT campaign.id, campaign.name, campaign.status FROM campaign ORDER BY campaign.id DESC LIMIT 25",
    ),
});

const createBudgetInput = z.object({
  customerId: z.string().optional(),
  name: z.string().min(1, "Budget name is required"),
  amountMicros: z.number().min(0, "Budget must be positive"),
  deliveryMethod: z.enum(["STANDARD", "ACCELERATED"]).default("STANDARD"),
});

const campaignMetricsInput = z.object({
  customerId: z.string().optional(),
  campaignId: z.string().min(1, "Campaign ID is required"),
  dateRange: z
    .object({
      startDate: z.string().min(8),
      endDate: z.string().min(8),
    })
    .default({
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    }),
});

interface GoogleAdsCredentials {
  accessToken: string;
  customerId: string;
  developerToken: string;
  loginCustomerId?: string;
}

function resolveCredentials(auth: ConnectorAuthContext, overrideCustomerId?: string): GoogleAdsCredentials {
  const accessToken = auth.accessToken ?? auth.apiKey;
  const customerId = overrideCustomerId ?? (auth.metadata?.customerId as string | undefined);
  const developerToken = auth.apiSecret ?? (auth.metadata?.developerToken as string | undefined);
  const loginCustomerId = auth.metadata?.loginCustomerId as string | undefined;

  const parsed = credentialsSchema.parse({
    accessToken,
    customerId,
    developerToken,
    loginCustomerId,
  });

  return {
    accessToken: parsed.accessToken,
    customerId: parsed.customerId,
    developerToken: parsed.developerToken,
    loginCustomerId: parsed.loginCustomerId,
  };
}

async function googleAdsRequest<T>(
  method: "GET" | "POST",
  path: string,
  creds: GoogleAdsCredentials,
  body?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`https://googleads.googleapis.com/v15/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      "Content-Type": "application/json",
      "developer-token": creds.developerToken,
      ...(creds.loginCustomerId ? { "login-customer-id": creds.loginCustomerId } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Google Ads API error ${response.status}`);
  }

  return (await response.json()) as T;
}

export class GoogleAdsConnector extends Connector {
  constructor() {
    super({
      name: "google_ads",
      displayName: "Google Ads",
      description: "Manage Google Ads campaigns and retrieve performance metrics.",
      category: "GOOGLE_ADS",
      iconUrl: "https://www.google.com/favicon.ico",
      websiteUrl: "https://ads.google.com/home/tools/api/",
      authType: "oauth2",
      authConfig: {
        instructions:
          "Provide OAuth access token with Google Ads scope. Set developer token via apiSecret or metadata.developerToken and customer IDs via metadata.",
      },
    });
  }

  actions = [
    {
      id: "searchCampaigns",
      name: "Search Campaigns",
      description: "Execute a GAQL query to retrieve campaigns.",
      inputSchema: searchCampaignsInput,
      execute: async ({ auth, input }) => {
        const payload = searchCampaignsInput.parse(input);
        const creds = resolveCredentials(auth, payload.customerId);

        const data = await retryManager.run(() =>
          googleAdsRequest<{ results?: Array<Record<string, unknown>> }>(
            "POST",
            `customers/${creds.customerId}/googleAds:search`,
            creds,
            { query: payload.query },
          ),
        );

        return data.results ?? [];
      },
    },
    {
      id: "createCampaignBudget",
      name: "Create Campaign Budget",
      description: "Create a shared campaign budget.",
      inputSchema: createBudgetInput,
      execute: async ({ auth, input }) => {
        const payload = createBudgetInput.parse(input);
        const creds = resolveCredentials(auth, payload.customerId);

        const result = await retryManager.run(() =>
          googleAdsRequest<{ resourceName: string }>(
            "POST",
            `customers/${creds.customerId}/campaignBudgets`,
            creds,
            {
              campaignBudget: {
                name: payload.name,
                amountMicros: payload.amountMicros,
                deliveryMethod: payload.deliveryMethod,
              },
            },
          ),
        );

        return { resourceName: result.resourceName };
      },
    },
    {
      id: "getCampaignMetrics",
      name: "Get Campaign Metrics",
      description: "Fetch impressions, clicks, and conversions for a campaign.",
      inputSchema: campaignMetricsInput,
      execute: async ({ auth, input }) => {
        const payload = campaignMetricsInput.parse(input);
        const creds = resolveCredentials(auth, payload.customerId);

        const query = `SELECT metrics.impressions, metrics.clicks, metrics.conversions, metrics.costMicros
FROM campaign
WHERE campaign.id = ${payload.campaignId}
DURING ${payload.dateRange.startDate},${payload.dateRange.endDate}`;

        const data = await retryManager.run(() =>
          googleAdsRequest<{ results?: Array<Record<string, unknown>> }>(
            "POST",
            `customers/${creds.customerId}/googleAds:search`,
            creds,
            { query },
          ),
        );

        return data.results?.[0]?.metrics ?? {};
      },
    },
  ];

  triggers = [];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      const creds = resolveCredentials(auth);
      await retryManager.run(() =>
        googleAdsRequest(
          "POST",
          `customers/${creds.customerId}/googleAds:search`,
          creds,
          { query: "SELECT customer.id FROM customer LIMIT 1" },
        ),
      );
      return true;
    } catch {
      return false;
    }
  }
}
