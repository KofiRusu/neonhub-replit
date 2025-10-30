import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const credentialsSchema = z.object({
  accessToken: z.string().min(1, "LinkedIn access token is required"),
  organizationUrn: z.string().min(1, "Organization URN is required"),
  adAccountUrn: z.string().optional(),
});

const shareUpdateInput = z.object({
  organizationUrn: z.string().optional(),
  text: z.string().min(1, "Share text is required"),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        title: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .default([]),
  visibility: z.enum(["PUBLIC", "CONNECTIONS"]).default("PUBLIC"),
});

const createCampaignInput = z.object({
  adAccountUrn: z.string().optional(),
  name: z.string().min(1, "Campaign name is required"),
  objectiveType: z.enum(["BRAND_AWARENESS", "LEAD_GENERATION", "WEBSITE_VISITS"]).default("LEAD_GENERATION"),
  dailyBudget: z.number().positive("Daily budget must be positive"),
  startDate: z.string().min(8),
  endDate: z.string().min(8).optional(),
});

const shareStatsInput = z.object({
  organizationUrn: z.string().optional(),
  start: z.number().int().optional(),
  end: z.number().int().optional(),
});

interface LinkedInCredentials {
  accessToken: string;
  organizationUrn: string;
  adAccountUrn?: string;
}

function resolveCredentials(auth: ConnectorAuthContext, overrides?: Partial<LinkedInCredentials>): LinkedInCredentials {
  const accessToken = auth.accessToken ?? auth.apiKey;
  const organizationUrn =
    overrides?.organizationUrn ?? (auth.metadata?.organizationUrn as string | undefined);
  const adAccountUrn = overrides?.adAccountUrn ?? (auth.metadata?.adAccountUrn as string | undefined);

  const parsed = credentialsSchema.parse({ accessToken, organizationUrn, adAccountUrn });

  return {
    accessToken: parsed.accessToken,
    organizationUrn: parsed.organizationUrn,
    adAccountUrn: parsed.adAccountUrn,
  };
}

async function linkedinRequest<T>(
  creds: LinkedInCredentials,
  input: {
    url: string;
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
    query?: URLSearchParams;
    rest?: boolean;
  },
): Promise<T> {
  const targetUrl = new URL(input.url);
  if (input.query) {
    targetUrl.search = input.query.toString();
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${creds.accessToken}`,
    "Content-Type": "application/json",
  };

  if (input.rest) {
    headers["X-Restli-Protocol-Version"] = "2.0.0";
  }

  const response = await fetch(targetUrl.toString(), {
    method: input.method ?? "POST",
    headers,
    body: input.body ? JSON.stringify(input.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`LinkedIn API error ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export class LinkedInConnector extends Connector {
  constructor() {
    super({
      name: "linkedin",
      displayName: "LinkedIn",
      description: "Publish organic updates and manage advertising campaigns on LinkedIn.",
      category: "LINKEDIN",
      iconUrl: "https://static.licdn.com/scds/common/u/images/logos/favicons/v1/favicon.ico",
      websiteUrl: "https://www.linkedin.com/developers/",
      authType: "oauth2",
      authConfig: {
        instructions:
          "Provide a LinkedIn Marketing Developer access token. Set organization/ad account URNs via metadata.",
      },
    });
  }

  actions = [
    {
      id: "shareUpdate",
      name: "Share Update",
      description: "Publish an organization update to the company page feed.",
      inputSchema: shareUpdateInput,
      execute: async ({ auth, input }) => {
        const payload = shareUpdateInput.parse(input);
        const creds = resolveCredentials(auth, { organizationUrn: payload.organizationUrn });

        const body: Record<string, unknown> = {
          author: creds.organizationUrn,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: payload.text },
              shareMediaCategory: payload.media.length > 0 ? "ARTICLE" : "NONE",
              media: payload.media.map(item => ({
                status: "READY",
                originalUrl: item.url,
                title: item.title ? { text: item.title } : undefined,
                description: item.description ? { text: item.description } : undefined,
              })),
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": payload.visibility,
          },
        };

        const result = await retryManager.run(() =>
          linkedinRequest<{ id: string }>(creds, {
            url: "https://api.linkedin.com/v2/ugcPosts",
            body,
          }),
        );

        return { postUrn: result.id };
      },
    },
    {
      id: "createAdCampaign",
      name: "Create Ad Campaign",
      description: "Create a Sponsored Content campaign within the ad account.",
      inputSchema: createCampaignInput,
      execute: async ({ auth, input }) => {
        const payload = createCampaignInput.parse(input);
        const creds = resolveCredentials(auth, {
          adAccountUrn: payload.adAccountUrn,
        });

        if (!creds.adAccountUrn) {
          throw new Error("LinkedIn ad account URN is required (metadata.adAccountUrn or input.adAccountUrn)");
        }

        const result = await retryManager.run(() =>
          linkedinRequest<{ id: string }>(creds, {
            url: "https://api.linkedin.com/rest/adCampaigns",
            rest: true,
            body: {
              account: creds.adAccountUrn,
              name: payload.name,
              objectiveType: payload.objectiveType,
              dailyBudget: {
                currencyCode: "USD",
                amount: payload.dailyBudget,
              },
              startDate: payload.startDate,
              endDate: payload.endDate,
              status: "ACTIVE",
            },
          }),
        );

        return { campaignUrn: result.id };
      },
    },
    {
      id: "getShareStatistics",
      name: "Get Share Statistics",
      description: "Retrieve aggregated share statistics for the organization.",
      inputSchema: shareStatsInput,
      execute: async ({ auth, input }) => {
        const payload = shareStatsInput.parse(input);
        const creds = resolveCredentials(auth, { organizationUrn: payload.organizationUrn });

        const params = new URLSearchParams();
        params.set("q", "organizationalEntity");
        params.set("organizationalEntity", creds.organizationUrn);
        if (payload.start) params.set("timeIntervals.timeGranularityType", "DAY");
        if (payload.start) params.set("timeIntervals.timeRange.start", String(payload.start));
        if (payload.end) params.set("timeIntervals.timeRange.end", String(payload.end));

        const result = await retryManager.run(() =>
          linkedinRequest<{ elements?: Array<Record<string, unknown>> }>(creds, {
            url: "https://api.linkedin.com/v2/organizationalEntityShareStatistics",
            method: "GET",
            query: params,
          }),
        );

        return result.elements ?? [];
      },
    },
  ];

  triggers = [];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      const creds = resolveCredentials(auth);
      await retryManager.run(() =>
        linkedinRequest(
          creds,
          {
            url: "https://api.linkedin.com/v2/organizations",
            method: "GET",
            query: new URLSearchParams({
              q: "organization",
              organization: creds.organizationUrn,
            }),
          },
        ),
      );
      return true;
    } catch {
      return false;
    }
  }
}
