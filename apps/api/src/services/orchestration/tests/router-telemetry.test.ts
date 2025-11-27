import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { RunStatus } from "@prisma/client";
import type { OrchestratorRequest, OrchestratorResponse } from "../types.js";
import { registerAgent, clearRegistry } from "../registry.js";
import { route, __resetOrchestratorState } from "../router.js";
import { ensureOrchestratorBootstrap } from "../bootstrap.js";
import { recordAgentRun, recordCircuitBreakerFailure, recordRateLimitHit } from "../../../lib/metrics.js";
import { executeAgentRun } from "../../../agents/utils/agent-run.js";

jest.mock("../bootstrap", () => ({
  ensureOrchestratorBootstrap: jest.fn(async () => undefined),
}));

jest.mock("../../../lib/metrics.js", () => ({
  recordAgentRun: jest.fn(),
  recordCircuitBreakerFailure: jest.fn(),
  recordRateLimitHit: jest.fn(),
}));

jest.mock("../../../agents/utils/agent-run", () => ({
  executeAgentRun: jest.fn(async (_agentId, _ctx, _input, executor, _options) => ({
    runId: "telemetry-run",
    result: await executor(),
  })),
}));

jest.mock("../../../db/prisma.js", () => {
  const agents = new Map<string, { id: string; name: string }>();
  return {
    prisma: {
      agent: {
        findFirst: jest.fn(async ({ where }: { where: { organizationId: string; name: string } }) => {
          return agents.get(`${where.organizationId}:${where.name}`) ?? null;
        }),
        create: jest.fn(async ({ data }: { data: { organizationId: string; name: string; description?: string } }) => {
          const record = { id: `agent-${data.name}`, name: data.name };
          agents.set(`${data.organizationId}:${data.name}`, record);
          return record;
        }),
      },
    },
  };
});

const bootstrapMock = ensureOrchestratorBootstrap as jest.MockedFunction<typeof ensureOrchestratorBootstrap>;
const executeAgentRunMock = executeAgentRun as jest.MockedFunction<typeof executeAgentRun>;
const recordAgentRunMock = recordAgentRun as jest.Mock;
const recordCircuitBreakerFailureMock = recordCircuitBreakerFailure as jest.Mock;
const recordRateLimitHitMock = recordRateLimitHit as jest.Mock;

const request = (overrides: Partial<OrchestratorRequest> = {}): OrchestratorRequest => ({
  agent: "ContentAgent",
  intent: "test",
  payload: {},
  context: { userId: "user-1", organizationId: "org-1" },
  ...overrides,
});

describe("orchestrator telemetry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearRegistry();
    __resetOrchestratorState();
    bootstrapMock.mockResolvedValue(undefined);
  });

  it("records agent run metrics on success", async () => {
    executeAgentRunMock.mockResolvedValueOnce({
      runId: "run-1",
      result: { ok: true, data: { hello: true } },
    });

    registerAgent(
      "ContentAgent",
      { handle: async () => ({ ok: true, data: { hello: true } }) },
      { version: "1", capabilities: [] },
    );

    const response = await route(request());
    expect(response.ok).toBe(true);
    expect(recordAgentRunMock).toHaveBeenCalledWith("ContentAgent", RunStatus.SUCCESS, expect.any(Number), "test");
  });

  it("records agent run metrics on failure", async () => {
    executeAgentRunMock.mockResolvedValueOnce({
      runId: "run-2",
      result: { ok: false, error: "boom", code: "BAD" },
    });

    registerAgent(
      "ContentAgent",
      { handle: async () => ({ ok: false, error: "boom", code: "BAD" }) },
      { version: "1", capabilities: [] },
    );

    const response = await route(request());
    expect(response.ok).toBe(false);
    expect(recordAgentRunMock).toHaveBeenCalledWith("ContentAgent", RunStatus.FAILED, expect.any(Number), "test");
  });

  it("records rate limit hits", async () => {
    registerAgent(
      "SupportAgent",
      { handle: async (): Promise<OrchestratorResponse> => ({ ok: true, data: {} }) },
      { version: "1", capabilities: [] },
    );

    const rateLimitedRequest = request({
      agent: "SupportAgent",
      context: { userId: "rate-user" },
    });

    for (let i = 0; i < 61; i += 1) {
      await route(rateLimitedRequest);
    }

    expect(recordRateLimitHitMock).toHaveBeenCalledWith("SupportAgent", "rate-user");
  });

  it("records circuit breaker telemetry when breaker opens", async () => {
    registerAgent(
      "SeoAgent",
      {
        handle: async () => {
          throw new Error("failing");
        },
      },
      { version: "1", capabilities: [] },
    );

    const failingRequest = request({ agent: "SeoAgent", context: { userId: "breaker-user" } });

    await route(failingRequest);
    await route(failingRequest);

    expect(recordCircuitBreakerFailureMock).toHaveBeenCalledWith("SeoAgent");
  });
});
