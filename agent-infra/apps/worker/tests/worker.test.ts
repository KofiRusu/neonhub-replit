import { jest } from "@jest/globals";
import { StepStatus, RunStatus } from "@prisma/client";
import type { WorkflowDag } from "@agent-infra/workflow-dag";
import type { StepJob } from "@agent-infra/job-types";

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://test@test/test";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

type Counter = { inc: jest.Mock };
const makeCounter = (): Counter => ({ inc: jest.fn() });

const stepsStarted = makeCounter();
const stepsSucceeded = makeCounter();
const stepsFailed = makeCounter();

const mockQueueAdd = jest.fn().mockResolvedValue(undefined);

const workflowDag: WorkflowDag = {
  nodes: [
    {
      id: "n1",
      type: "action",
      connector: "http",
      action: "get",
      config: { url: "https://example.com" }
    }
  ],
  edges: []
};

const runRecord = {
  id: "run-1",
  workflowId: "workflow-1",
  workspaceId: "workspace-1",
  versionId: "version-1",
  status: RunStatus.running,
  trigger: "manual",
  input: {},
  output: null,
  error: null,
  startedAt: new Date(),
  endedAt: null,
  createdAt: new Date(),
  idempotencyKey: null,
  version: {
    id: "version-1",
    dagJson: workflowDag
  },
  steps: [
    {
      id: "step-1",
      runId: "run-1",
      nodeId: "n1",
      status: StepStatus.ready
    }
  ]
};

const runStepUpdate = jest
  .fn()
  .mockResolvedValueOnce({ ...runRecord.steps[0], status: StepStatus.running })
  .mockResolvedValueOnce({ ...runRecord.steps[0], status: StepStatus.succeeded });

const prismaMock = {
  agentRun: {
    findUnique: jest.fn().mockResolvedValue(runRecord),
    update: jest.fn().mockResolvedValue({ ...runRecord, status: RunStatus.completed })
  },
  runStep: {
    update: runStepUpdate,
    findMany: jest.fn().mockResolvedValue([
      {
        nodeId: "n1",
        status: StepStatus.succeeded
      }
    ]),
    create: jest.fn(),
    count: jest.fn().mockResolvedValue(0)
  },
  toolExecution: {
    create: jest.fn().mockResolvedValue({ id: "tool-1" })
  }
};

const executeConnectorAction = jest.fn().mockResolvedValue({ ok: true });

const prismaModulePath = new URL("../src/db/prisma.js", import.meta.url).href;
const metricsModulePath = new URL("../src/metrics.js", import.meta.url).href;
const loggerModulePath = new URL("../src/lib/logger.js", import.meta.url).href;
const connectorModulePath = "@agent-infra/connector-sdk";

jest.unstable_mockModule(prismaModulePath, () => ({ prisma: prismaMock }));
jest.unstable_mockModule(metricsModulePath, () => ({
  stepsStarted,
  stepsSucceeded,
  stepsFailed
}));
jest.unstable_mockModule(loggerModulePath, () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));
jest.unstable_mockModule(connectorModulePath, () => ({
  executeConnectorAction
}));

const { processStepJob } = await import("../src/worker.js");

describe("processStepJob", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    executeConnectorAction.mockResolvedValue({ ok: true });
    runStepUpdate.mockReset();
    runStepUpdate
      .mockResolvedValueOnce({ ...runRecord.steps[0], status: StepStatus.running })
      .mockResolvedValueOnce({ ...runRecord.steps[0], status: StepStatus.succeeded });
  });

  it("executes connector action and completes run", async () => {
    const job: StepJob = {
      runId: runRecord.id,
      stepId: "step-1",
      workflowId: runRecord.workflowId,
      workspaceId: runRecord.workspaceId,
      nodeId: "n1",
      connector: "http",
      action: "get",
      payload: {
        config: { url: "https://example.com" },
        input: {}
      },
      idempotencyKey: "step-1:attempt:0"
    };

    await processStepJob(job, { add: mockQueueAdd } as any);

    expect(executeConnectorAction).toHaveBeenCalledWith(
      "http",
      "get",
      expect.objectContaining({ runId: "run-1", stepId: "step-1" }),
      expect.any(Object)
    );
    expect(prismaMock.toolExecution.create).toHaveBeenCalled();
    expect(prismaMock.agentRun.update).toHaveBeenCalledWith(
      { id: runRecord.id },
      expect.objectContaining({ status: RunStatus.completed })
    );
    expect(mockQueueAdd).not.toHaveBeenCalled();
    expect(stepsSucceeded.inc).toHaveBeenCalled();
  });
});
