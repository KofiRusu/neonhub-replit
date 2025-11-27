import { RunStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc.js";

const listRunsInput = z.object({
  limit: z.number().int().min(1).max(100).default(25),
  status: z.nativeEnum(RunStatus).optional(),
});

const getRunInput = z.object({
  id: z.string().cuid("Run id must be a valid cuid"),
});

const listStepsInput = z.object({
  runId: z.string().cuid("Run id must be a valid cuid"),
});

const statsInput = z.object({
  windowHours: z.number().int().min(1).max(72).default(24),
});

const toClientStatus = (status: RunStatus): Lowercase<RunStatus> => status.toLowerCase() as Lowercase<RunStatus>;

export const agentRunsRouter = createTRPCRouter({
  list: protectedProcedure.input(listRunsInput).query(async ({ ctx, input }) => {
    const organizationId =
      typeof ctx.user?.organizationId === "string" && ctx.user.organizationId.trim().length > 0
        ? ctx.user.organizationId
        : null;

    if (!organizationId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Authenticated user is missing an organization context.",
      });
    }

    const runs = await ctx.prisma.agentRun.findMany({
      where: {
        organizationId,
        ...(input.status ? { status: input.status } : {}),
      },
      select: {
        id: true,
        agentId: true,
        status: true,
        startedAt: true,
        completedAt: true,
        durationMs: true,
        objective: true,
        errorMessage: true,
        metrics: true,
        agent: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      take: input.limit,
    });

    return runs.map(run => ({
      id: run.id,
      agentId: run.agentId,
      agentName: run.agent?.name ?? run.agentId,
      status: toClientStatus(run.status),
      startedAt: run.startedAt,
      finishedAt: run.completedAt,
      durationMs: run.durationMs,
      objective: run.objective,
      errorMessage: run.errorMessage,
      intent: (run.metrics as Record<string, unknown> | null)?.intent ?? null,
    }));
  }),

  get: protectedProcedure.input(getRunInput).query(async ({ ctx, input }) => {
    const organizationId =
      typeof ctx.user?.organizationId === "string" && ctx.user.organizationId.trim().length > 0
        ? ctx.user.organizationId
        : null;

    if (!organizationId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Authenticated user is missing an organization context.",
      });
    }

    const run = await ctx.prisma.agentRun.findFirst({
      where: {
        id: input.id,
        organizationId,
      },
      include: {
        steps: {
          orderBy: { startedAt: "asc" },
        },
        agent: {
          select: { name: true },
        },
      },
    });

    if (!run) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Agent run not found",
      });
    }

    return {
      id: run.id,
      agentId: run.agentId,
      agentName: run.agent?.name ?? run.agentId,
      status: toClientStatus(run.status),
      startedAt: run.startedAt,
      finishedAt: run.completedAt,
      durationMs: run.durationMs,
      objective: run.objective,
      errorMessage: run.errorMessage,
      input: run.input,
      output: run.output,
      meta: run.meta,
      metrics: run.metrics,
      steps: run.steps.map(step => ({
        id: step.id,
        name: step.name,
        status: toClientStatus(step.status),
        startedAt: step.startedAt,
        finishedAt: step.completedAt,
        durationMs: step.durationMs,
        payload: step.payload,
        result: step.result,
        error: step.error,
      })),
    };
  }),

  steps: protectedProcedure.input(listStepsInput).query(async ({ ctx, input }) => {
    const organizationId =
      typeof ctx.user?.organizationId === "string" && ctx.user.organizationId.trim().length > 0
        ? ctx.user.organizationId
        : null;

    if (!organizationId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Authenticated user is missing an organization context.",
      });
    }

    const run = await ctx.prisma.agentRun.findUnique({
      where: { id: input.runId },
      select: { organizationId: true },
    });

    if (!run || run.organizationId !== organizationId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Agent run not found",
      });
    }

    const steps = await ctx.prisma.runStep.findMany({
      where: { runId: input.runId },
      orderBy: { startedAt: "asc" },
    });

    return steps.map(step => ({
      id: step.id,
      name: step.name,
      status: toClientStatus(step.status),
      startedAt: step.startedAt,
      finishedAt: step.completedAt,
      durationMs: step.durationMs,
      payload: step.payload,
      result: step.result,
      error: step.error,
    }));
  }),

  stats: protectedProcedure.input(statsInput).query(async ({ ctx, input }) => {
    const organizationId =
      typeof ctx.user?.organizationId === "string" && ctx.user.organizationId.trim().length > 0
        ? ctx.user.organizationId
        : null;

    if (!organizationId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Authenticated user is missing an organization context.",
      });
    }

    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - input.windowHours * 60 * 60 * 1000);

    const runs = await ctx.prisma.agentRun.findMany({
      where: {
        organizationId,
        startedAt: {
          gte: windowStart,
        },
      },
      select: {
        status: true,
        durationMs: true,
        completedAt: true,
      },
    });

    const totals = {
      success: 0,
      failed: 0,
      cancelled: 0,
      running: 0,
      pending: 0,
    };

    let durationAccumulator = 0;
    let durationSamples = 0;

    for (const run of runs) {
      switch (run.status) {
        case RunStatus.SUCCESS:
          totals.success += 1;
          break;
        case RunStatus.FAILED:
          totals.failed += 1;
          break;
        case RunStatus.CANCELLED:
          totals.cancelled += 1;
          break;
        case RunStatus.RUNNING:
          totals.running += 1;
          break;
        case RunStatus.PENDING:
          totals.pending += 1;
          break;
      }

      if (typeof run.durationMs === "number" && run.completedAt) {
        durationAccumulator += run.durationMs;
        durationSamples += 1;
      }
    }

    const avgDurationMs = durationSamples > 0 ? Math.round(durationAccumulator / durationSamples) : 0;

    return {
      windowStart,
      windowEnd,
      totals,
      avgDurationMs,
    };
  }),
});
