import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { getPredictiveEngine } from "./predictive-engine/index.js";
import { hashPayload } from "./agent-run.service.js";
import { recordLearningReward } from "../lib/metrics.js";
import type { LearningSignal } from "@neonhub/predictive-engine";

export interface AgentLearningInput {
  runId: string;
  agentId: string;
  organizationId: string;
  userId?: string | null;
  intent?: string;
  objective?: string;
  input: unknown;
  output: unknown;
  metrics?: Record<string, unknown>;
  reward?: number;
  metadata?: Record<string, unknown>;
}

const MAX_MEMORY_ITEMS = 25;

function buildLearningContent(payload: AgentLearningInput): string {
  return JSON.stringify({
    objective: payload.objective ?? payload.intent ?? null,
    intent: payload.intent ?? null,
    input: payload.input,
    output: payload.output,
    metrics: payload.metrics ?? {},
    metadata: payload.metadata ?? {},
  });
}

export async function recordAgentLearning(payload: AgentLearningInput): Promise<void> {
  const engine = await getPredictiveEngine();

  const key = `${payload.runId}:${hashPayload({
    agentId: payload.agentId,
    intent: payload.intent,
    objective: payload.objective,
  })}`;

  const content = buildLearningContent(payload);

  const learningSignal: LearningSignal = {
    agentId: payload.agentId,
    key,
    content,
    reward: typeof payload.reward === "number" ? payload.reward : undefined,
    metadata: {
      organizationId: payload.organizationId,
      userId: payload.userId ?? null,
      intent: payload.intent ?? null,
      objective: payload.objective ?? null,
    },
  };

  await engine.learn(learningSignal);
  recordLearningReward(payload.agentId, payload.reward ?? null);

  await prisma.agentRunMetric.create({
    data: {
      agentRunId: payload.runId,
      name: payload.intent ?? "agent_run",
      value: typeof payload.reward === "number" ? payload.reward : null,
      metadata: {
        organizationId: payload.organizationId,
        userId: payload.userId ?? null,
        intent: payload.intent ?? null,
        objective: payload.objective ?? null,
        metrics: payload.metrics ?? {},
      } as Prisma.JsonObject,
    },
  });
}

export async function recallAgentContext(agentId: string, query: string, k = MAX_MEMORY_ITEMS) {
  const engine = await getPredictiveEngine();
  return engine.recall(agentId, query, k);
}
