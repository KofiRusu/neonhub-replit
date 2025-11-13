import type { Prisma, PrismaClient } from "@prisma/client";
import { RunStatus as RunStatusEnum } from "@prisma/client";
import type { Logger } from "pino";
import { prisma as defaultPrisma } from "../../db/prisma.js";
import { logger as defaultLogger } from "../../lib/logger.js";
import { runWithAgentContext } from "../../services/orchestration/run-context.js";

export interface AgentExecutionContext {
  organizationId: string;
  prisma?: PrismaClient;
  logger?: Logger;
  userId?: string | null;
  agentName?: string;
}

export interface AgentRunOptions<T> {
  intent?: string;
  buildMetrics?: (result: T) => Record<string, unknown>;
}

const JSON_SERIALIZATION_ERROR_KEY = "__serialization_error";

const toJsonValue = (value: unknown): Prisma.JsonValue => {
  if (value === undefined) {
    return null;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
    return value as Prisma.JsonValue;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.JsonValue;
  } catch (error) {
    return {
      [JSON_SERIALIZATION_ERROR_KEY]: (error as Error).message ?? "unserializable",
    } as unknown as Prisma.JsonValue;
  }
};

export async function executeAgentRun<T>(
  agentId: string,
  context: AgentExecutionContext,
  input: unknown,
  executor: () => Promise<T>,
  options: AgentRunOptions<T> = {},
): Promise<{ runId: string; result: T }> {
  if (!context.organizationId || typeof context.organizationId !== "string") {
    throw new Error("organizationId is required in agent context");
  }

  const prisma = context.prisma ?? defaultPrisma;
  const runLogger = context.logger ?? defaultLogger;
  const startedAt = new Date();

  const run = await prisma.agentRun.create({
    data: {
      agentId,
      organizationId: context.organizationId,
      status: RunStatusEnum.RUNNING,
      input: toJsonValue(input),
      startedAt,
      metrics: toJsonValue({
        intent: options.intent ?? null,
        userId: context.userId ?? null,
      }),
    },
  });

  runLogger.info({ runId: run.id, agentId, intent: options.intent }, "Agent run started");

  const contextWrapper = async () => {
    try {
      const result = await executor();
      const completedAt = new Date();
      const metrics = {
        intent: options.intent ?? null,
        userId: context.userId ?? null,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        ...(options.buildMetrics ? options.buildMetrics(result) : {}),
      };

      const updateData: Prisma.AgentRunUpdateInput = {
        status: RunStatusEnum.SUCCESS,
        output: toJsonValue(result),
        completedAt,
        metrics: toJsonValue(metrics),
      };

      await prisma.agentRun.update({
        where: { id: run.id },
        data: updateData,
      });

      runLogger.info({ runId: run.id, agentId, intent: options.intent }, "Agent run completed");
      return { runId: run.id, result };
    } catch (error) {
      const completedAt = new Date();
      const failureMetrics = {
        intent: options.intent ?? null,
        userId: context.userId ?? null,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };

      const failureData: Prisma.AgentRunUpdateInput = {
        status: RunStatusEnum.FAILED,
        completedAt,
        metrics: toJsonValue(failureMetrics),
      };

      await prisma.agentRun.update({
        where: { id: run.id },
        data: failureData,
      });

      runLogger.error({ runId: run.id, agentId, intent: options.intent, error }, "Agent run failed");
      throw error;
    }
  };

  return runWithAgentContext(
    {
      runId: run.id,
      agentId,
      agentName: context.agentName ?? agentId,
      organizationId: context.organizationId,
      prisma,
    },
    contextWrapper,
  );
}
