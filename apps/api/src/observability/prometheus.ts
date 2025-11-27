/**
 * Prometheus Metrics Service
 * Exports application metrics in Prometheus format for monitoring and alerting
 * Metrics include: response times, error rates, request throughput, agent performance
 */

import { register, Counter, Histogram, Gauge } from "prom-client";
import { logger } from "../lib/logger.js";

// Default metrics (CPU, memory, etc.)
// These are auto-registered by prom-client

// Custom metrics

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request latency in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});

// Agent execution metrics
export const agentExecutionDuration = new Histogram({
  name: "agent_execution_duration_seconds",
  help: "Agent execution latency in seconds",
  labelNames: ["agent", "status"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});

export const agentExecutionTotal = new Counter({
  name: "agent_executions_total",
  help: "Total agent executions",
  labelNames: ["agent", "status", "intent"],
});

export const agentRunsActive = new Gauge({
  name: "agent_runs_active",
  help: "Currently active agent runs",
  labelNames: ["agent"],
});

// Database metrics
export const dbQueryDuration = new Histogram({
  name: "db_query_duration_seconds",
  help: "Database query latency in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.001, 0.01, 0.1, 0.5, 1],
});

export const dbErrors = new Counter({
  name: "db_errors_total",
  help: "Total database errors",
  labelNames: ["operation", "table", "error_type"],
});

// Cache metrics
export const cacheHits = new Counter({
  name: "cache_hits_total",
  help: "Cache hits",
  labelNames: ["cache_type"],
});

export const cacheMisses = new Counter({
  name: "cache_misses_total",
  help: "Cache misses",
  labelNames: ["cache_type"],
});

// Learning metrics
export const learningRecorded = new Counter({
  name: "agent_learning_recorded_total",
  help: "Agent learning signals recorded",
  labelNames: ["agent", "reward_positive"],
});

export const memoryRecalled = new Counter({
  name: "agent_memory_recalled_total",
  help: "Agent memory recalls",
  labelNames: ["agent"],
});

// API errors
export const apiErrors = new Counter({
  name: "api_errors_total",
  help: "Total API errors",
  labelNames: ["error_code", "endpoint"],
});

/**
 * Collect all metrics in Prometheus format
 * Called by /api/metrics endpoint
 */
export async function getMetrics(): Promise<string> {
  try {
    return await register.metrics();
  } catch (error) {
    logger.error({ error }, "Failed to collect Prometheus metrics");
    return "";
  }
}

/**
 * Record HTTP request
 */
export function recordHttpRequest(
  method: string,
  route: string,
  status: number,
  durationMs: number
): void {
  httpRequestDuration.labels(method, route, String(status)).observe(durationMs / 1000);
  httpRequestTotal.labels(method, route, String(status)).inc();
}

/**
 * Record agent execution
 */
export function recordAgentExecution(
  agent: string,
  status: "success" | "failure",
  durationMs: number,
  intent?: string
): void {
  agentExecutionDuration.labels(agent, status).observe(durationMs / 1000);
  agentExecutionTotal.labels(agent, status, intent || "unknown").inc();
}

/**
 * Update active agent runs gauge
 */
export function updateActiveAgentRuns(agent: string, count: number): void {
  agentRunsActive.labels(agent).set(count);
}

/**
 * Record database query
 */
export function recordDbQuery(operation: string, table: string, durationMs: number): void {
  dbQueryDuration.labels(operation, table).observe(durationMs / 1000);
}

/**
 * Record database error
 */
export function recordDbError(operation: string, table: string, errorType: string): void {
  dbErrors.labels(operation, table, errorType).inc();
}

/**
 * Record cache hit/miss
 */
export function recordCacheHit(cacheType: string): void {
  cacheHits.labels(cacheType).inc();
}

export function recordCacheMiss(cacheType: string): void {
  cacheMisses.labels(cacheType).inc();
}

/**
 * Record learning signal
 */
export function recordLearningSignal(agent: string, reward: number | null): void {
  const positive = reward !== null && reward > 0;
  learningRecorded.labels(agent, String(positive)).inc();
}

/**
 * Record memory recall
 */
export function recordMemoryRecall(agent: string): void {
  memoryRecalled.labels(agent).inc();
}

/**
 * Record API error
 */
export function recordApiError(errorCode: string, endpoint: string): void {
  apiErrors.labels(errorCode, endpoint).inc();
}
