import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { ValidationError } from "../lib/errors.js";
import { broadcast } from "../ws/index.js";
import { logger } from "../lib/logger.js";
import { MetricEventInputSchema, MetricsSummaryQuerySchema } from "./metrics.schemas.js";
import { getAuthenticatedUserId } from "../lib/requestUser.js";

export const metricsRouter = Router();

// Track an event
metricsRouter.post("/metrics/events", async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = MetricEventInputSchema.safeParse(req.body);
    
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const { type, meta } = result.data;
    const metaPayload = (
      meta && typeof meta === 'object' && !Array.isArray(meta)
    ) ? { ...meta } : {};

    const event = await prisma.metricEvent.create({
      data: {
        type,
        meta: { ...metaPayload, userId },
      },
    });

    logger.debug({ eventId: event.id, type }, "Event tracked");

    // Broadcast event to connected clients
    broadcast("metric:event", {
      id: event.id,
      type,
      timestamp: event.createdAt,
      userId,
    });

    // Also broadcast delta for live updates
    broadcast("metrics:delta", {
      type,
      increment: 1,
      timestamp: new Date(),
      userId,
    });

    res.json({
      success: true,
      data: { id: event.id, type },
    });
  } catch (error) {
    next(error);
  }
});

// Get event summary/analytics
metricsRouter.get("/metrics/summary", async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    // Validate query params
    const queryResult = MetricsSummaryQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw new ValidationError(queryResult.error.errors[0].message);
    }

    const { range } = queryResult.data;
    
    // Calculate date range
    const now = new Date();
    const hoursAgo = range === "24h" ? 24 : range === "7d" ? 24 * 7 : 24 * 30;
    const startDate = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    logger.debug({ range, startDate }, "Fetching metrics summary");

    const ownershipFilter = {
      OR: [
        { meta: { path: ["userId"], equals: userId } },
        { meta: { path: ["tenantId"], equals: userId } },
      ],
    };

    const eventWhere = {
      AND: [{ createdAt: { gte: startDate } }, ownershipFilter],
    };

    const jobBaseWhere = {
      createdById: userId,
      createdAt: {
        gte: startDate,
      },
    };

    // Get event counts by type
    const events = await prisma.metricEvent.groupBy({
      by: ["type"],
      where: eventWhere,
      _count: {
        id: true,
      },
    });

    // Get total events
    const totalEvents = await prisma.metricEvent.count({
      where: eventWhere,
    });

    // Get agent job stats
    const [successfulJobs, erroredJobs, totalJobs] = await Promise.all([
      prisma.agentJob.count({
        where: {
          ...jobBaseWhere,
          status: "success",
        },
      }),
      prisma.agentJob.count({
        where: {
          ...jobBaseWhere,
          status: "error",
        },
      }),
      prisma.agentJob.count({
        where: jobBaseWhere,
      }),
    ]);

    // Calculate average job latency from successful jobs with metrics
    const recentJobs = await prisma.agentJob.findMany({
      where: {
        ...jobBaseWhere,
        status: "success",
      },
      select: {
        metrics: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Last 100 for average
    });

    // Filter jobs with metrics and calculate average
    const jobsWithDuration = recentJobs.filter((job: { metrics: any }) => {
      const metrics = job.metrics as any;
      return metrics && typeof metrics.duration === "number";
    });

    let avgJobLatencyMs = 0;
    if (jobsWithDuration.length > 0) {
      const totalLatency = jobsWithDuration.reduce((sum: number, job: { metrics: any }) => {
        const metrics = job.metrics as any;
        return sum + (metrics?.duration || 0);
      }, 0);
      avgJobLatencyMs = Math.round(totalLatency / jobsWithDuration.length);
    }

    // Get content drafts
    const draftsCreated = await prisma.contentDraft.count({
      where: {
        createdById: userId,
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Extract specific event types
    const eventCounts = events.reduce((acc: Record<string, number>, e: { type: string; _count: { id: number } }) => {
      acc[e.type] = e._count.id;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        timeRange: range,
        startDate: startDate.toISOString(),
        totalEvents,
        draftsCreated,
        jobs: {
          total: totalJobs,
          successful: successfulJobs,
          errored: erroredJobs,
          successRate: totalJobs > 0 ? Math.round((successfulJobs / totalJobs) * 100) : 0,
          avgLatencyMs: avgJobLatencyMs,
        },
        events: {
          opens: eventCounts.open || 0,
          clicks: eventCounts.click || 0,
          conversions: eventCounts.conversion || 0,
          pageViews: eventCounts.page_view || 0,
        },
        eventsByType: events.map((e: { type: string; _count: { id: number } }) => ({
          type: e.type,
          count: e._count.id,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});
