import { Router } from "express";
import { z } from "zod";
import { orchestrate } from "../services/orchestration/index.js";
import { AGENT_NAMES } from "../services/orchestration/types.js";
import type { OrchestratorResponse } from "../services/orchestration/types.js";
import { logger } from "../lib/logger.js";
import type { AuthRequest } from "../middleware/auth.js";

// Local schema definitions (orchestrator-contract package missing exports)
const OrchestratorRequestSchema = z.object({
  agent: z.string().optional(),
  intent: z.string(),
  payload: z.unknown().optional(),
  context: z.record(z.unknown()).optional(),
});
const OrchestratorResponseSchema = z.object({}).passthrough();
type OrchestratorUnifiedResponse = any;

// Error code constants
const DEFAULT_ERROR_CODES = {
  UNKNOWN: "UNKNOWN",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  RATE_LIMITED: "RATE_LIMITED",
  AGENT_NOT_REGISTERED: "AGENT_NOT_REGISTERED",
  CIRCUIT_OPEN: "CIRCUIT_OPEN",
  AGENT_EXECUTION_FAILED: "AGENT_EXECUTION_FAILED",
};

const OrchestratorErrorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

/*
Phase 4 contract alignment plan for this route:
1. Validate incoming payloads against the shared orchestrator contract.
2. Normalize every HTTP response to the unified envelope (agent, intent, status, timestamp).
3. Map orchestrator results (and legacy errors) into the schema so SDK + UI receive identical shapes.
4. Preserve existing status code mappings while returning structured error metadata.
*/

const orchestrateSchema = OrchestratorRequestSchema.extend({
  agent: z.enum(AGENT_NAMES).optional(),
});

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

export function formatOrchestrateResponse(
  result: OrchestratorResponse,
  fallback: { intent: string; agent?: string } = { intent: "unknown" },
): { status: number; body: OrchestratorUnifiedResponse } {
  const timestamp = new Date().toISOString();

  if (!result.ok) {
    const code = result.code ?? DEFAULT_ERROR_CODES.UNKNOWN;
    const detail = OrchestratorErrorDetailSchema.parse({
      code,
      message: result.error ?? "orchestration_failed",
      details: result.details,
    });

    const envelope = OrchestratorResponseSchema.parse({
      success: false,
      status: "failed",
      agent: result.meta?.agent ?? fallback.agent,
      intent: result.meta?.intent ?? fallback.intent,
      runId: result.meta?.runId,
      error: detail,
      timestamp,
    });

    return { status: statusFromCode(code), body: envelope };
  }

  const envelope = OrchestratorResponseSchema.parse({
    success: true,
    status: "completed",
    agent: result.meta?.agent ?? fallback.agent ?? "unknown",
    intent: result.meta?.intent ?? fallback.intent,
    runId: result.meta?.runId,
    data: result.data,
    metrics: result.meta?.metrics,
    timestamp,
  });

  return { status: 200, body: envelope };
}

orchestrateRouter.post("/orchestrate", async (req: AuthRequest, res) => {
  try {
    const input = orchestrateSchema.parse(req.body);
    const context = {
      ...(input.context || {}),
      userId: req.user?.id ?? (input.context as any)?.userId,
    };

    const result = await orchestrate({
      agent: input.agent,
      intent: input.intent,
      payload: input.payload,
      context,
    });

    const { status, body } = formatOrchestrateResponse(result, {
      intent: input.intent,
      agent: input.agent,
    });
    res.status(status).json(body);
  } catch (error) {
    logger.error({ error }, "Failed to orchestrate agent request");

    const fallbackIntent = typeof req.body?.intent === "string" ? req.body.intent : "unknown";
    const fallbackAgent = typeof req.body?.agent === "string" ? req.body.agent : undefined;

    if (error instanceof z.ZodError) {
      const { status, body } = formatOrchestrateResponse(
        {
          ok: false,
          error: "invalid_request",
          code: DEFAULT_ERROR_CODES.VALIDATION_FAILED,
          details: error.flatten(),
        },
        { intent: fallbackIntent, agent: fallbackAgent },
      );
      return res.status(status).json(body);
    }

    const { status, body } = formatOrchestrateResponse(
      {
        ok: false,
        error: "internal_error",
        code: DEFAULT_ERROR_CODES.UNKNOWN,
        details: { message: error instanceof Error ? error.message : "Unhandled error" },
      },
      { intent: fallbackIntent, agent: fallbackAgent },
    );
    return res.status(status).json(body);
  }
});
