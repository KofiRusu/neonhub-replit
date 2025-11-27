import { describe, it, expect, beforeEach } from "@jest/globals";
import { orchestrateRouter } from "../orchestrate.js";
import type { OrchestratorResponse } from "../../services/orchestration/types.js";
import { orchestrate } from "../../services/orchestration/index.js";
import { DEFAULT_ERROR_CODES } from "@neonhub/orchestrator-contract";
import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.js";

jest.mock("../../services/orchestration/index.js", () => ({
  orchestrate: jest.fn(),
}));

const orchestrateMock = orchestrate as jest.MockedFunction<typeof orchestrate>;

const getHandler = () => {
  const layer = orchestrateRouter.stack.find((entry) => entry.route?.path === "/orchestrate");
  if (!layer) {
    throw new Error("orchestrate handler missing");
  }
  return layer.route.stack[0].handle as (req: Request, res: Response, next: NextFunction) => Promise<void>;
};

const createResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockImplementation(() => res);
  res.json = jest.fn().mockImplementation((body) => body);
  return res as Response & {
    status: jest.Mock;
    json: jest.Mock;
  };
};

describe("/api/orchestrate route", () => {
  beforeEach(() => {
    orchestrateMock.mockReset();
  });

  it("returns unified success envelopes", async () => {
    const response: OrchestratorResponse = {
      ok: true,
      data: { ok: true },
      meta: { agent: "ContentAgent", intent: "generate-draft", runId: "run_123" },
    };
    orchestrateMock.mockResolvedValue(response);

    const handler = getHandler();
    const res = createResponse();
    const req = {
      body: {
        agent: "ContentAgent",
        intent: "generate-draft",
        payload: { topic: "ai" },
        context: { userId: "user_1", organizationId: "org_1" },
      },
      user: { id: "user_1" },
    } as AuthRequest;

    await handler(req as Request, res as Response, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        status: "completed",
        agent: "ContentAgent",
        intent: "generate-draft",
        runId: "run_123",
        data: { ok: true },
      }),
    );
  });

  it("maps orchestrator errors to unified envelope", async () => {
    const response: OrchestratorResponse = {
      ok: false,
      error: "agent_not_registered",
      code: "AGENT_NOT_REGISTERED",
    };
    orchestrateMock.mockResolvedValue(response);

    const handler = getHandler();
    const res = createResponse();
    const req = {
      body: {
        agent: "ContentAgent",
        intent: "discover-trends",
        payload: {},
        context: { userId: "user_1", organizationId: "org_1" },
      },
      user: { id: "user_1" },
    } as AuthRequest;

    await handler(req as Request, res as Response, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        status: "failed",
        agent: "ContentAgent",
        intent: "discover-trends",
        error: expect.objectContaining({
          code: "AGENT_NOT_REGISTERED",
          message: "agent_not_registered",
        }),
      }),
    );
  });

  it("returns contract-compliant errors for validation failures", async () => {
    const handler = getHandler();
    const res = createResponse();
    const req = {
      body: {
        payload: {},
        context: { userId: "user_1" },
      },
    } as AuthRequest;

    await handler(req as Request, res as Response, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        status: "failed",
        error: expect.objectContaining({
          code: DEFAULT_ERROR_CODES.VALIDATION_FAILED,
          message: "invalid_request",
        }),
      }),
    );
  });
});
