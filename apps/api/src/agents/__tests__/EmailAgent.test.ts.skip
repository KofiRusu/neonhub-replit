import { describe, expect, it, beforeEach, afterEach, jest } from "@jest/globals";
import type { PrismaClient } from "@prisma/client";
import type { OrchestratorRequest, OrchestratorResponse } from "../../services/orchestration/types.js";
import { emailAgent } from "../EmailAgent.js";
import { logger } from "../../lib/logger.js";

const createPrismaMock = (): {
  prisma: PrismaClient;
  agentRun: {
    create: jest.Mock;
    update: jest.Mock;
  };
} => {
  const agentRun = {
    create: jest.fn(),
    update: jest.fn(),
  };

  return {
    prisma: {
      agentRun,
    } as unknown as PrismaClient,
    agentRun,
  };
};

describe("EmailAgent.handle", () => {
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const baseRequest = (overrides?: Partial<OrchestratorRequest>): OrchestratorRequest => ({
    agent: "EmailAgent",
    intent: "generate-sequence",
    payload: {
      topic: "Launch",
      audience: "marketers",
      objective: "awareness",
      numEmails: 1,
    },
    context: {
      organizationId: "org-123",
      prisma: prismaMock.prisma,
      logger,
      userId: "user-456",
    },
    ...overrides,
  });

  it("creates and completes an AgentRun on successful execution", async () => {
    (prismaMock.agentRun.create as jest.Mock).mockImplementation(async () => ({ id: "run-1" }));
    (prismaMock.agentRun.update as jest.Mock).mockImplementation(async () => undefined);

    const generatedSequence = { jobId: "job-1", sequence: [{ day: 0, subject: "Hello", body: "World" }] };
    const generateSequenceSpy = jest.spyOn(emailAgent, "generateSequence").mockResolvedValue(generatedSequence);

    const response = await emailAgent.handle(baseRequest());

    expect(response).toEqual({ ok: true, data: generatedSequence });
    expect(generateSequenceSpy).toHaveBeenCalledTimes(1);

    expect(prismaMock.agentRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentId: "EmailAgent",
          organizationId: "org-123",
          status: "running",
        }),
      }),
    );

    expect(prismaMock.agentRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "run-1" },
        data: expect.objectContaining({
          status: "completed",
          output: expect.anything(),
        }),
      }),
    );

    const updateCall = prismaMock.agentRun.update.mock.calls[0][0] as { data: { metrics: Record<string, unknown> } };
    const metrics = updateCall.data.metrics;
    expect(metrics).toEqual(expect.objectContaining({ emailsGenerated: 1 }));
  });

  it("records failed AgentRun when underlying execution throws", async () => {
    (prismaMock.agentRun.create as jest.Mock).mockImplementation(async () => ({ id: "run-42" }));
    (prismaMock.agentRun.update as jest.Mock).mockImplementation(async () => undefined);

    const generateSequenceSpy = jest
      .spyOn(emailAgent, "generateSequence")
      .mockRejectedValue(new Error("generation failed"));

    const response = await emailAgent.handle(baseRequest());

    expect(response.ok).toBe(false);
    if (!response.ok) {
      const failure = response as Extract<OrchestratorResponse, { ok: false }>;
      expect(failure.code).toBe("AGENT_EXECUTION_FAILED");
    }
    expect(generateSequenceSpy).toHaveBeenCalledTimes(1);

    expect(prismaMock.agentRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "run-42" },
        data: expect.objectContaining({
          status: "failed",
        }),
      }),
    );

    const updateCall = prismaMock.agentRun.update.mock.calls[0][0] as { data: { metrics: Record<string, unknown> } };
    const metrics = updateCall.data.metrics;
    expect(metrics).toEqual(expect.objectContaining({ error: "generation failed" }));
  });

  it("rejects invalid context", async () => {
    const response = await emailAgent.handle(
      baseRequest({
        context: { prisma: prismaMock.prisma },
      }),
    );

    expect(response.ok).toBe(false);
    if (!response.ok) {
      const failure = response as Extract<OrchestratorResponse, { ok: false }>;
      expect(failure.code).toBe("INVALID_CONTEXT");
    }
    expect(prismaMock.agentRun.create).not.toHaveBeenCalled();
  });
});
