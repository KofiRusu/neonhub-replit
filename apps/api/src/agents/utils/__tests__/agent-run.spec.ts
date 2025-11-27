// @ts-nocheck
// Temporary suppression — legacy suite. Logged in AGENT_COMPLETION_PROGRESS.md.
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { RunStatus } from "@prisma/client";

jest.mock("../../../db/prisma.js", () => ({
  prisma: {
    agentRun: {
      create: jest.fn().mockResolvedValue({ id: "run-123" }),
      update: jest.fn().mockResolvedValue({ id: "run-123" }),
      findUnique: jest.fn().mockResolvedValue({ id: "run-123" }),
    },
  } as any,
}));

jest.mock(
  "../../../services/agent-run.service.js",
  () => ({
    startRun: jest.fn().mockResolvedValue({ id: "run-123" }),
    recordStep: jest.fn().mockImplementation(async (_p: any, _r: any, _l: any, executor: any) => {
      return executor?.();
    }),
    finishRun: jest.fn().mockResolvedValue(undefined),
  } as any),
  { virtual: true }
);

const agentRunService = jest.requireMock("../../../services/agent-run.service.js") as {
  startRun: jest.Mock;
  recordStep: jest.Mock;
  finishRun: jest.Mock;
};

jest.mock("../../../lib/metrics.js", () => ({
  recordAgentRun: jest.fn(),
}));

const recordAgentRun = jest.requireMock("../../../lib/metrics.js").recordAgentRun as jest.Mock;

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

describe("executeAgentRun utility", () => {
  const executeModule = () => import("../agent-run.js");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws when organizationId is missing", async () => {
    const { executeAgentRun } = await executeModule();

    await expect(
      executeAgentRun("ContentAgent", { organizationId: "" as unknown as string }, {}, async () => ({}))
    ).rejects.toThrow("organizationId is required in agent context");

    expect(agentRunService.startRun).not.toHaveBeenCalled();
  });

  it("persists successful runs and returns result", async () => {
    const { executeAgentRun } = await executeModule();

    agentRunService.startRun.mockResolvedValue({ id: "run-123" });
    agentRunService.recordStep.mockImplementation(async (_prisma, _runId, _label, executor) => executor());
    agentRunService.finishRun.mockResolvedValue(undefined);

    const customPrisma = {} as any;
    const result = await executeAgentRun(
      "ContentAgent",
      { organizationId: "org-1", prisma: customPrisma, logger: mockLogger, userId: "user-9" },
      { payload: true },
      async () => ({ ok: true }),
      {
        intent: "draft",
        objective: "draft",
        meta: { locale: "en-US" },
        buildMetrics: (output) => ({ ok: Number(output.ok) }),
      }
    );

    expect(agentRunService.startRun).toHaveBeenCalledWith(
      customPrisma,
      expect.objectContaining({
        agentId: "ContentAgent",
        agentName: "ContentAgent",
        orgId: "org-1",
        userId: "user-9",
        meta: { locale: "en-US" },
      }),
      mockLogger
    );
    expect(agentRunService.recordStep).toHaveBeenCalledWith(
      customPrisma,
      "run-123",
      "agent.handle",
      expect.any(Function),
      { payload: { payload: true } },
      mockLogger
    );
    expect(agentRunService.finishRun).toHaveBeenCalledWith(
      customPrisma,
      { id: "run-123" },
      {
        status: expect.stringMatching(/SUCCESS/),
        result: { ok: true },
        metrics: { ok: 1 },
        meta: { locale: "en-US" },
      },
      mockLogger
    );
    expect(result).toEqual({ runId: "run-123", result: { ok: true } });
    expect(recordAgentRun).toHaveBeenCalledWith(
      "ContentAgent",
      RunStatus.SUCCESS,
      expect.any(Number),
      "draft",
    );
  });

  it("records failure metrics and rethrows errors", async () => {
    const { executeAgentRun } = await executeModule();

    agentRunService.startRun.mockResolvedValue({ id: "run-500" });
    agentRunService.recordStep.mockImplementation(async () => {
      throw new Error("agent failed");
    });
    agentRunService.finishRun.mockResolvedValue(undefined);

    await expect(
      executeAgentRun(
        "SeoAgent",
        { organizationId: "org-2", logger: mockLogger },
        { input: "doc" },
        async () => ({ ok: false })
      )
    ).rejects.toThrow("agent failed");

    expect(agentRunService.finishRun).toHaveBeenCalledWith(
      expect.anything(),
      { id: "run-500" },
      expect.objectContaining({
        status: expect.stringMatching(/FAILED/),
        metrics: { error: "agent failed" },
      }),
      mockLogger
    );
    expect(recordAgentRun).toHaveBeenCalledWith("SeoAgent", RunStatus.FAILED, expect.any(Number), undefined);
  });

  it("can be configured to skip telemetry", async () => {
    const { executeAgentRun } = await executeModule();

    agentRunService.startRun.mockResolvedValue({ id: "run-telemetry" });
    agentRunService.recordStep.mockImplementation(async (_prisma, _runId, _label, executor) => executor());
    agentRunService.finishRun.mockResolvedValue(undefined);

    await executeAgentRun(
      "SupportAgent",
      { organizationId: "org-9", logger: mockLogger },
      {},
      async () => ({ ok: true }),
      { emitTelemetry: false },
    );

    expect(recordAgentRun).not.toHaveBeenCalled();
  });
});
