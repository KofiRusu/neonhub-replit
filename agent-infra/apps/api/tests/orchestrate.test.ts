import { jest } from "@jest/globals";
import { RunStatus, StepStatus } from "@prisma/client";
import type { WorkflowDag } from "@agent-infra/workflow-dag";

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://test@test/test";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

type Counter = { inc: jest.Mock };

const createCounter = (): Counter => ({ inc: jest.fn() });

const runsStarted = createCounter();
const runsFailed = createCounter();
const stepsEnqueued = createCounter();

const stepsQueueAdd = jest.fn();
const agentRunUpdateOutside = jest.fn();

const workspace = { id: "workspace-1", slug: "default" };

const dag: WorkflowDag = {
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
  versionId: "version-1",
  workspaceId: workspace.id,
  status: RunStatus.running,
  trigger: "manual",
  input: {},
  output: null,
  error: null,
  startedAt: new Date(),
  endedAt: null,
  idempotencyKey: null,
  createdAt: new Date()
};

const stepRecord = {
  id: "step-1",
  runId: runRecord.id,
  nodeId: "n1",
  type: "action",
  status: StepStatus.ready,
  attempt: 0,
  maxAttempts: 3,
  scheduledFor: null,
  input: {},
  output: null,
  error: null,
  startedAt: null,
  endedAt: null,
  createdAt: new Date()
};

const prismaTx = {
  workspace: {
    findUnique: jest.fn().mockResolvedValue(workspace)
  },
  workflow: {
    findUnique: jest.fn().mockResolvedValue({
      id: "workflow-1",
      workspaceId: workspace.id,
      name: "HTTP to Slack",
      latestVersion: {
        id: "version-1",
        dagJson: dag
      }
    })
  },
  idempotencyKey: {
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn()
  },
  agentRun: {
    create: jest.fn().mockResolvedValue(runRecord),
    update: jest.fn()
  },
  runStep: {
    create: jest.fn().mockResolvedValue(stepRecord)
  }
};

const prismaMock = {
  $transaction: jest.fn(async (cb: any) => cb(prismaTx)),
  agentRun: {
    update: agentRunUpdateOutside
  }
};

const prismaModulePath = new URL("../src/db/prisma.js", import.meta.url).href;
const queueModulePath = new URL("../src/queue/queues.js", import.meta.url).href;
const metricsModulePath = new URL("../src/metrics.js", import.meta.url).href;
const loggerModulePath = new URL("../src/lib/logger.js", import.meta.url).href;

jest.unstable_mockModule(prismaModulePath, () => ({ prisma: prismaMock }));
jest.unstable_mockModule(queueModulePath, () => ({
  stepsQueue: { add: stepsQueueAdd }
}));
jest.unstable_mockModule(metricsModulePath, () => ({
  runsStarted,
  runsFailed,
  stepsEnqueued
}));
jest.unstable_mockModule(loggerModulePath, () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

const { orchestrate } = await import("../src/services/orchestrator/index.js");

describe("orchestrate", () => {
  beforeEach(() => {
    stepsQueueAdd.mockClear();
    stepsQueueAdd.mockResolvedValue(undefined);
    runsStarted.inc.mockClear();
    runsFailed.inc.mockClear();
    stepsEnqueued.inc.mockClear();
    prismaTx.runStep.create.mockClear();
    prismaTx.agentRun.create.mockClear();
  });

  it("creates a run and enqueues initial steps", async () => {
    const result = await orchestrate({
      workspaceSlug: workspace.slug,
      workflowName: "HTTP to Slack"
    });

    expect(prismaTx.agentRun.create).toHaveBeenCalled();
    expect(prismaTx.runStep.create).toHaveBeenCalledTimes(1);
    expect(stepsQueueAdd).toHaveBeenCalledTimes(1);
    expect(runsStarted.inc).toHaveBeenCalled();
    expect(result.stepsEnqueued).toHaveLength(1);
  });
});
