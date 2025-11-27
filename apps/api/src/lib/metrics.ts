import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from "prom-client";
import type { RunStatus } from "@prisma/client";
import { logger } from "./logger.js";

// Create a Registry to hold all metrics
export const register = new Registry();

// Collect default metrics (CPU, memory, event loop, etc.)
collectDefaultMetrics({ register, prefix: "neonhub_" });

// Agent Run Metrics
export const agentRunsTotal = new Counter({
  name: "neonhub_agent_runs_total",
  help: "Total number of agent runs",
  labelNames: ["agent", "status", "intent"],
  registers: [register],
});

export const agentRunDuration = new Histogram({
  name: "neonhub_agent_run_duration_seconds",
  help: "Duration of agent runs in seconds",
  labelNames: ["agent", "intent"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60], // seconds
  registers: [register],
});

export const toolExecutionsTotal = new Counter({
  name: "neonhub_tool_executions_total",
  help: "Total number of tool executions",
  labelNames: ["tool", "status"],
  registers: [register],
});

export const toolExecutionDuration = new Histogram({
  name: "neonhub_tool_execution_duration_seconds",
  help: "Duration of tool executions in seconds",
  labelNames: ["tool", "status"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

// Circuit Breaker Metrics
export const circuitBreakerFailures = new Counter({
  name: "neonhub_circuit_breaker_failures_total",
  help: "Total number of circuit breaker failures",
  labelNames: ["agent"],
  registers: [register],
});

export const circuitBreakerState = new Gauge({
  name: "neonhub_circuit_breaker_state",
  help: "Current state of circuit breaker (0=closed, 1=open)",
  labelNames: ["agent"],
  registers: [register],
});

// Queue Metrics
export const queueJobsAdded = new Counter({
  name: "neonhub_queue_jobs_added_total",
  help: "Total number of jobs added to queues",
  labelNames: ["queue"],
  registers: [register],
});

export const queueJobsCompleted = new Counter({
  name: "neonhub_queue_jobs_completed_total",
  help: "Total number of jobs completed",
  labelNames: ["queue", "status"],
  registers: [register],
});

export const queueJobsPending = new Gauge({
  name: "neonhub_queue_jobs_pending",
  help: "Number of pending jobs in queue",
  labelNames: ["queue"],
  registers: [register],
});

// HTTP Request Metrics
export const httpRequestsTotal = new Counter({
  name: "neonhub_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: "neonhub_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Database Metrics
export const dbQueryDuration = new Histogram({
  name: "neonhub_db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation"],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

export const dbConnectionsActive = new Gauge({
  name: "neonhub_db_connections_active",
  help: "Number of active database connections",
  registers: [register],
});

// Connector Metrics
export const connectorRequestsTotal = new Counter({
  name: "neonhub_connector_requests_total",
  help: "Total number of connector requests",
  labelNames: ["connector", "status"],
  registers: [register],
});

export const connectorRequestDuration = new Histogram({
  name: "neonhub_connector_request_duration_seconds",
  help: "Duration of connector requests in seconds",
  labelNames: ["connector"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const learningRewards = new Gauge({
  name: "neonhub_learning_reward",
  help: "Latest reward recorded per agent",
  labelNames: ["agent"],
  registers: [register],
});

// Rate Limiter Metrics
export const rateLimitHits = new Counter({
  name: "neonhub_rate_limit_hits_total",
  help: "Total number of rate limit hits",
  labelNames: ["agent", "user"],
  registers: [register],
});

// Helper functions for common operations
export function recordAgentRun(
  agent: string,
  status: RunStatus,
  durationSeconds: number,
  intent?: string,
) {
  const normalized =
    status === "SUCCESS"
      ? "completed"
      : status === "FAILED"
      ? "failed"
      : status === "CANCELLED"
      ? "cancelled"
      : "completed";
  agentRunsTotal.inc({ agent, status: normalized, intent: intent || "unknown" });
  agentRunDuration.observe({ agent, intent: intent || "unknown" }, durationSeconds);
  logger.debug({ agent, status: normalized, durationSeconds, intent }, "Recorded agent run metrics");
}

export function recordCircuitBreakerFailure(agent: string) {
  circuitBreakerFailures.inc({ agent });
  logger.warn({ agent }, "Circuit breaker failure recorded");
}

export function setCircuitBreakerState(agent: string, isOpen: boolean) {
  circuitBreakerState.set({ agent }, isOpen ? 1 : 0);
}

export function recordHttpRequest(
  method: string,
  route: string,
  status: number,
  durationSeconds: number
) {
  httpRequestsTotal.inc({ method, route, status: status.toString() });
  httpRequestDuration.observe(
    { method, route, status: status.toString() },
    durationSeconds
  );
}

export function recordQueueJob(
  queue: string,
  operation: "added" | "completed" | "failed"
) {
  if (operation === "added") {
    queueJobsAdded.inc({ queue });
  } else {
    queueJobsCompleted.inc({ queue, status: operation });
  }
}

export function updateQueuePending(queue: string, count: number) {
  queueJobsPending.set({ queue }, count);
}

export function recordConnectorRequest(
  connector: string,
  status: "success" | "failure",
  durationSeconds: number
) {
  connectorRequestsTotal.inc({ connector, status });
  connectorRequestDuration.observe({ connector }, durationSeconds);
}

export function recordRateLimitHit(agent: string, user: string) {
  rateLimitHits.inc({ agent, user });
}

export function recordToolExecutionMetric(tool: string, status: "completed" | "failed", durationSeconds: number) {
  toolExecutionsTotal.inc({ tool, status });
  toolExecutionDuration.observe({ tool, status }, durationSeconds);
}

export function recordLearningReward(agent: string, reward: number | null): void {
  if (typeof reward === "number") {
    learningRewards.set({ agent }, reward);
  } else {
    learningRewards.set({ agent }, 0);
  }
}

// Get all metrics as string (for /metrics endpoint)
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

logger.info("Prometheus metrics initialized");
