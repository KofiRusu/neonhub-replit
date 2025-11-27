import { z } from 'zod';

/**
 * Prompt metadata schema
 */
export const PromptMetadataSchema = z.object({
  id: z.string(),
  version: z.string(),
  agent: z.string(),
  locale: z.string().default('en-US'),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  constraints: z.object({
    maxTokens: z.number().optional(),
    temperature: z.number().optional(),
    model: z.string().optional(),
  }).optional(),
  variables: z.array(z.string()).default([]),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  author: z.string().optional(),
});

export type PromptMetadata = z.infer<typeof PromptMetadataSchema>;

/**
 * Prompt template schema
 */
export const PromptTemplateSchema = z.object({
  metadata: PromptMetadataSchema,
  template: z.string(),
  system: z.string().optional(),
  examples: z.array(z.object({
    user: z.string(),
    assistant: z.string(),
  })).optional(),
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

/**
 * Compiled prompt schema
 */
export const CompiledPromptSchema = z.object({
  id: z.string(),
  version: z.string(),
  system: z.string().optional(),
  user: z.string(),
  examples: z.array(z.object({
    user: z.string(),
    assistant: z.string(),
  })).optional(),
  metadata: PromptMetadataSchema,
});

export type CompiledPrompt = z.infer<typeof CompiledPromptSchema>;

/**
 * Prompt execution result
 */
export const PromptExecutionResultSchema = z.object({
  promptId: z.string(),
  version: z.string(),
  variables: z.record(z.unknown()),
  compiledPrompt: z.string(),
  timestamp: z.string().datetime(),
  hash: z.string(),
});

export type PromptExecutionResult = z.infer<typeof PromptExecutionResultSchema>;

/**
 * Snapshot test schema
 */
export const SnapshotTestSchema = z.object({
  promptId: z.string(),
  version: z.string(),
  variables: z.record(z.unknown()),
  expectedOutput: z.string(),
  hash: z.string(),
  createdAt: z.string().datetime(),
});

export type SnapshotTest = z.infer<typeof SnapshotTestSchema>;

