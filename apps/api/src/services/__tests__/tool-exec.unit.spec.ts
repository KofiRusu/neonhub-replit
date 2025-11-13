import { describe, it, expect, beforeAll, beforeEach, jest } from "@jest/globals";

let mockPrisma: any;
let resetMockData: () => void;
let runWithAgentContext: typeof import("../orchestration/run-context.js")["runWithAgentContext"];
let recordToolExecution: typeof import("../tool-execution.service.js")["recordToolExecution"];
let recordToolExecutionMetric: jest.SpiedFunction<
  typeof import("../../lib/metrics.js")["recordToolExecutionMetric"]
>;

beforeAll(async () => {
  const prismaMockModule: any = await import("../../__mocks__/prisma.js");
  mockPrisma = prismaMockModule.mockPrismaClient || prismaMockModule.prisma;
  resetMockData = prismaMockModule.resetMockData;
  const runContextModule = await import("../orchestration/run-context.js");
  runWithAgentContext = runContextModule.runWithAgentContext;
  const serviceModule = await import("../tool-execution.service.js");
  recordToolExecution = serviceModule.recordToolExecution;
  const metricsModule = await import("../../lib/metrics.js");
  recordToolExecutionMetric = jest.spyOn(metricsModule, "recordToolExecutionMetric");
});

describe("recordToolExecution", () => {
  beforeEach(() => {
    resetMockData();
    jest.clearAllMocks();
  });

  it("creates Tool + ToolExecution rows and emits completed metrics", async () => {
    const context = {
      runId: "run-1",
      agentId: "agent-1",
      agentName: "ContentAgent",
      organizationId: "org-1",
      prisma: mockPrisma,
    };

    const response = await runWithAgentContext(context, () =>
      recordToolExecution("gmail", "send", { subject: "demo" }, async () => ({ ok: true })),
    );

    expect(response).toEqual({ ok: true });
    expect(mockPrisma.tool.upsert).toHaveBeenCalledTimes(1);
    expect(mockPrisma.toolExecution.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.toolExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "completed" }),
      }),
    );
    expect(recordToolExecutionMetric).toHaveBeenCalledWith("gmail", "completed", expect.any(Number));
  });

  it("marks ToolExecution failed and emits failure metrics", async () => {
    const context = {
      runId: "run-err",
      agentId: "agent-err",
      organizationId: "org-err",
      prisma: mockPrisma,
    };

    await expect(
      runWithAgentContext(context, () =>
        recordToolExecution("slack", "postMessage", { channel: "C1" }, async () => {
          throw new Error("boom");
        }),
      ),
    ).rejects.toThrow("boom");

    expect(mockPrisma.toolExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "failed" }),
      }),
    );
    expect(recordToolExecutionMetric).toHaveBeenCalledWith("slack", "failed", expect.any(Number));
  });
});
