import type { PrismaClient, RunStatus } from "@prisma/client";
import type { Logger } from "pino";

export interface AgentExecutionContext {
  organizationId: string;
  prisma?: PrismaClient;
  logger?: Logger;
  userId?: string | null;
}

export interface AgentRunOptions<T> {
  intent?: string;
  objective?: string;
  meta?: Record<string, unknown>;
  agentName?: string;
  buildMetrics?: (result: T) => Record<string, unknown>;
}

export interface ExecuteAgentRunResult<T> {
  runId: string;
  result: T;
}

/**
 * Metric labels emitted by `recordAgentRun`.
 * Status values map directly from Prisma RunStatus and are normalised to lowercase strings.
 */
export type AgentRunMetricLabels = {
  agent: string;
  status: "success" | "failed" | "cancelled";
};

export declare function executeAgentRun<T>(
  agentId: string,
  context: AgentExecutionContext,
  input: unknown,
  executor: () => Promise<T>,
  options?: AgentRunOptions<T>
): Promise<ExecuteAgentRunResult<T>>;

export declare function recordAgentRunMetrics(
  agent: string,
  status: RunStatus,
  durationSeconds: number
): void;
