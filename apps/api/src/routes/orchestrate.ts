import { Router } from "express";
import { z } from "zod";
import { orchestrate } from "../services/orchestration/index.js";
import { AGENT_NAMES } from "../services/orchestration/types.js";
import type { OrchestratorResponse } from "../services/orchestration/types.js";
import { logger } from "../lib/logger.js";
import type { AuthRequest } from "../middleware/auth.js";

const orchestrateSchema = z.object({
  agent: z.enum(AGENT_NAMES),
  intent: z.string().min(1),
  payload: z.unknown().optional(),
  context: z.record(z.string(), z.unknown()).optional()
});

type OrchestratorFailure = { ok: false; error: string; code?: string };

export const orchestrateRouter: Router = Router();

function statusFromCode(code: string | undefined): number {
  switch (code) {
    case "UNAUTHENTICATED":
      return 401;
    case "RATE_LIMITED":
      return 429;
    case "AGENT_NOT_REGISTERED":
      return 404;
    case "CIRCUIT_OPEN":
    case "AGENT_EXECUTION_FAILED":
      return 502;
    default:
      return 400;
  }
}

export function formatOrchestrateResponse(result: OrchestratorResponse): {
  status: number;
  body: Record<string, unknown>;
} {
  const timestamp = new Date().toISOString();

  if (!result.ok) {
    const failure = result as OrchestratorFailure;
    const status = statusFromCode(failure.code);
    return {
      status,
      body: {
        success: false,
        error: failure.error ?? "orchestration_failed",
        code: failure.code ?? "ORCHESTRATION_FAILED",
        timestamp,
      },
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      data: result.data,
      timestamp,
    },
  };
}

orchestrateRouter.post("/orchestrate", async (req: AuthRequest, res) => {
  try {
    const input = orchestrateSchema.parse(req.body);
    const context = {
      ...input.context,
      userId: req.user?.id ?? input.context?.userId
    };

    const result = await orchestrate({
      agent: input.agent,
      intent: input.intent,
      payload: input.payload,
      context
    });

    const { status, body } = formatOrchestrateResponse(result);
    res.status(status).json(body);
  } catch (error) {
    logger.error({ error }, "Failed to orchestrate agent request");
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "invalid_request",
        details: error.flatten()
      });
    }

    return res.status(500).json({
      success: false,
      error: "internal_error"
    });
  }
});
