import { AsyncLocalStorage } from "node:async_hooks";
import type { PrismaClient } from "@prisma/client";

export interface AgentRunContextValue {
  runId: string;
  agentId: string;
  agentName?: string;
  organizationId: string;
  prisma: PrismaClient;
}

const agentRunContext = new AsyncLocalStorage<AgentRunContextValue>();

export function runWithAgentContext<T>(ctx: AgentRunContextValue, executor: () => Promise<T>): Promise<T> {
  return agentRunContext.run(ctx, executor);
}

export function getAgentRunContext(): AgentRunContextValue | undefined {
  return agentRunContext.getStore();
}
