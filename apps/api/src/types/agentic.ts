import { z } from "zod";

const CHANNEL_VALUES = [
  "email",
  "sms",
  "dm",
  "post",
  "social",
  "push",
  "voice",
  "instagram",
  "facebook",
  "x",
  "reddit",
  "whatsapp",
  "tiktok",
  "youtube",
  "linkedin",
  "site",
] as const;

export type Channel = (typeof CHANNEL_VALUES)[number];
export const CHANNELS: readonly Channel[] = CHANNEL_VALUES;
export type ChannelKind = Channel;

const CHANNEL_SET = new Set<Channel>(CHANNEL_VALUES);
export const DEFAULT_CHANNEL: Channel = "email";

export function normalizeChannel(value: string | null | undefined, fallback: Channel = DEFAULT_CHANNEL): Channel {
  if (!value) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase() as Channel;
  return CHANNEL_SET.has(normalized) ? normalized : fallback;
}

const OBJECTIVE_VALUES = [
  "nurture",
  "winback",
  "demo_book",
  "upsell",
  "cross_sell",
  "onboard",
  "support",
  "education",
] as const;

export type ObjectiveType = (typeof OBJECTIVE_VALUES)[number];
export const OBJECTIVE_TYPES: readonly ObjectiveType[] = OBJECTIVE_VALUES;

export type ConsentStatus = "granted" | "revoked" | "denied" | "pending";

export const IdentityDescriptorSchema = z.object({
  organizationId: z.string(),
  email: z.string().email().optional(),
  phone: z.string().min(5).optional(),
  handle: z.string().min(2).optional(),
  externalId: z.string().optional(),
  brandId: z.string().optional(),
  createIfMissing: z.boolean().default(true),
  traits: z.record(z.unknown()).optional(),
});

export type IdentityDescriptor = z.infer<typeof IdentityDescriptorSchema>;

export interface MemoryRecord {
  id: string;
  personId: string;
  label?: string | null;
  summary?: string | null;
  embedding?: number[] | null;
  metadata?: Record<string, unknown> | null;
  sourceEventId?: string | null;
  createdAt: Date;
  expiresAt?: Date | null;
}

export interface MemoryQueryOptions {
  limit?: number;
  since?: Date;
  includeVectors?: boolean;
  includeEvents?: boolean;
}

export interface TopicSignal {
  topic: string;
  delta: number;
  weight?: number;
  confidence?: number;
}

export interface NoteInput {
  body: string;
  tags?: string[];
  visibility?: "internal" | "shared";
}

export interface PromptOutcome {
  success: boolean;
  snippetId?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface TopicEventSignal {
  topic?: string;
  confidence?: number;
  weight?: number;
}

export interface RawEvent {
  organizationId: string;
  channel: ChannelKind;
  type: string;
  payload?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  provider?: string;
  providerId?: string;
  personId?: string;
  email?: string;
  phone?: string;
  handle?: string;
  campaignId?: string;
  objectiveId?: string;
  occurredAt?: string | Date;
  source?: string;
}

export interface NormalizedEvent {
  organizationId: string;
  personId: string;
  channel: ChannelKind;
  type: string;
  payload: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  campaignId?: string;
  objectiveId?: string;
  provider?: string;
  providerId?: string;
  occurredAt: Date;
  source?: string;
}

export interface EventClassification {
  topic?: string;
  intent?: string;
  sentiment?: "positive" | "neutral" | "negative";
  confidence?: number;
}

export interface EmbeddingResult {
  id: string;
  vector: number[];
  createdAt: Date;
}

export interface StructuredPromptExample {
  label?: string;
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface StructuredPrompt {
  system: string;
  brandVoice: string[];
  pillars?: string[];
  guardrails?: string[];
  examples?: StructuredPromptExample[];
  metadata?: Record<string, unknown>;
}

export interface PromptPack {
  useCase: string;
  brandId: string;
  prompt: StructuredPrompt;
}

export interface ComposeArgs {
  channel: Channel;
  objective: string;
  personId: string;
  brandId: string;
  constraints?: Record<string, unknown>;
}

export interface ComposeResultVariant {
  subject?: string;
  body: string;
  cta?: string;
  score?: number;
}

export interface ComposeResult {
  subject?: string;
  body: string;
  variants: ComposeResultVariant[];
  cta?: string;
  metadata?: Record<string, unknown>;
}

export interface GuardrailResult {
  safe: boolean;
  redacted?: string;
  violations: string[];
  metadata?: Record<string, unknown>;
}

export interface BudgetObjectivePlan {
  objectiveId: string;
  amount: number;
  channel?: ChannelKind;
  priority?: number;
}

export interface BudgetLedgerRequest {
  start: Date;
  end: Date;
}

export interface CadenceRecommendation {
  nextSendTime: Date;
  channel: ChannelKind;
  confidence?: number;
}

export interface SnippetRank {
  id: string;
  name: string;
  channel: ChannelKind;
  winRate?: number | null;
  usageCount: number;
  content: string;
}
