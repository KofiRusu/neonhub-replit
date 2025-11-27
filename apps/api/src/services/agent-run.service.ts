import { createHash } from "crypto";
import type { Prisma, PrismaClient, RunStatus } from "@prisma/client";
import { RunStatus as RunStatusEnum } from "@prisma/client";
import { logger as defaultLogger } from "../lib/logger.js";
import { recordAgentRun } from "../lib/metrics.js";

type AgentRunStore = Pick<PrismaClient, "agentRun" | "runStep">;
type RunLogger = Pick<typeof defaultLogger, "info" | "warn" | "error" | "debug">;

export interface RunInput {
  agentId: string;
  agentName: string;
  orgId: string;
  payload: unknown;
  intent?: string;
  objective?: string;
  userId?: string | null;
  meta?: Record<string, unknown>;
  inputHash?: string;
}

export interface ActiveRun {
  id: string;
  agentId: string;
  agentName: string;
  orgId: string;
  intent?: string;
  userId?: string | null;
  startedAt: Date;
}

export interface StepOptions<T> {
  payload?: unknown;
  onSuccess?: (result: T) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
}

export interface FinishOptions {
  result?: unknown;
  error?: unknown;
  metrics?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  status?: Extract<RunStatus, "SUCCESS" | "FAILED" | "CANCELLED">;
}

const JSON_SERIALIZATION_ERROR_KEY = "__serialization_error";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const normalizeJsonValue = (value: unknown): Prisma.JsonValue => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
    return value as Prisma.JsonValue;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeJsonValue(entry)) as Prisma.JsonValue;
  }

  if (isPlainObject(value)) {
    const sortedKeys = Object.keys(value).sort();
    const normalized: Record<string, Prisma.JsonValue> = {};
    for (const key of sortedKeys) {
      normalized[key] = normalizeJsonValue(value[key]);
    }
    return normalized as Prisma.JsonValue;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.JsonValue;
  } catch (error) {
    return {
      [JSON_SERIALIZATION_ERROR_KEY]: error instanceof Error ? error.message : "unserializable",
    } as unknown as Prisma.JsonValue;
  }
};

const toJsonValue = (value: unknown): Prisma.JsonValue => normalizeJsonValue(value);

export function hashPayload(payload: unknown): string {
  const safe = normalizeJsonValue(payload);
  const serialized = typeof safe === "string" ? safe : JSON.stringify(safe);
  return createHash("sha256").update(serialized ?? "null").digest("hex");
}

export async function startRun(
  prisma: AgentRunStore,
  input: RunInput,
  logger: RunLogger = defaultLogger,
): Promise<ActiveRun> {
  const startedAt = new Date();
  const hash = input.inputHash ?? hashPayload(input.payload);

  const record = await prisma.agentRun.create({
    data: {
      agentId: input.agentId,
      organizationId: input.orgId,
      status: RunStatusEnum.RUNNING,
      objective: input.objective,
      input: toJsonValue(input.payload),
      inputHash: hash,
      meta: toJsonValue({
        ...(input.meta ?? {}),
        intent: input.intent ?? null,
        userId: input.userId ?? null,
      }),
      metrics: toJsonValue({
        intent: input.intent ?? null,
        userId: input.userId ?? null,
        status: "running",
      }),
      startedAt,
    },
    select: {
      id: true,
      startedAt: true,
    },
  });

  logger.info(
    { agentId: input.agentId, agentName: input.agentName, orgId: input.orgId },
    "Agent run started",
  );

  return {
    id: record.id,
    agentId: input.agentId,
    orgId: input.orgId,
    agentName: input.agentName,
    intent: input.intent,
    userId: input.userId,
    startedAt: record.startedAt,
  };
}

export async function recordStep<T>(
  prisma: AgentRunStore,
  runId: string,
  name: string,
  executor: () => Promise<T>,
  options: StepOptions<T> = {},
  logger: RunLogger = defaultLogger,
): Promise<T> {
  const startedAt = new Date();
  const step = await prisma.runStep.create({
    data: {
      runId,
      name,
      status: RunStatusEnum.RUNNING,
      payload: toJsonValue(options.payload ?? null),
      startedAt,
    },
  });

  try {
    const result = await executor();
    const completedAt = new Date();
    await prisma.runStep.update({
      where: { id: step.id },
      data: {
        status: RunStatusEnum.SUCCESS,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        result: toJsonValue(result),
      },
    });

    if (options.onSuccess) {
      await options.onSuccess(result);
    }

    logger.debug({ runId, step: name }, "Agent run step completed");
    return result;
  } catch (error) {
    const completedAt = new Date();
    await prisma.runStep.update({
      where: { id: step.id },
      data: {
        status: RunStatusEnum.FAILED,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        error: error instanceof Error ? error.message : String(error),
      },
    });

    if (options.onError) {
      await options.onError(error);
    }

    logger.error({ runId, step: name, error }, "Agent run step failed");
    throw error;
  }
}

export async function finishRun(
  prisma: AgentRunStore,
  run: ActiveRun,
  options: FinishOptions = {},
  logger: RunLogger = defaultLogger,
): Promise<void> {
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - run.startedAt.getTime();
  const status = options.status ?? (options.error ? RunStatusEnum.FAILED : RunStatusEnum.SUCCESS);
  const errorMessage =
    options.error instanceof Error ? options.error.message : typeof options.error === "string" ? options.error : null;

  await prisma.agentRun.update({
    where: { id: run.id },
    data: {
      status,
      output: options.result !== undefined ? toJsonValue(options.result) : undefined,
      errorMessage: errorMessage || undefined,
      completedAt,
      durationMs,
      metrics: toJsonValue({
        intent: run.intent ?? null,
        userId: run.userId ?? null,
        durationMs,
        status,
        ...(options.metrics ?? {}),
      }),
      meta: toJsonValue({
        intent: run.intent ?? null,
        userId: run.userId ?? null,
        ...(options.meta ?? {}),
      }),
    },
  });

  recordAgentRun(run.agentName, status, durationMs / 1000, run.intent);

  if (status === RunStatusEnum.SUCCESS) {
    logger.info({ runId: run.id, agentId: run.agentId }, "Agent run finished successfully");
  } else if (status === RunStatusEnum.CANCELLED) {
    logger.warn({ runId: run.id, agentId: run.agentId }, "Agent run cancelled");
  } else {
    logger.error({ runId: run.id, agentId: run.agentId, error: errorMessage }, "Agent run finished with failure");
  }
}
