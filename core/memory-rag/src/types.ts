import { z } from 'zod';

/**
 * Profile memory schemas
 */
export const ProfileMemorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  key: z.string(),
  value: z.unknown(),
  category: z.string().optional(),
  confidence: z.number().min(0).max(1).default(1.0),
  source: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date().optional(),
});

export type ProfileMemory = z.infer<typeof ProfileMemorySchema>;

/**
 * Conversation memory schemas
 */
export const ConversationMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: z.enum(['user', 'assistant', 'system', 'function']),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  embedding: z.array(z.number()).optional(),
  createdAt: z.date(),
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

export const ConversationSummarySchema = z.object({
  conversationId: z.string(),
  summary: z.string(),
  topics: z.array(z.string()),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  keyPoints: z.array(z.string()).optional(),
  createdAt: z.date(),
});

export type ConversationSummary = z.infer<typeof ConversationSummarySchema>;

/**
 * Knowledge base document schemas
 */
export const KBDocumentSchema = z.object({
  id: z.string(),
  type: z.enum(['brand', 'product', 'campaign', 'general']),
  entityId: z.string().optional(), // brand/product/campaign ID
  title: z.string(),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).default([]),
  version: z.string().default('1.0.0'),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type KBDocument = z.infer<typeof KBDocumentSchema>;

/**
 * Knowledge base chunk (for RAG)
 */
export const KBChunkSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  content: z.string(),
  embedding: z.array(z.number()),
  metadata: z.record(z.unknown()).optional(),
  chunkIndex: z.number(),
  tokens: z.number().optional(),
  createdAt: z.date(),
});

export type KBChunk = z.infer<typeof KBChunkSchema>;

/**
 * Search result with relevance
 */
export const SearchResultSchema = z.object({
  chunk: KBChunkSchema,
  document: KBDocumentSchema,
  score: z.number(),
  distance: z.number().optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

/**
 * RAG retrieval options
 */
export const RetrievalOptsSchema = z.object({
  topK: z.number().default(5),
  minScore: z.number().min(0).max(1).default(0.7),
  filters: z.object({
    type: z.enum(['brand', 'product', 'campaign', 'general']).optional(),
    entityId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  }).optional(),
});

export type RetrievalOpts = z.infer<typeof RetrievalOptsSchema>;

/**
 * Embedding provider interface
 */
export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
  dimension: number;
}

