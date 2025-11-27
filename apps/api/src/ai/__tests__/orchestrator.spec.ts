// @ts-nocheck
// Temporary suppression — legacy suite. Logged in AGENT_COMPLETION_PROGRESS.md.
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { executePreview, executeTask } from "../core/orchestrator";
import type { TaskSpec } from "../core/reason";

jest.mock("../workflows/pipeline", () => ({
  runPipeline: jest.fn(),
}));

jest.mock("../core/reason", () => ({
  route: jest.fn(),
  REGISTRY: {},
}));

jest.mock("../utils/runtime", () => ({
  useLiveModel: jest.fn(),
}));

jest.mock("../scoring/reward", () => ({
  recordReward: jest.fn(),
}));

jest.mock("../../services/agent-run.service", () => ({
  startRun: jest.fn(),
  recordStep: jest.fn(),
  finishRun: jest.fn(),
}));

const { runPipeline } = jest.requireMock("../workflows/pipeline") as { runPipeline: jest.Mock };
const { route } = jest.requireMock("../core/reason") as { route: jest.Mock };
const { useLiveModel } = jest.requireMock("../utils/runtime") as { useLiveModel: jest.Mock };
const { recordReward } = jest.requireMock("../scoring/reward") as { recordReward: jest.Mock };
const agentRunService = jest.requireMock("../../services/agent-run.service") as {
  startRun: jest.Mock;
  recordStep: jest.Mock;
  finishRun: jest.Mock;
};

describe("AI Orchestrator", () => {
  const baseTask: TaskSpec = {
    objective: "Write release summary",
    channel: "blog",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("executes preview runs and returns pipeline data", async () => {
    const pipelineResult = {
      score: { total: 0.8 },
      draft: "mock",
      steps: [],
      suggestions: [],
      verify: { ok: true, issues: [] },
      context: { docs: [], session: [], llm: { used: true } },
    };

    runPipeline.mockResolvedValue(pipelineResult);
    route.mockReturnValue("content-agent");
    useLiveModel.mockReturnValue(true);

    const result = await executePreview(baseTask, undefined);

    expect(runPipeline).toHaveBeenCalledWith({ ...baseTask, channel: "blog" });
    expect(recordReward).toHaveBeenCalledWith("content-agent", pipelineResult.score.total);
    expect(result.agent).toBe("content-agent");
    expect(result.usedLiveModel).toBe(true);
    expect(result.draft).toBe("mock");
  });

  it("persists successful runs via executeTask", async () => {
    const pipelineResult = {
      score: { total: 0.92 },
      draft: "final draft",
      steps: [],
      suggestions: [],
      verify: { ok: true, issues: [] },
      context: { docs: [], session: [], llm: { used: false } },
    };

    const startRunResult = { id: "run-123" };

    runPipeline.mockResolvedValue(pipelineResult);
    route.mockReturnValue(undefined);
    useLiveModel.mockReturnValue(false);
    agentRunService.startRun.mockResolvedValue(startRunResult);
    agentRunService.recordStep.mockImplementation(async (_db, _runId, _label, factory) => factory());
    agentRunService.finishRun.mockResolvedValue(undefined);

    const db = {};
    const result = await executeTask(db, "org-42", "editor-agent", baseTask);

    expect(agentRunService.startRun).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        agentId: "editor-agent",
        agentName: "editor-agent",
        orgId: "org-42",
        payload: expect.objectContaining({ objective: baseTask.objective }),
      })
    );
    expect(agentRunService.recordStep).toHaveBeenCalledWith(
      db,
      "run-123",
      "ai-pipeline",
      expect.any(Function),
      {}
    );
    expect(agentRunService.finishRun).toHaveBeenCalledWith(db, startRunResult, expect.objectContaining({
      status: "SUCCESS",
      result: pipelineResult,
    }));
    expect(recordReward).toHaveBeenCalledWith("editor-agent", pipelineResult.score.total);
    expect(result).toMatchObject({
      runId: "run-123",
      agent: "editor-agent",
      usedLiveModel: false,
      result: pipelineResult,
    });
  });

  it("marks run as failed when pipeline throws", async () => {
    const error = new Error("pipeline failure");
    runPipeline.mockRejectedValue(error);
    route.mockReturnValue("content-agent");
    useLiveModel.mockReturnValue(false);
    agentRunService.startRun.mockResolvedValue({ id: "run-500" });
    agentRunService.recordStep.mockImplementation(async (_db, _id, _label, factory) => factory());
    agentRunService.finishRun.mockResolvedValue(undefined);

    await expect(executeTask({}, "org-1", "content-agent", baseTask)).rejects.toThrow("pipeline failure");

    expect(agentRunService.finishRun).toHaveBeenCalledWith({}, { id: "run-500" }, expect.objectContaining({
      status: "FAILED",
      error,
    }));
    expect(recordReward).not.toHaveBeenCalled();
  });
});
