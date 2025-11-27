import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { PrismaClient } from "@prisma/client";
import { RunStatus } from "@prisma/client";
import { executeAgentRun } from "../agents/utils/agent-run.js";

jest.mock("../lib/metrics.js", () => ({
  recordAgentRun: jest.fn(),
}));

const recordAgentRun = jest.requireMock("../lib/metrics.js").recordAgentRun as jest.Mock;

describe("executeAgentRun", () => {
  const prisma = {
    agentRun: {
      create: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaClient & {
    agentRun: {
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.agentRun.create.mockResolvedValue({
      id: "run-123",
      agentId: "agent-test",
      organizationId: "org-123",
      startedAt: new Date("2024-01-01T00:00:00Z"),
    });
    prisma.agentRun.update.mockResolvedValue({
      id: "run-123",
      agentId: "agent-test",
      organizationId: "org-123",
    });
  });

  it("persists run lifecycle and returns execution result", async () => {
    const executor = jest.fn().mockResolvedValue({ output: "ok" });

    const response = await executeAgentRun(
      "agent-test",
      { organizationId: "org-123", prisma, logger },
      { topic: "Test" },
      executor,
      { intent: "generate", agentName: "ContentAgent", meta: { traceId: "123" } }
    );

    expect(response).toEqual({ runId: "run-123", result: { output: "ok" } });

    expect(prisma.agentRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentId: "agent-test",
          organizationId: "org-123",
          status: RunStatus.RUNNING,
          input: { topic: "Test" },
        }),
      }),
    );

    expect(prisma.agentRun.update).toHaveBeenCalledWith({
      where: { id: "run-123" },
      data: expect.objectContaining({
        status: RunStatus.SUCCESS,
        output: { output: "ok" },
      }),
    });

    expect(recordAgentRun).toHaveBeenCalledWith("agent-test", RunStatus.SUCCESS, expect.any(Number), "generate");
  });

  it("throws when organizationId is missing", async () => {
    await expect(
      executeAgentRun("agent-test", { organizationId: "" }, null, async () => null)
    ).rejects.toThrow("organizationId is required");

    expect(prisma.agentRun.create).not.toHaveBeenCalled();
  });

  it("records failure metrics when executor throws", async () => {
    const failure = new Error("execution failed");
    const failingExecutor = jest.fn().mockRejectedValue(failure);

    await expect(
      executeAgentRun("agent-test", { organizationId: "org-123", prisma, logger }, {}, failingExecutor)
    ).rejects.toThrow("execution failed");

    expect(prisma.agentRun.update).toHaveBeenCalledWith({
      where: { id: "run-123" },
      data: expect.objectContaining({
        status: RunStatus.FAILED,
        metrics: expect.objectContaining({ error: "execution failed" }),
      }),
    });
    expect(recordAgentRun).toHaveBeenCalledWith("agent-test", RunStatus.FAILED, expect.any(Number), undefined);
  });
});
