/**
 * CommonJS fallback for the shared orchestrator contract.
 * Jest in the API workspace still expects CommonJS for plain `.js` files,
 * so we mirror the ESM exports here for test environments.
 */
const path = require("path");
const { createRequire } = require("module");
// Resolve zod from the API workspace so tests don't depend on hoisting.
const apiRequire = createRequire(path.resolve(__dirname, "../../apps/api/package.json"));
const { z } = apiRequire("zod");

const OrchestratorContextSchema = z
  .object({
    userId: z.string().optional(),
    organizationId: z.string().optional(),
  })
  .catchall(z.unknown());

const OrchestratorRequestSchema = z.object({
  agent: z.string().optional(),
  intent: z.string().min(1),
  payload: z.unknown().optional(),
  context: OrchestratorContextSchema.optional(),
});

const OrchestratorErrorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

const OrchestratorSuccessSchema = z.object({
  success: z.literal(true),
  status: z.enum(["completed", "accepted"]).default("completed"),
  agent: z.string(),
  intent: z.string(),
  runId: z.string().optional(),
  data: z.unknown(),
  metrics: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime({ offset: true }),
});

const OrchestratorErrorSchema = z.object({
  success: z.literal(false),
  status: z.literal("failed"),
  agent: z.string().optional(),
  intent: z.string().optional(),
  runId: z.string().optional(),
  error: OrchestratorErrorDetailSchema,
  timestamp: z.string().datetime({ offset: true }),
});

const OrchestratorResponseSchema = z.union([OrchestratorSuccessSchema, OrchestratorErrorSchema]);

const DEFAULT_ERROR_CODES = Object.freeze({
  UNAUTHENTICATED: "UNAUTHENTICATED",
  RATE_LIMITED: "RATE_LIMITED",
  NOT_REGISTERED: "AGENT_NOT_REGISTERED",
  CIRCUIT_OPEN: "CIRCUIT_OPEN",
  EXECUTION_FAILED: "AGENT_EXECUTION_FAILED",
  VALIDATION_FAILED: "INVALID_REQUEST",
  UNKNOWN: "ORCHESTRATION_FAILED",
});

const isSuccessResponse = (response) => response.success === true;
const isErrorResponse = (response) => response.success === false;

module.exports = {
  OrchestratorContextSchema,
  OrchestratorRequestSchema,
  OrchestratorErrorDetailSchema,
  OrchestratorSuccessSchema,
  OrchestratorErrorSchema,
  OrchestratorResponseSchema,
  DEFAULT_ERROR_CODES,
  isSuccessResponse,
  isErrorResponse,
};
