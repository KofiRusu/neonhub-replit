import { z } from "zod";

export declare const OrchestratorContextSchema: z.ZodObject<
  {
    userId: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    [x: string]: unknown;
    userId?: string | undefined;
    organizationId?: string | undefined;
  },
  {
    [x: string]: unknown;
    userId?: string | undefined;
    organizationId?: string | undefined;
  }
>;

export declare const OrchestratorRequestSchema: z.ZodObject<
  {
    agent: z.ZodOptional<z.ZodString>;
    intent: z.ZodString;
    payload: z.ZodOptional<z.ZodUnknown>;
    context: z.ZodOptional<typeof OrchestratorContextSchema>;
  },
  "strip",
  z.ZodTypeAny,
  {
    agent?: string | undefined;
    intent: string;
    payload?: unknown;
    context?: {
      [x: string]: unknown;
      userId?: string | undefined;
      organizationId?: string | undefined;
    } | undefined;
  },
  {
    agent?: string | undefined;
    intent: string;
    payload?: unknown;
    context?: {
      [x: string]: unknown;
      userId?: string | undefined;
      organizationId?: string | undefined;
    } | undefined;
  }
>;

export declare const OrchestratorErrorDetailSchema: z.ZodObject<
  {
    code: z.ZodString;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodUnknown>;
  },
  "strip",
  z.ZodTypeAny,
  {
    code: string;
    message: string;
    details?: unknown;
  },
  {
    code: string;
    message: string;
    details?: unknown;
  }
>;

export declare const OrchestratorSuccessSchema: z.ZodObject<
  {
    success: z.ZodLiteral<true>;
    status: z.ZodDefault<z.ZodEnum<["completed", "accepted"]>>;
    agent: z.ZodString;
    intent: z.ZodString;
    runId: z.ZodOptional<z.ZodString>;
    data: z.ZodUnknown;
    metrics: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    timestamp: z.ZodString;
  },
  "strip",
  z.ZodTypeAny,
  {
    success: true;
    status: "completed" | "accepted";
    agent: string;
    intent: string;
    runId?: string | undefined;
    data: unknown;
    metrics?: Record<string, unknown> | undefined;
    timestamp: string;
  },
  {
    success: true;
    status: "completed" | "accepted";
    agent: string;
    intent: string;
    runId?: string | undefined;
    data: unknown;
    metrics?: Record<string, unknown> | undefined;
    timestamp: string;
  }
>;

export declare const OrchestratorErrorSchema: z.ZodObject<
  {
    success: z.ZodLiteral<false>;
    status: z.ZodLiteral<"failed">;
    agent: z.ZodOptional<z.ZodString>;
    intent: z.ZodOptional<z.ZodString>;
    runId: z.ZodOptional<z.ZodString>;
    error: typeof OrchestratorErrorDetailSchema;
    timestamp: z.ZodString;
  },
  "strip",
  z.ZodTypeAny,
  {
    success: false;
    status: "failed";
    agent?: string | undefined;
    intent?: string | undefined;
    runId?: string | undefined;
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
    timestamp: string;
  },
  {
    success: false;
    status: "failed";
    agent?: string | undefined;
    intent?: string | undefined;
    runId?: string | undefined;
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
    timestamp: string;
  }
>;

export declare const OrchestratorResponseSchema: z.ZodUnion<[typeof OrchestratorSuccessSchema, typeof OrchestratorErrorSchema]>;

export declare const DEFAULT_ERROR_CODES: Readonly<{
  UNAUTHENTICATED: "UNAUTHENTICATED";
  RATE_LIMITED: "RATE_LIMITED";
  NOT_REGISTERED: "AGENT_NOT_REGISTERED";
  CIRCUIT_OPEN: "CIRCUIT_OPEN";
  EXECUTION_FAILED: "AGENT_EXECUTION_FAILED";
  VALIDATION_FAILED: "INVALID_REQUEST";
  UNKNOWN: "ORCHESTRATION_FAILED";
}>;

export type OrchestratorContext = z.infer<typeof OrchestratorContextSchema>;
export type OrchestratorRequestPayload = z.infer<typeof OrchestratorRequestSchema>;
export type OrchestratorErrorDetail = z.infer<typeof OrchestratorErrorDetailSchema>;
export type OrchestratorSuccessResponse = z.infer<typeof OrchestratorSuccessSchema>;
export type OrchestratorErrorResponse = z.infer<typeof OrchestratorErrorSchema>;
export type OrchestratorUnifiedResponse = z.infer<typeof OrchestratorResponseSchema>;
export type OrchestratorErrorCode = (typeof DEFAULT_ERROR_CODES)[keyof typeof DEFAULT_ERROR_CODES];

export declare function isSuccessResponse(
  response: OrchestratorUnifiedResponse,
): response is OrchestratorSuccessResponse;

export declare function isErrorResponse(
  response: OrchestratorUnifiedResponse,
): response is OrchestratorErrorResponse;
