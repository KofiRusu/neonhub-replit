import { z } from "zod";

const optionalIsoDate = z.string().datetime({ offset: true }).optional();

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

export type OrchestratorContext = z.infer<typeof OrchestratorContextSchema>;
export type OrchestratorRequestPayload = z.infer<typeof OrchestratorRequestSchema>;
export type OrchestratorErrorDetail = z.infer<typeof OrchestratorErrorDetailSchema>;
export type OrchestratorSuccessResponse = z.infer<typeof OrchestratorSuccessSchema>;
export type OrchestratorErrorResponse = z.infer<typeof OrchestratorErrorSchema>;
export type OrchestratorUnifiedResponse = z.infer<typeof OrchestratorResponseSchema>;

export function isSuccessResponse(
  response: OrchestratorUnifiedResponse,
): response is OrchestratorSuccessResponse {
  return response.success === true;
}

export function isErrorResponse(
  response: OrchestratorUnifiedResponse,
): response is OrchestratorErrorResponse {
  return response.success === false;
}
