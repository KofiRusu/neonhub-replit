import { RunStatus } from "@prisma/client";
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from "prom-client";
import { logger } from "../lib/logger.js";

export const metricsRegistry = new Registry();

let metricsInitialized = false;

export function initializeMetrics(): void {
  if (metricsInitialized) {
    return;
  }

  collectDefaultMetrics({
    register: metricsRegistry,
  });

  metricsInitialized = true;
}

export const agentRunsTotal = new Counter({
  name: "agent_runs_total",
  help: "Total number of agent runs grouped by status.",
  labelNames: ["agent", "status"],
  registers: [metricsRegistry],
});

export const agentRunDuration = new Histogram({
  name: "agent_run_duration_seconds",
  help: "Duration of agent runs in seconds.",
  labelNames: ["agent", "status"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
  registers: [metricsRegistry],
});

export const apiRequestDuration = new Histogram({
  name: "api_request_duration_seconds",
  help: "Duration of HTTP requests handled by the API.",
  labelNames: ["route", "method"],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

export const circuitBreakerFailures = new Counter({
  name: "circuit_breaker_failures_total",
  help: "Total number of circuit breaker failures per agent.",
  labelNames: ["agent"],
  registers: [metricsRegistry],
});

export const circuitBreakerState = new Gauge({
  name: "circuit_breaker_state",
  help: "Current circuit breaker state (0 = closed, 1 = open).",
  labelNames: ["agent"],
  registers: [metricsRegistry],
});

export const agentLearningEventsTotal = new Counter({
  name: "agent_learning_events_total",
  help: "Total number of agent learning events ingested.",
  labelNames: ["agent"],
  registers: [metricsRegistry],
});

export const agentLearningRewardTotal = new Counter({
  name: "agent_learning_reward_total",
  help: "Accumulated positive reward from agent learning events.",
  labelNames: ["agent"],
  registers: [metricsRegistry],
});

export const agentLearningPenaltyTotal = new Counter({
  name: "agent_learning_penalty_total",
  help: "Accumulated penalty from agent learning events (absolute value).",
  labelNames: ["agent"],
  registers: [metricsRegistry],
});

const TERMINAL_STATUSES: RunStatus[] = [
  RunStatus.SUCCESS,
  RunStatus.FAILED,
  RunStatus.CANCELLED,
];

export function recordAgentRun(agent: string, status: RunStatus, durationSeconds: number): void {
  if (!TERMINAL_STATUSES.includes(status)) {
    logger.debug({ agent, status }, "Skipping metrics for non-terminal agent run");
    return;
  }

  const normalizedStatus = status.toLowerCase();
  agentRunsTotal.inc({ agent, status: normalizedStatus });
  agentRunDuration.observe({ agent, status: normalizedStatus }, durationSeconds);
}

export function recordHttpRequest(
  method: string,
  route: string,
  _status: number,
  durationSeconds: number
): void {
  apiRequestDuration.observe({ route, method: method.toUpperCase() }, durationSeconds);
}

export function recordCircuitBreakerFailure(agent: string): void {
  circuitBreakerFailures.inc({ agent });
}

export function setCircuitBreakerState(agent: string, isOpen: boolean): void {
  circuitBreakerState.set({ agent }, isOpen ? 1 : 0);
}

export async function getMetrics(): Promise<string> {
  return metricsRegistry.metrics();
}

export function recordLearningReward(agent: string, reward: number | null | undefined): void {
  agentLearningEventsTotal.inc({ agent });
  if (typeof reward !== "number" || Number.isNaN(reward)) {
    return;
  }
  if (reward >= 0) {
    agentLearningRewardTotal.inc({ agent }, reward);
  } else {
    agentLearningPenaltyTotal.inc({ agent }, Math.abs(reward));
  }
}

export function resetMetricsForTest(): void {
  metricsRegistry.resetMetrics();
}
