import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma as defaultPrisma } from "../db/prisma.js";
import { logger } from "../lib/logger.js";

export interface UnderperformingContent {
  contentId?: string | null;
  url: string;
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
  issue: "low_ctr" | "declining_position";
  recommendation: string;
}

export interface IdentifyUnderperformersOptions {
  organizationId: string;
  lookbackDays?: number;
  prisma?: PrismaClient;
}

export interface AutoOptimizeContentOptions {
  contentId: string;
  prisma?: PrismaClient;
}

function groupByUrl(metrics: Array<{ url: string; keyword: string; date: Date; ctr: number; avgPosition: number; impressions: number; clicks: number; contentId: string | null }>) {
  const map = new Map<string, typeof metrics>();
  for (const metric of metrics) {
    const arr = map.get(metric.url) ?? [];
    arr.push(metric);
    map.set(metric.url, arr);
  }
  return map;
}

export async function identifyUnderperformers({
  organizationId,
  lookbackDays = 30,
  prisma = defaultPrisma,
}: IdentifyUnderperformersOptions): Promise<UnderperformingContent[]> {
  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  const metrics = await prisma.sEOMetric.findMany({
    where: {
      organizationId,
      date: {
        gte: since,
      },
    },
    orderBy: [
      { url: "asc" },
      { keyword: "asc" },
      { date: "asc" },
    ],
  });

  if (metrics.length === 0) {
    return [];
  }

  const grouped = groupByUrl(
    metrics.map((metric) => ({
      url: metric.url,
      keyword: metric.keyword,
      date: metric.date,
      ctr: metric.ctr,
      avgPosition: metric.avgPosition,
      impressions: metric.impressions,
      clicks: metric.clicks,
      contentId: metric.contentId ?? null,
    })),
  );

  const underperformers: UnderperformingContent[] = [];

  for (const [, rows] of grouped) {
    const latest = rows[rows.length - 1];
    const first = rows[0];
    const totalImpressions = rows.reduce((acc, row) => acc + row.impressions, 0);
    const totalClicks = rows.reduce((acc, row) => acc + row.clicks, 0);
    const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

    if (totalImpressions >= 1000 && avgCtr < 0.02) {
      underperformers.push({
        contentId: latest.contentId,
        url: latest.url,
        keyword: latest.keyword,
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: Number(avgCtr.toFixed(4)),
        avgPosition: Number(latest.avgPosition.toFixed(2)),
        issue: "low_ctr",
        recommendation: "Refresh title & meta description to improve click-through rate.",
      });
      continue;
    }

    const positionDelta = latest.avgPosition - first.avgPosition;
    if (positionDelta > 3) {
      underperformers.push({
        contentId: latest.contentId,
        url: latest.url,
        keyword: latest.keyword,
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: Number(avgCtr.toFixed(4)),
        avgPosition: Number(latest.avgPosition.toFixed(2)),
        issue: "declining_position",
        recommendation: "Update content for relevancy and add internal links to recover rankings.",
      });
    }
  }

  return underperformers;
}

function mergeMetadata(
  existing: Prisma.JsonValue | null | undefined,
  patch: Record<string, unknown>,
): Prisma.InputJsonValue {
  const base = typeof existing === "object" && existing !== null ? { ...(existing as Record<string, unknown>) } : {};
  return { ...base, ...patch } as Prisma.InputJsonValue;
}

export async function autoOptimizeContent({
  contentId,
  prisma = defaultPrisma,
}: AutoOptimizeContentOptions): Promise<void> {
  const metrics = await prisma.sEOMetric.findMany({
    where: { contentId },
    orderBy: { date: "desc" },
    take: 10,
  });

  if (metrics.length === 0) {
    logger.warn({ contentId }, "[seo-learning] No metrics available for auto-optimisation");
    return;
  }

  const latest = metrics[0];
  const totalImpressions = metrics.reduce((acc, row) => acc + row.impressions, 0);
  const totalClicks = metrics.reduce((acc, row) => acc + row.clicks, 0);
  const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

  const issue = ctr < 0.02 ? "low_ctr" : latest.avgPosition > 10 ? "declining_position" : "stable";

  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { metadata: true },
  });

  if (!content) {
    logger.error({ contentId }, "[seo-learning] Content not found for optimisation");
    return;
  }

  const optimizationRecord = {
    lastRunAt: new Date().toISOString(),
    issue,
    keyword: latest.keyword,
    metrics: {
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr,
      avgPosition: latest.avgPosition,
    },
    suggestedActions:
      issue === "low_ctr"
        ? [
            "Rewrite meta description with stronger value proposition.",
            "Test alternative title tags focusing on primary keyword.",
            "Add rich snippets (FAQ/HowTo) if applicable.",
          ]
        : issue === "declining_position"
          ? [
              "Update content with fresh statistics and examples.",
              "Add 2-3 internal links from high authority pages.",
              "Review backlink profile for loss and address gaps.",
            ]
          : ["Monitor performance – no immediate optimisation required."],
  };

  await prisma.content.update({
    where: { id: contentId },
    data: {
      metadata: mergeMetadata(content.metadata, {
        seoOptimization: optimizationRecord,
      }),
    },
  });

  logger.info(
    { contentId, issue },
    "[seo-learning] Recorded optimisation recommendation for content",
  );
}
