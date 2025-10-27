import { socialApiClient } from "../lib/socialApiClient.js";
import { logger } from "../lib/logger.js";

type SupportedPlatform = "twitter" | "reddit";

interface TrendSummary {
  keyword: string;
  volume: number;
  sentiment: number;
  platform: SupportedPlatform;
  timestamp: Date;
}

interface TrendBriefInput {
  notes?: string;
  platforms?: SupportedPlatform[];
  timeframe?: string;
}

function pickTopTrends(trends: TrendSummary[], limit = 5) {
  return trends
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit)
    .map(trend => ({
      keyword: trend.keyword,
      platform: trend.platform,
      volume: trend.volume,
      sentiment: trend.sentiment,
      timestamp: trend.timestamp.toISOString(),
    }));
}

function computePlatformMetrics(trends: TrendSummary[]) {
  const metrics: Record<SupportedPlatform, { volume: number; count: number; avgSentiment: number }> = {
    twitter: { volume: 0, count: 0, avgSentiment: 0 },
    reddit: { volume: 0, count: 0, avgSentiment: 0 },
  };

  for (const trend of trends) {
    const bucket = metrics[trend.platform];
    bucket.volume += trend.volume;
    bucket.count += 1;
    bucket.avgSentiment += trend.sentiment;
  }

  for (const platform of Object.keys(metrics) as SupportedPlatform[]) {
    const bucket = metrics[platform];
    bucket.avgSentiment = bucket.count === 0 ? 0 : bucket.avgSentiment / bucket.count;
  }

  return metrics;
}

function buildRecommendations(topTrends: ReturnType<typeof pickTopTrends>) {
  return topTrends.map(trend => {
    if (trend.platform === "twitter") {
      return {
        action: `Publish a Twitter thread expanding on "${trend.keyword}"` ,
        priority: trend.volume > 10000 ? "high" : "medium",
        rationale: "High conversation volume detected on Twitter. Amplify momentum with timely thought leadership content.",
      };
    }

    return {
      action: `Launch a Reddit AMA focused on "${trend.keyword}"`,
      priority: trend.volume > 6000 ? "high" : "medium",
      rationale: "Reddit communities are actively discussing this topic. Engage directly to capture insights and signal expertise.",
    };
  });
}

export async function brief(input: TrendBriefInput) {
  const { notes, platforms, timeframe } = input;

  const allowedPlatforms: SupportedPlatform[] = platforms && platforms.length > 0 ? platforms : ["twitter", "reddit"];

let trends: TrendSummary[] = [];
  try {
    const aggregated = await socialApiClient.aggregateTrends();
    trends = aggregated.filter(trend => allowedPlatforms.includes(trend.platform));
  } catch (error) {
    logger.error({ error }, "Failed to aggregate trends; falling back to mock data");
    trends = [];
  }

  const topTrends = pickTopTrends(trends);
  const platformMetrics = computePlatformMetrics(trends);

  return {
    timeframe: timeframe ?? "last 24 hours",
    generatedAt: new Date().toISOString(),
    topTrends,
    summary: {
      totalSignals: trends.length,
      platforms: platformMetrics,
    },
    recommendations: buildRecommendations(topTrends),
    notes: notes ?? null,
  };
}

export async function getTrendsByPlatform(platform: SupportedPlatform, options?: { limit?: number }) {
  const limit = options?.limit ?? 25;
  if (platform === "twitter") {
    const trends = await socialApiClient.fetchTwitterTrends();
    return trends.slice(0, limit);
  }

  const trends = await socialApiClient.fetchRedditTrends();
  return trends.slice(0, limit);
}

export async function searchTrends(query: string) {
  const lowerQuery = query.toLowerCase();
  const aggregated = await socialApiClient.aggregateTrends();
  return aggregated.filter(trend => trend.keyword.toLowerCase().includes(lowerQuery));
}
