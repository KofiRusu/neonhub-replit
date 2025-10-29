import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../db/prisma.js";
import type { SearchConsoleMetric } from "../integrations/google-search-console.js";

export async function upsertSearchConsoleMetrics(
  organizationId: string,
  metrics: SearchConsoleMetric[],
  prisma: PrismaClient = defaultPrisma,
): Promise<void> {
  for (const metric of metrics) {
    await prisma.sEOMetric.upsert({
      where: {
        organizationId_url_keyword_date: {
          organizationId,
          url: metric.url,
          keyword: metric.keyword,
          date: metric.date,
        },
      },
      update: {
        impressions: metric.impressions,
        clicks: metric.clicks,
        ctr: metric.ctr,
        avgPosition: metric.avgPosition,
      },
      create: {
        organizationId,
        contentId: null,
        url: metric.url,
        keyword: metric.keyword,
        impressions: metric.impressions,
        clicks: metric.clicks,
        ctr: metric.ctr,
        avgPosition: metric.avgPosition,
        date: metric.date,
      },
    });
  }
}
