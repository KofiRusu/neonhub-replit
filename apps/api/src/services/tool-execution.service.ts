import type { Prisma, PrismaClient, Tool } from "@prisma/client";
import { prisma as defaultPrisma } from "../db/prisma.js";
import { getAgentRunContext } from "./orchestration/run-context.js";
import { recordToolExecutionMetric } from "../lib/metrics.js";

const TOOL_SLUG_PREFIX = "connector";

const toJsonValue = (value: unknown): Prisma.JsonValue => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
    return value as Prisma.JsonValue;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toJsonValue(entry)) as Prisma.JsonValue;
  }

  if (typeof value === "object") {
    return Object.entries(value).reduce<Record<string, Prisma.JsonValue>>((acc, [key, val]) => {
      acc[key] = toJsonValue(val);
      return acc;
    }, {});
  }

  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.JsonValue;
  } catch {
    return { __serialization_error: true } as unknown as Prisma.JsonValue;
  }
};

async function ensureToolRecord(prisma: PrismaClient, organizationId: string, agentId: string, connector: string): Promise<Tool> {
  const slug = `${TOOL_SLUG_PREFIX}-${connector}`.toLowerCase();

  return prisma.tool.upsert({
    where: {
      organizationId_slug: {
        organizationId,
        slug,
      },
    },
    update: {
      agentId,
      updatedAt: new Date(),
    },
    create: {
      organizationId,
      agentId,
      slug,
      name: `${connector} connector`,
      description: `Auto-generated tool for ${connector}`,
      inputSchema: {},
      outputSchema: {},
    },
  });
}

export async function recordToolExecution<T>(
  connector: string,
  action: string,
  input: unknown,
  executor: () => Promise<T>,
): Promise<T> {
  const ctx = getAgentRunContext();
  if (!ctx) {
    return executor();
  }

  const prisma = ctx.prisma ?? defaultPrisma;
  const tool = await ensureToolRecord(prisma, ctx.organizationId, ctx.agentId, connector);
  const startedAt = new Date();
  const execution = await prisma.toolExecution.create({
    data: {
      toolId: tool.id,
      agentRunId: ctx.runId,
      status: "running",
      input: toJsonValue({ action, payload: input ?? null }),
      startedAt,
      metadata: toJsonValue({ connector, action }),
    },
  });

  try {
    const output = await executor();
    await prisma.toolExecution.update({
      where: { id: execution.id },
      data: {
        status: "completed",
        output: toJsonValue(output),
        completedAt: new Date(),
      },
    });
    const durationSeconds = (Date.now() - startedAt.getTime()) / 1000;
    recordToolExecutionMetric(connector, "completed", durationSeconds);
    return output;
  } catch (error) {
    await prisma.toolExecution.update({
      where: { id: execution.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        metadata: toJsonValue({
          connector,
          action,
          error: error instanceof Error ? error.message : String(error),
        }),
      },
    });
    const durationSeconds = (Date.now() - startedAt.getTime()) / 1000;
    recordToolExecutionMetric(connector, "failed", durationSeconds);
    throw error;
  }
}
