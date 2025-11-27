import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { recordAgentLearning, recallAgentContext } from "../services/agent-learning.service.js";
import { resetPredictiveEngine } from "../services/predictive-engine/index.js";

const { mockPrismaClient, resetMockData } = require("../__mocks__/prisma.ts");

describe("Agent Learning Service", () => {
  beforeEach(() => {
    resetMockData();
    resetPredictiveEngine();
    jest.clearAllMocks();
  });

  it("stores learning signals and recalls similar context", async () => {
    await recordAgentLearning({
      runId: "run-1",
      agentId: "memory-agent",
      organizationId: "org-1",
      userId: "user-1",
      intent: "email-campaign",
      objective: "launch",
      input: { message: "Draft email about the NeonHub product launch" },
      output: { ok: true, data: { subject: "Launch Announcement" } },
      metrics: { durationMs: 1200 },
      reward: 0.9,
    });

    await recordAgentLearning({
      runId: "run-2",
      agentId: "memory-agent",
      organizationId: "org-1",
      userId: "user-2",
      intent: "social-post",
      objective: "brand-awareness",
      input: { message: "Create social copy for upcoming webinar" },
      output: { ok: true, data: { caption: "Join our webinar" } },
      metrics: { durationMs: 800 },
      reward: 0.7,
    });

    const results = await recallAgentContext("memory-agent", "email launch", 2);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some(entry => entry.content.includes("email"))).toBe(true);

    expect(mockPrismaClient.agentRunMetric.create).toHaveBeenCalledTimes(2);
  });
});
