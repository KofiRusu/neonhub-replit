import { z } from "zod";

// Health check response
export const HealthResponseSchema = z.object({
  status: z.enum(["ok", "error"]),
  db: z.boolean(),
  ws: z.boolean(),
  version: z.string(),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// Content generation
export const GenerateContentRequestSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  tone: z.enum(["professional", "casual", "friendly", "authoritative"]).default("professional"),
  audience: z.string().optional(),
  notes: z.string().optional(),
});

export type GenerateContentRequest = z.infer<typeof GenerateContentRequestSchema>;

export const ContentDraftSchema = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.string(),
  body: z.string(),
  status: z.enum(["draft", "generated", "published"]),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ContentDraft = z.infer<typeof ContentDraftSchema>;

// Metrics
export const TrackEventRequestSchema = z.object({
  type: z.string(),
  meta: z.record(z.any()).optional(),
});

export type TrackEventRequest = z.infer<typeof TrackEventRequestSchema>;

// Agent Job
export const AgentJobSchema = z.object({
  id: z.string(),
  agent: z.string(),
  input: z.record(z.any()),
  output: z.record(z.any()).nullable(),
  status: z.enum(["queued", "running", "success", "error"]),
  error: z.string().nullable(),
  metrics: z.record(z.any()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AgentJob = z.infer<typeof AgentJobSchema>;
