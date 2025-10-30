import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { registerAgent, clearRegistry } from "../registry.js";
import { route } from "../router.js";
import { prisma } from "../../../db/prisma.js";
import type { OrchestratorRequest, AgentHandler } from "../types.js";

describe("Orchestrator AgentRun Persistence", () => {
  let testOrgId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Clear agent registry
    clearRegistry();

    // Create test organization and user
    const org = await prisma.organization.create({
      data: {
        name: "Test Org",
        slug: "test-org-" + Date.now(),
      },
    });
    testOrgId = org.id;

    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Cleanup: Delete agent runs, agents, users, and orgs
    await prisma.agentRun.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.agent.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.organization.deleteMany({ where: { id: testOrgId } });
    clearRegistry();
  });

  it("should create AgentRun record on successful execution", async () => {
    // Register a mock agent
    const mockHandler: AgentHandler = {
      handle: async (req: OrchestratorRequest) => {
        return {
          ok: true,
          data: { message: "Success", payload: req.payload },
        };
      },
    };

    registerAgent("test-agent", mockHandler);

    // Execute orchestrator request
    const request: OrchestratorRequest = {
      agent: "test-agent",
      intent: "test-intent",
      payload: { foo: "bar" },
      context: {
        organizationId: testOrgId,
        userId: testUserId,
      },
    };

    const response = await route(request);

    // Verify response
    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.data).toMatchObject({
        message: "Success",
        payload: { foo: "bar" },
      });
    }

    // Verify AgentRun was created
    const agentRuns = await prisma.agentRun.findMany({
      where: { organizationId: testOrgId },
      include: { agent: true },
    });

    expect(agentRuns).toHaveLength(1);
    const run = agentRuns[0];
    
    expect(run.status).toBe("completed");
    expect(run.input).toMatchObject({ foo: "bar" });
    expect(run.output).toMatchObject({
      ok: true,
      data: { message: "Success", payload: { foo: "bar" } },
    });
    expect(run.agent.name).toBe("test-agent");
    expect(run.agent.organizationId).toBe(testOrgId);
    expect(run.startedAt).toBeTruthy();
    expect(run.completedAt).toBeTruthy();
  });

  it("should create AgentRun record on failed execution", async () => {
    // Register a mock agent that fails
    const mockHandler: AgentHandler = {
      handle: async (_req: OrchestratorRequest) => {
        throw new Error("Intentional test failure");
      },
    };

    registerAgent("failing-agent", mockHandler);

    // Execute orchestrator request
    const request: OrchestratorRequest = {
      agent: "failing-agent",
      intent: "test-failure",
      payload: { test: "failure" },
      context: {
        organizationId: testOrgId,
        userId: testUserId,
      },
    };

    const response = await route(request);

    // Verify response indicates failure
    expect(response.ok).toBe(false);

    // Verify AgentRun was created with failed status
    const agentRuns = await prisma.agentRun.findMany({
      where: { organizationId: testOrgId },
    });

    expect(agentRuns).toHaveLength(1);
    const run = agentRuns[0];
    
    expect(run.status).toBe("failed");
    expect(run.input).toMatchObject({ test: "failure" });
    expect(run.metrics).toHaveProperty("error");
    expect(run.startedAt).toBeTruthy();
    expect(run.completedAt).toBeTruthy();
  });

  it("should track metrics in AgentRun", async () => {
    // Register a mock agent
    const mockHandler: AgentHandler = {
      handle: async (req: OrchestratorRequest) => {
        // Simulate some processing time
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { ok: true, data: { processed: true } };
      },
    };

    registerAgent("metrics-agent", mockHandler);

    // Execute orchestrator request
    const request: OrchestratorRequest = {
      agent: "metrics-agent",
      intent: "metrics-test",
      payload: { metric: "test" },
      context: {
        organizationId: testOrgId,
        userId: testUserId,
      },
    };

    await route(request);

    // Verify metrics were recorded
    const agentRuns = await prisma.agentRun.findMany({
      where: { organizationId: testOrgId },
    });

    expect(agentRuns).toHaveLength(1);
    const run = agentRuns[0];
    
    expect(run.metrics).toHaveProperty("intent", "metrics-test");
    expect(run.metrics).toHaveProperty("agent", "metrics-agent");
    expect(run.metrics).toHaveProperty("responseOk", true);
    expect(run.metrics).toHaveProperty("durationMs");
    
    // Verify duration is reasonable (should be > 10ms due to setTimeout)
    const metrics = run.metrics as any;
    expect(metrics.durationMs).toBeGreaterThan(5);
  });

  it("should handle missing organizationId gracefully", async () => {
    // Register a mock agent
    const mockHandler: AgentHandler = {
      handle: async () => ({ ok: true, data: { fallback: true } }),
    };

    registerAgent("fallback-agent", mockHandler);

    // Execute orchestrator request WITHOUT organizationId
    const request: OrchestratorRequest = {
      agent: "fallback-agent",
      intent: "no-org",
      payload: {},
      context: {
        userId: testUserId,
        // organizationId is missing
      },
    };

    const response = await route(request);

    // Should still work but without persistence
    expect(response.ok).toBe(true);

    // Verify NO AgentRun was created
    const agentRuns = await prisma.agentRun.findMany();
    expect(agentRuns).toHaveLength(0);
  });
});
