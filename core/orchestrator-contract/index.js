import { z } from "zod";

export const OrchestratorContextSchema = z
  .object({
    userId: z.string().optional(),
    organizationId: z.string().optional(),
  })
  .catchall(z.unknown());

export const OrchestratorRequestSchema = z.object({
  agent: z.string().optional(),
  intent: z.string().min(1),
  payload: z.unknown().optional(),
  context: OrchestratorContextSchema.optional(),
});

export const OrchestratorErrorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export const OrchestratorSuccessSchema = z.object({
  success: z.literal(true),
  status: z.enum(["completed", "accepted"]).default("completed"),
  agent: z.string(),
  intent: z.string(),
  runId: z.string().optional(),
  data: z.unknown(),
  metrics: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime({ offset: true }),
});

export const OrchestratorErrorSchema = z.object({
  success: z.literal(false),
  status: z.literal("failed"),
  agent: z.string().optional(),
  intent: z.string().optional(),
  runId: z.string().optional(),
  error: OrchestratorErrorDetailSchema,
  timestamp: z.string().datetime({ offset: true }),
});

export const OrchestratorResponseSchema = z.union([
  OrchestratorSuccessSchema,
  OrchestratorErrorSchema,
]);

export const DEFAULT_ERROR_CODES = Object.freeze({
  UNAUTHENTICATED: "UNAUTHENTICATED",
  RATE_LIMITED: "RATE_LIMITED",
  NOT_REGISTERED: "AGENT_NOT_REGISTERED",
  CIRCUIT_OPEN: "CIRCUIT_OPEN",
  EXECUTION_FAILED: "AGENT_EXECUTION_FAILED",
  VALIDATION_FAILED: "INVALID_REQUEST",
  UNKNOWN: "ORCHESTRATION_FAILED",
});

export const isSuccessResponse = (response) => response.success === true;
export const isErrorResponse = (response) => response.success === false;
