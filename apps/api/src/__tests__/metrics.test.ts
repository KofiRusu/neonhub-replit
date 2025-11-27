import { RunStatus } from "@prisma/client";
import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  agentRunsTotal,
  agentLearningEventsTotal,
  agentLearningRewardTotal,
  agentLearningPenaltyTotal,
  apiRequestDuration,
  circuitBreakerFailures,
  recordAgentRun,
  recordCircuitBreakerFailure,
  recordHttpRequest,
  setCircuitBreakerState,
  getMetrics,
  initializeMetrics,
  resetMetricsForTest,
  recordLearningReward,
} from "../observability/metrics.js";

describe("observability metrics", () => {
  beforeEach(() => {
    resetMetricsForTest();
    initializeMetrics();
  });

  it("tracks agent runs, http requests, and circuit breaker events", async () => {
    recordAgentRun("content", RunStatus.SUCCESS, 1.25);
    recordHttpRequest("get", "/content/drafts", 200, 0.2);
    recordCircuitBreakerFailure("content");
    setCircuitBreakerState("content", true);
    recordLearningReward("content", 0.9);
    recordLearningReward("content", -0.2);

    const snapshot = await getMetrics();

    expect(snapshot).toContain('agent_runs_total{agent="content",status="success"} 1');
    expect(snapshot).toContain('agent_run_duration_seconds_sum{agent="content",status="success"} 1.25');
    expect(snapshot).toMatch(/api_request_duration_seconds_count\{route="\/content\/drafts",method="GET"} 1/);
    expect(snapshot).toContain('circuit_breaker_failures_total{agent="content"} 1');
    expect(snapshot).toContain('circuit_breaker_state{agent="content"} 1');
    expect(snapshot).toContain('agent_learning_events_total{agent="content"} 2');
    expect(snapshot).toContain('agent_learning_reward_total{agent="content"} 0.9');
    expect(snapshot).toContain('agent_learning_penalty_total{agent="content"} 0.2');
  });

  it("exposes metric instances for advanced assertions", async () => {
    recordAgentRun("seo", RunStatus.FAILED, 0.75);
    recordHttpRequest("post", "/content/generate", 200, 0.5);
    recordCircuitBreakerFailure("seo");
    recordLearningReward("seo", 0.5);

    const agentData = await agentRunsTotal.get();
    const agentSample = agentData.values.find((sample) => sample.labels?.agent === "seo");
    expect(agentSample?.value).toBe(1);

    const httpData = await apiRequestDuration.get();
    const httpCount = httpData.values.find(
      (sample) => sample.labels?.route === "/content/generate" && sample.labels?.method === "POST" && sample.metricName?.endsWith("_count")
    );
    expect(httpCount?.value).toBe(1);

    const breakerData = await circuitBreakerFailures.get();
    const breakerCount = breakerData.values.find((sample) => sample.labels?.agent === "seo");
    expect(breakerCount?.value).toBe(1);

    const rewardSamples = (await agentLearningRewardTotal.get()).values;
    expect(rewardSamples[0]?.value).toBeGreaterThan(0);
    const eventsSample = (await agentLearningEventsTotal.get()).values.find((sample) => sample.labels?.agent === "seo");
    expect(eventsSample?.value).toBe(1);
    const penaltySamples = await agentLearningPenaltyTotal.get();
    expect(penaltySamples.values).toHaveLength(0);
  });
});
