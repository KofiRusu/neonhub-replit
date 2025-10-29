import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { fetchGSCMetrics } from "../../integrations/google-search-console.js";
import { identifyUnderperformers, autoOptimizeContent } from "../../services/seo-learning.js";
import { upsertSearchConsoleMetrics } from "../../services/seo-metrics.js";
import { seoAgent } from "../../agents/SEOAgent.js";
import { fetchGeoPerformance } from "../../services/geo-metrics.js";
import { protectedProcedure, createTRPCRouter } from "../trpc.js";

const personaIdSchema = z.union([z.string(), z.number()]);

async function ensureOrganizationAccess(prisma: PrismaClient, organizationId: string, userId: string) {
  const membership = await prisma.organizationMembership.findFirst({
    where: {
      organizationId,
      userId,
      status: "active",
    },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this organization.",
    });
  }
}

export const seoRouter = createTRPCRouter({
  discoverKeywords: protectedProcedure
    .input(
      z.object({
        seeds: z.array(z.string().min(2).max(120)).min(1).max(25),
        personaId: personaIdSchema.optional(),
        limit: z.number().int().min(10).max(100).optional(),
        competitorDomains: z.array(z.string().url()).max(10).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      seoAgent.discoverKeywords({
        seeds: input.seeds,
        personaId: input.personaId,
        limit: input.limit,
        competitorDomains: input.competitorDomains,
        createdById: ctx.user.id,
      }),
    ),

  analyzeIntent: protectedProcedure
    .input(
      z.object({
        keywords: z.array(z.string().min(1).max(160)).min(1).max(50),
        personaId: personaIdSchema.optional(),
      }),
    )
    .query(async ({ input }) =>
      seoAgent.analyzeIntent({
        keywords: input.keywords,
        personaId: input.personaId,
      }),
    ),

  scoreDifficulty: protectedProcedure
    .input(
      z.object({
        keyword: z.string().min(2).max(200),
        competitorDomains: z.array(z.string().url()).max(10).optional(),
        backlinkCount: z.number().int().min(0).max(100000).optional(),
        domainAuthority: z.number().min(0).max(100).optional(),
      }),
    )
    .query(async ({ input }) =>
      seoAgent.scoreDifficulty({
        keyword: input.keyword,
        competitorDomains: input.competitorDomains,
        backlinkCount: input.backlinkCount,
        domainAuthority: input.domainAuthority,
      }),
    ),

  discoverOpportunities: protectedProcedure
    .input(
      z.object({
        personaId: personaIdSchema.optional(),
        limit: z.number().int().min(5).max(50).optional(),
        includeSeeds: z.array(z.string().min(2).max(120)).max(10).optional(),
      }),
    )
    .query(async ({ input }) => seoAgent.discoverOpportunities(input)),

  getGeoPerformance: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().cuid(),
        contentId: z.string().cuid().optional(),
        dateRange: z.object({
          start: z.string().transform((value) => new Date(value)),
          end: z.string().transform((value) => new Date(value)),
        }),
      }),
    )
    .query(async ({ input, ctx }) => {
      await ensureOrganizationAccess(ctx.prisma, input.organizationId, ctx.user.id);

      return fetchGeoPerformance({
        organizationId: input.organizationId,
        contentId: input.contentId,
        dateRange: {
          start: input.dateRange.start,
          end: input.dateRange.end,
        },
      });
    }),

  getMetrics: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().cuid(),
        siteUrl: z.string().url(),
        startDate: z.string().transform((value) => new Date(value)).optional(),
        endDate: z.string().transform((value) => new Date(value)).optional(),
        refresh: z.boolean().default(true),
      }),
    )
    .query(async ({ input, ctx }) => {
      await ensureOrganizationAccess(ctx.prisma, input.organizationId, ctx.user.id);

      const start = input.startDate ?? new Date(new Date().setDate(new Date().getDate() - 7));
      const end = input.endDate ?? new Date();

      if (input.refresh) {
        const metrics = await fetchGSCMetrics({
          organizationId: input.organizationId,
          siteUrl: input.siteUrl,
          startDate: start,
          endDate: end,
          prisma: ctx.prisma,
        });

        await upsertSearchConsoleMetrics(input.organizationId, metrics, ctx.prisma);
      }

      return ctx.prisma.sEOMetric.findMany({
        where: {
          organizationId: input.organizationId,
          date: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
        orderBy: { date: "desc" },
        take: 250,
      });
    }),

  getTrends: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().cuid(),
        lookbackDays: z.number().int().min(7).max(90).default(30),
      }),
    )
    .query(async ({ input, ctx }) => {
      await ensureOrganizationAccess(ctx.prisma, input.organizationId, ctx.user.id);

      const since = new Date();
      since.setDate(since.getDate() - input.lookbackDays);

      const metrics = await ctx.prisma.sEOMetric.findMany({
        where: {
          organizationId: input.organizationId,
          date: { gte: since },
        },
      });

      const trends = new Map<
        string,
        {
          impressions: number;
          clicks: number;
          avgPosition: number;
          ctr: number;
          occurrences: number;
        }
      >();

      for (const metric of metrics) {
        const entry = trends.get(metric.keyword) ?? {
          impressions: 0,
          clicks: 0,
          avgPosition: 0,
          ctr: 0,
          occurrences: 0,
        };
        entry.impressions += metric.impressions;
        entry.clicks += metric.clicks;
        entry.avgPosition += metric.avgPosition;
        entry.ctr += metric.ctr;
        entry.occurrences += 1;
        trends.set(metric.keyword, entry);
      }

      return Array.from(trends.entries())
        .map(([keyword, stats]) => ({
          keyword,
          impressions: stats.impressions,
          clicks: stats.clicks,
          avgPosition: stats.occurrences ? stats.avgPosition / stats.occurrences : 0,
          ctr: stats.occurrences ? stats.ctr / stats.occurrences : 0,
        }))
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 25);
    }),

  identifyUnderperformers: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().cuid(),
        lookbackDays: z.number().int().min(7).max(90).default(30),
      }),
    )
    .query(async ({ input, ctx }) => {
      await ensureOrganizationAccess(ctx.prisma, input.organizationId, ctx.user.id);
      return identifyUnderperformers({
        organizationId: input.organizationId,
        lookbackDays: input.lookbackDays,
        prisma: ctx.prisma,
      });
    }),

  triggerOptimization: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().cuid(),
        contentId: z.string().cuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ensureOrganizationAccess(ctx.prisma, input.organizationId, ctx.user.id);
      await autoOptimizeContent({ contentId: input.contentId, prisma: ctx.prisma });
      return { success: true };
    }),
});
