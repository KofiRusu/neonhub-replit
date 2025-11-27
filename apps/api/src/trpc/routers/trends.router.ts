import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc.js";
import { trendAgent } from "../../agents/TrendAgent.js";

export const trendsRouter = createTRPCRouter({
  discover: protectedProcedure
    .input(
      z.object({
        niche: z.string().min(3).max(100),
        region: z.string().length(2).default("US"),
        limit: z.number().int().min(1).max(20).default(10),
      }),
    )
    .query(async ({ input, ctx }) => {
      return trendAgent.discoverTrends({
        niche: input.niche,
        region: input.region,
        limit: input.limit,
      }, {
        organizationId: ctx.user?.organizationId ?? undefined,
        userId: ctx.user?.id,
      });
    }),

  subscribe: protectedProcedure
    .input(
      z.object({
        keywords: z.array(z.string().min(2)).min(1).max(20),
        threshold: z.number().int().min(10).max(200).default(50),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return trendAgent.subscribeToTrends({
        userId: ctx.user.id,
        keywords: input.keywords,
        threshold: input.threshold,
      });
    }),

  listSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const subs = await ctx.prisma.agentJob.findMany({
      where: {
        agent: "trend-subscription",
        createdById: ctx.user.id,
      },
      orderBy: { createdAt: "desc" },
    });
    return subs;
  }),
});
