import { openai as defaultOpenAI } from "../lib/openai.js";
import { prisma as defaultPrisma } from "../db/prisma.js";
import { logger } from "../lib/logger.js";

export interface TrendingKeyword {
  keyword: string;
  searchVolume: number;
  trendVelocity: number;
  region: string;
  relatedKeywords: string[];
}

interface DiscoverTrendsInput {
  niche: string;
  region?: string;
  limit?: number;
}

interface SubscribeToTrendsInput {
  userId: string;
  keywords: string[];
  threshold?: number;
}

export class TrendAgent {
  private readonly openai: typeof defaultOpenAI;
  private readonly prisma: typeof defaultPrisma;

  constructor(deps: { openai?: typeof defaultOpenAI; prisma?: typeof defaultPrisma } = {}) {
    this.openai = deps.openai ?? defaultOpenAI;
    this.prisma = deps.prisma ?? defaultPrisma;
  }

  async discoverTrends({
    niche,
    region = "US",
    limit = 10,
  }: DiscoverTrendsInput): Promise<TrendingKeyword[]> {
    logger.info(
      { niche, region, limit },
      "[TrendAgent] Discovering trends for niche",
    );

    const prompt = `List ${limit} trending topics and keywords in the ${niche} industry for the ${region} market. Include estimated monthly search volume, trend growth percentage, and 3 related keywords.

Return JSON with property "trends":
{
  "trends": [
    {
      "keyword": "string",
      "searchVolume": number,
      "trendVelocity": number,
      "region": "${region}",
      "relatedKeywords": ["array", "of", "related", "terms"]
    }
  ]
}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const data = JSON.parse(response.choices[0]?.message?.content ?? "{}");
    return Array.isArray(data.trends) ? data.trends : [];
  }

  async subscribeToTrends({
    userId,
    keywords,
    threshold = 50,
  }: SubscribeToTrendsInput): Promise<string> {
    logger.info(
      { userId, keywords, threshold },
      "[TrendAgent] Creating trend subscription",
    );

    const membership = await this.prisma.organizationMembership.findFirst({
      where: { userId },
      select: { organizationId: true },
    });

    const subscription = await this.prisma.agentJob.create({
      data: {
        agent: "trend-subscription",
        organizationId: membership?.organizationId ?? undefined,
        status: "queued",
        createdById: userId,
        input: {
          type: "trend_subscription",
          keywords,
          threshold,
        },
      },
    });

    return subscription.id;
  }

  async checkSubscriptions(): Promise<void> {
    logger.info("[TrendAgent] Checking trend subscriptions");
  }
}

export const trendAgent = new TrendAgent();
