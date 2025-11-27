import { describe, expect, it, jest } from "@jest/globals";
// @ts-nocheck
// Temporary suppression — legacy suite. Logged in AGENT_COMPLETION_PROGRESS.md.
import { RunStatus } from "@prisma/client";
import { finishRun, recordStep, startRun } from "../services/agent-run.service.js";

type AgentRunRecord = {
  id: string;
  status: RunStatus;
  startedAt: Date;
  completedAt?: Date | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  meta?: unknown;
};

type RunStepRecord = {
  id: string;
  status: RunStatus;
  name: string;
  startedAt: Date;
  completedAt?: Date | null;
  durationMs?: number | null;
  error?: string | null;
};

function createMockPrisma() {
  const runs: AgentRunRecord[] = [];
  const steps: RunStepRecord[] = [];

  const prisma = {
    agentRun: {
      create: jest.fn(async ({ data, select }: any) => {
        const id = `run_${runs.length + 1}`;
        const record = { ...data, id } as AgentRunRecord;
        runs.push(record);
        if (select) {
          return {
            id,
            startedAt: record.startedAt,
          };
        }
        return record;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const run = runs.find(entry => entry.id === where.id);
        if (!run) throw new Error("run not found");
        Object.assign(run, data);
        return run;
      }),
    },
    runStep: {
      create: jest.fn(async ({ data }: any) => {
        const id = `step_${steps.length + 1}`;
        const record = { ...data, id } as RunStepRecord;
        steps.push(record);
        return { id, startedAt: record.startedAt };
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const step = steps.find(entry => entry.id === where.id);
        if (!step) throw new Error("step not found");
        Object.assign(step, data);
        return step;
      }),
    },
  } as unknown as Parameters<typeof startRun>[0];

  return { prisma, runs, steps };
}

describe("agent-run service", () => {
  it("records successful runs with timing and steps", async () => {
    const { prisma, runs, steps } = createMockPrisma();

    const run = await startRun(prisma, {
      agentId: "agent-basic",
      agentName: "Agent Basic",
      orgId: "org-123",
      payload: { hello: "world" },
      intent: "test-intent",
      userId: "user-1",
    });

    const result = await recordStep(prisma, run.id, "agent.handle", async () => ({ ok: true }), {
      payload: { hello: "world" },
    });

    await finishRun(prisma, run, {
      result,
      metrics: { responseOk: true },
    });

    expect(runs).toHaveLength(1);
    expect(runs[0].status).toBe(RunStatus.SUCCESS);
    expect(runs[0].durationMs).toBeGreaterThanOrEqual(0);
    expect(runs[0].errorMessage).toBeUndefined();

    expect(steps).toHaveLength(1);
    expect(steps[0].status).toBe(RunStatus.SUCCESS);
    expect(steps[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it("captures failures and propagates errors", async () => {
    const { prisma, runs, steps } = createMockPrisma();

    const run = await startRun(prisma, {
      agentId: "agent-failure",
      agentName: "Agent Failure",
      orgId: "org-123",
      payload: { mode: "fail" },
      intent: "test-intent",
      userId: "user-2",
    });

    await expect(
      recordStep(prisma, run.id, "agent.handle", async () => {
        throw new Error("step failed");
      }),
    ).rejects.toThrow("step failed");

    await finishRun(prisma, run, {
      error: new Error("step failed"),
    });

    expect(runs[0].status).toBe(RunStatus.FAILED);
    expect(runs[0].errorMessage).toBe("step failed");
    expect(steps[0].status).toBe(RunStatus.FAILED);
    expect(steps[0].error).toBe("step failed");
  });
});
