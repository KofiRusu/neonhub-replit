import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const credentialsSchema = z.object({
  accessToken: z.string().min(1, "TikTok Marketing API access token is required"),
  advertiserId: z.string().min(1, "Advertiser ID is required"),
});

const createCampaignInput = z.object({
  advertiserId: z.string().optional(),
  campaignName: z.string().min(1, "Campaign name is required"),
  objectiveType: z.enum(["TRAFFIC", "LEAD_GENERATION", "CONVERSIONS"]).default("TRAFFIC"),
  budgetMode: z.enum(["BUDGET_MODE_DAY", "BUDGET_MODE_TOTAL"]).default("BUDGET_MODE_DAY"),
  budget: z.number().min(0, "Budget must be positive"),
});

const createAdGroupInput = z.object({
  advertiserId: z.string().optional(),
  campaignId: z.string().min(1, "Campaign ID is required"),
  adGroupName: z.string().min(1, "Ad group name is required"),
  placementType: z.enum(["PLACEMENT_NORMAL", "PLACEMENT_AUTOMATIC"]).default("PLACEMENT_AUTOMATIC"),
  optimizationGoal: z
    .enum(["OPTIMIZATION_GOAL_CONVERSIONS", "OPTIMIZATION_GOAL_CLICKS", "OPTIMIZATION_GOAL_IMPRESSIONS"])
    .default("OPTIMIZATION_GOAL_CONVERSIONS"),
  billingEvent: z.enum(["BILLINGEVENT_CLICK", "BILLINGEVENT_IMPRESSION"]).default("BILLINGEVENT_CLICK"),
  bid: z.number().positive("Bid must be greater than 0"),
});

const reportInsightsInput = z.object({
  advertiserId: z.string().optional(),
  startDate: z.string().min(8, "Start date (YYYY-MM-DD) is required"),
  endDate: z.string().min(8, "End date (YYYY-MM-DD) is required"),
  metrics: z
    .array(
      z.enum([
        "spend",
        "impressions",
        "clicks",
        "conversion",
        "cpc",
        "ctr",
        "cpm",
      ]),
    )
    .default(["spend", "impressions", "clicks", "conversion"]),
  orderType: z.enum(["ASC", "DESC"]).default("DESC"),
  limit: z.number().min(1).max(100).default(10),
});

interface TikTokCredentials {
  accessToken: string;
  advertiserId: string;
}

function resolveCredentials(auth: ConnectorAuthContext, overrideAdvertiserId?: string): TikTokCredentials {
  const accessToken = auth.accessToken ?? auth.apiKey;
  const advertiserId = overrideAdvertiserId ?? (auth.metadata?.advertiserId as string | undefined);

  const parsed = credentialsSchema.parse({ accessToken, advertiserId });

  return {
    accessToken: parsed.accessToken,
    advertiserId: parsed.advertiserId,
  };
}

async function tiktokRequest<T>(
  path: string,
  creds: TikTokCredentials,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`https://business-api.tiktok.com/open_api/v1.3/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Token": creds.accessToken,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`TikTok API error ${response.status}`);
  }

  const payload = (await response.json()) as {
    code: number;
    message: string;
    data?: T;
  };

  if (payload.code !== 0) {
    throw new Error(payload.message || "TikTok API request failed");
  }

  return payload.data as T;
}

export class TikTokConnector extends Connector {
  constructor() {
    super({
      name: "tiktok",
      displayName: "TikTok Ads",
      description: "Automate TikTok campaign creation and performance insights.",
      category: "TIKTOK",
      iconUrl: "https://www.tiktok.com/favicon.ico",
      websiteUrl: "https://ads.tiktok.com",
      authType: "oauth2",
      authConfig: {
        instructions:
          "Provide a TikTok Marketing API access token with advertiser scope. Set advertiser ID using metadata.advertiserId if not supplied per request.",
      },
    });
  }

  actions = [
    {
      id: "createCampaign",
      name: "Create Campaign",
      description: "Create a TikTok Ads campaign with objective and budget configuration.",
      inputSchema: createCampaignInput,
      execute: async ({ auth, input }) => {
        const payload = createCampaignInput.parse(input);
        const creds = resolveCredentials(auth, payload.advertiserId);

        const result = await retryManager.run(() =>
          tiktokRequest<{ campaign_id: string }>("campaign/create/", creds, {
            advertiser_id: creds.advertiserId,
            objective_type: payload.objectiveType,
            campaign_name: payload.campaignName,
            budget_mode: payload.budgetMode,
            budget: payload.budget,
          }),
        );

        return {
          campaignId: result.campaign_id,
        };
      },
    },
    {
      id: "createAdGroup",
      name: "Create Ad Group",
      description: "Create an ad group under an existing campaign.",
      inputSchema: createAdGroupInput,
      execute: async ({ auth, input }) => {
        const payload = createAdGroupInput.parse(input);
        const creds = resolveCredentials(auth, payload.advertiserId);

        const result = await retryManager.run(() =>
          tiktokRequest<{ adgroup_id: string }>("adgroup/create/", creds, {
            advertiser_id: creds.advertiserId,
            campaign_id: payload.campaignId,
            adgroup_name: payload.adGroupName,
            placement_type: payload.placementType,
            optimization_goal: payload.optimizationGoal,
            billing_event: payload.billingEvent,
            bid: payload.bid,
          }),
        );

        return {
          adGroupId: result.adgroup_id,
        };
      },
    },
    {
      id: "getPerformanceReport",
      name: "Get Performance Report",
      description: "Fetch aggregated performance metrics for a date range.",
      inputSchema: reportInsightsInput,
      execute: async ({ auth, input }) => {
        const payload = reportInsightsInput.parse(input);
        const creds = resolveCredentials(auth, payload.advertiserId);

        const data = await retryManager.run(() =>
          tiktokRequest<{
            list: Array<Record<string, unknown>>;
          }>("report/integrated/get/", creds, {
            advertiser_id: creds.advertiserId,
            report_type: "BASIC",
            data_level: "AUCTION_CAMPAIGN",
            start_date: payload.startDate,
            end_date: payload.endDate,
            metrics: payload.metrics,
            order_field: payload.metrics[0] ?? "spend",
            order_type: payload.orderType,
            page_size: payload.limit,
            page: 1,
          }),
        );

        return data.list ?? [];
      },
    },
  ];

  triggers = [];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      const creds = resolveCredentials(auth);
      await retryManager.run(() =>
        tiktokRequest("campaign/get/", creds, {
          advertiser_id: creds.advertiserId,
          page_size: 1,
          page: 1,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
