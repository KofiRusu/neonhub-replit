import { z } from 'zod';

/**
 * Core message types for chat-based LLM interactions
 */
export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'function', 'tool']),
  content: z.string(),
  name: z.string().optional(),
  function_call: z.any().optional(),
  tool_calls: z.array(z.any()).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Call options for LLM requests
 */
export const CallOptsSchema = z.object({
  timeout: z.number().default(60000), // 60s default
  maxRetries: z.number().default(3),
  retryDelay: z.number().default(1000), // 1s base delay
  circuitBreakerThreshold: z.number().default(5),
  abortSignal: z.instanceof(AbortSignal).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CallOpts = z.infer<typeof CallOptsSchema>;

/**
 * Chat request structure
 */
export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema),
  model: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  user: z.string().optional(),
  tools: z.array(z.any()).optional(),
  toolChoice: z.union([z.literal('auto'), z.literal('none'), z.object({ type: z.literal('function'), function: z.object({ name: z.string() }) })]).optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Usage statistics
 */
export const UsageSchema = z.object({
  promptTokens: z.number(),
  completionTokens: z.number(),
  totalTokens: z.number(),
  cost: z.number().optional(), // USD
});

export type Usage = z.infer<typeof UsageSchema>;

/**
 * Chat response structure
 */
export const ChatResponseSchema = z.object({
  content: z.string(),
  finishReason: z.enum(['stop', 'length', 'function_call', 'tool_calls', 'content_filter', 'error']).optional(),
  usage: UsageSchema.optional(),
  model: z.string(),
  toolCalls: z.array(z.any()).optional(),
  cached: z.boolean().default(false),
  responseTime: z.number().optional(), // ms
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

/**
 * Streaming delta
 */
export const ChatDeltaSchema = z.object({
  delta: z.string(),
  finishReason: z.enum(['stop', 'length', 'function_call', 'tool_calls', 'content_filter']).optional(),
});

export type ChatDelta = z.infer<typeof ChatDeltaSchema>;

/**
 * Embedding request
 */
export const EmbedRequestSchema = z.object({
  texts: z.array(z.string()),
  model: z.string().default('text-embedding-ada-002'),
  dimensions: z.number().optional(),
});

export type EmbedRequest = z.infer<typeof EmbedRequestSchema>;

/**
 * Rerank request
 */
export const RerankRequestSchema = z.object({
  query: z.string(),
  documents: z.array(z.string()),
  topK: z.number().optional(),
});

export type RerankRequest = z.infer<typeof RerankRequestSchema>;

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit breaker interface
 */
export interface CircuitBreaker {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  recordSuccess(): void;
  recordFailure(): void;
  canExecute(): boolean;
  reset(): void;
}

/**
 * Cost tracker interface
 */
export interface CostTracker {
  trackUsage(model: string, usage: Usage): void;
  getTotalCost(): number;
  getCostByModel(model: string): number;
  getUsageStats(): Record<string, { calls: number; tokens: number; cost: number }>;
  reset(): void;
}

