import { z } from 'zod';

/**
 * Tool metadata schema
 */
export const ToolMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string().default('1.0.0'),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  requiresAuth: z.boolean().default(false),
  rateLimit: z.object({
    requests: z.number(),
    window: z.number(), // seconds
  }).optional(),
});

export type ToolMetadata = z.infer<typeof ToolMetadataSchema>;

/**
 * Tool execution options
 */
export const ToolExecutionOptsSchema = z.object({
  timeout: z.number().default(30000), // 30s default
  maxRetries: z.number().default(3),
  retryDelay: z.number().default(1000),
  budget: z.object({
    maxCost: z.number().optional(), // USD
    maxTokens: z.number().optional(),
    maxTime: z.number().optional(), // ms
  }).optional(),
  context: z.record(z.unknown()).optional(),
  abortSignal: z.instanceof(AbortSignal).optional(),
});

export type ToolExecutionOpts = z.infer<typeof ToolExecutionOptsSchema>;

/**
 * Tool execution result
 */
export const ToolExecutionResultSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  metadata: z.object({
    duration: z.number(),
    retries: z.number(),
    cost: z.number().optional(),
    tokens: z.number().optional(),
  }),
  timestamp: z.string().datetime(),
});

export type ToolExecutionResult = z.infer<typeof ToolExecutionResultSchema>;

/**
 * Tool budget tracker
 */
export interface BudgetTracker {
  consumed: {
    cost: number;
    tokens: number;
    time: number;
  };
  limits: {
    maxCost?: number;
    maxTokens?: number;
    maxTime?: number;
  };
  canExecute(): boolean;
  track(cost: number, tokens: number, time: number): void;
  reset(): void;
}

/**
 * Tool contract definition
 */
export interface ToolContract<TInput = unknown, TOutput = unknown> {
  metadata: ToolMetadata;
  inputSchema: z.ZodSchema<TInput>;
  outputSchema: z.ZodSchema<TOutput>;
  execute: (input: TInput, opts?: ToolExecutionOpts) => Promise<TOutput>;
}

/**
 * Tool registration entry
 */
export interface ToolRegistration {
  contract: ToolContract;
  enabled: boolean;
  rateLimitState?: {
    requests: number;
    windowStart: number;
  };
}

