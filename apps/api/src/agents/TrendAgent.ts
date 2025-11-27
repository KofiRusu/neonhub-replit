import { openai as defaultOpenAI } from "../lib/openai.js";
import { prisma as defaultPrisma } from "../db/prisma.js";
import { logger } from "../lib/logger.js";
import { RagContextService } from "../services/rag/context.service.js";
import { KnowledgeBaseService } from "../services/rag/knowledge.service.js";

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
  private readonly ragContext: RagContextService;
  private readonly knowledgeBase: KnowledgeBaseService;

  constructor(
    deps: {
      openai?: typeof defaultOpenAI;
      prisma?: typeof defaultPrisma;
      ragContext?: RagContextService;
      knowledgeBase?: KnowledgeBaseService;
    } = {},
  ) {
    this.openai = deps.openai ?? defaultOpenAI;
    this.prisma = deps.prisma ?? defaultPrisma;
    this.ragContext = deps.ragContext ?? new RagContextService();
    this.knowledgeBase = deps.knowledgeBase ?? new KnowledgeBaseService();
  }

  async discoverTrends({
    niche,
    region = "US",
    limit = 10,
  }: DiscoverTrendsInput, options: { organizationId?: string; userId?: string } = {}): Promise<TrendingKeyword[]> {
    logger.info(
      { niche, region, limit },
      "[TrendAgent] Discovering trends for niche",
    );

    let contextBlock = "";
    if (options.organizationId) {
      const rag = await this.ragContext.build({
        organizationId: options.organizationId,
        query: niche,
        categories: ["trend", "seo"],
        personId: options.userId,
      });
      const prompt = this.ragContext.formatForPrompt(rag);
      if (prompt) {
        contextBlock = `\nGrounding context:\n${prompt}\n`;
      }
    }

    const prompt = `List ${limit} trending topics and keywords in the ${niche} industry for the ${region} market.${contextBlock}Include estimated monthly search volume, trend growth percentage, and 3 related keywords.

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
    const trends: TrendingKeyword[] = Array.isArray(data.trends) ? data.trends : [];

    if (options.organizationId && options.userId && trends.length) {
      try {
        await this.knowledgeBase.ingestSnippet({
          organizationId: options.organizationId,
          datasetSlug: `trend-${options.organizationId}`,
          datasetName: "Trend Knowledge",
          title: `Trend scan ${new Date().toISOString()}`,
          content: trends
            .slice(0, 5)
            .map(
              (trend, index) =>
                `${index + 1}. ${trend.keyword} (${trend.region}) — SV:${trend.searchVolume} Velocity:${trend.trendVelocity}`,
            )
            .join("\n"),
          ownerId: options.userId,
          metadata: {
            agent: "TrendAgent",
            niche,
            region,
          },
        });
      } catch (error) {
        logger.warn({ error }, "Failed to persist trend knowledge");
      }
    }

    return trends;
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
