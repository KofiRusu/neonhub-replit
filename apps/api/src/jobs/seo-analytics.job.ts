import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../db/prisma.js";
import { logger } from "../lib/logger.js";
import { fetchGSCMetrics } from "../integrations/google-search-console.js";
import { identifyUnderperformers } from "../services/seo-learning.js";
import { upsertSearchConsoleMetrics } from "../services/seo-metrics.js";

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function fetchActiveSearchConsoleAuths(prisma: PrismaClient) {
  return prisma.connectorAuth.findMany({
    where: {
      status: "active",
      connector: {
        name: "google-search-console",
      },
    },
    select: {
      id: true,
      organizationId: true,
      metadata: true,
    },
  });
}

export async function runSeoAnalyticsSync(prisma: PrismaClient = defaultPrisma): Promise<void> {
  const auths = await fetchActiveSearchConsoleAuths(prisma);

  if (auths.length === 0) {
    logger.debug("[seo-analytics] No active Google Search Console connectors detected");
    return;
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date();

  for (const auth of auths) {
    const siteUrl =
      (auth.metadata && typeof auth.metadata === "object" && (auth.metadata as Record<string, unknown>).siteUrl) ||
      (auth.metadata && typeof auth.metadata === "object" && (auth.metadata as Record<string, unknown>).propertyUrl) ||
      null;

    if (!siteUrl || typeof siteUrl !== "string") {
      logger.warn({ connectorAuthId: auth.id }, "[seo-analytics] Missing siteUrl metadata; skipping sync");
      continue;
    }

    const organizationId = auth.organizationId;
    if (!organizationId) {
      logger.warn({ connectorAuthId: auth.id }, "[seo-analytics] Connector auth missing organizationId");
      continue;
    }

    try {
      const metrics = await fetchGSCMetrics({
        organizationId,
        siteUrl,
        startDate,
        endDate,
        prisma,
      });

      await upsertSearchConsoleMetrics(organizationId, metrics, prisma);

      logger.info(
        { organizationId, metricsCount: metrics.length },
        "[seo-analytics] Synced Google Search Console metrics",
      );

      const underperformers = await identifyUnderperformers({
        organizationId,
        prisma,
      });

      if (underperformers.length) {
        logger.info(
          { organizationId: auth.organizationId, underperformers: underperformers.slice(0, 5) },
          "[seo-analytics] Underperforming content detected",
        );
      }
    } catch (error) {
      logger.error({ error, connectorAuthId: auth.id }, "[seo-analytics] Failed to sync analytics");
    }
  }
}

export function startSeoAnalyticsJob(prisma: PrismaClient = defaultPrisma): void {
  const execute = () => {
    runSeoAnalyticsSync(prisma).catch((error) => {
      logger.error({ error }, "[seo-analytics] Scheduled sync failed");
    });
  };

  // Run at startup
  setTimeout(execute, 5_000);
  // Schedule daily
  setInterval(execute, SYNC_INTERVAL_MS);
}
