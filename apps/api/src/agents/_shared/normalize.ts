import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import type { Logger } from "pino";

const DEFAULT_BRAND_ID = "default-brand";

const sequenceToneOptions = ["witty", "professional", "casual", "friendly", "authoritative"] as const;

export const SocialPlatformSchema = z.enum(["twitter", "linkedin", "facebook", "instagram"]);

export const GenerateSequenceInputSchema = z.object({
  brandId: z.string().min(1).default(DEFAULT_BRAND_ID),
  topic: z
    .string()
    .min(1, "topic is required")
    .transform(value => value.trim()),
  audience: z
    .string()
    .min(1)
    .default("general")
    .transform(value => value.trim()),
  tone: z.enum(sequenceToneOptions).default("witty"),
  objective: z
    .string()
    .min(1)
    .default("awareness")
    .transform(value => value.trim()),
  length: z
    .number()
    .int("length must be an integer")
    .min(1, "length must be at least 1")
    .max(10, "length cannot exceed 10")
    .default(3),
  seed: z
    .string()
    .optional()
    .transform(value => (value ? value.trim() : value)),
  createdById: z
    .string()
    .optional()
    .transform(value => (value ? value.trim() : value)),
});

type SequenceBase = z.infer<typeof GenerateSequenceInputSchema>;

export type GenerateSequenceInput = SequenceBase & {
  numEmails: number;
};

export function normalizeSequenceInput(
  input: Partial<GenerateSequenceInput> & { topic?: string }
): GenerateSequenceInput {
  const base = GenerateSequenceInputSchema.parse({
    ...input,
    length: input.length ?? input.numEmails,
  });

  const emails = input.numEmails ?? base.length;

  return {
    ...base,
    numEmails: emails,
  };
}

export const GeneratePostInputSchema = z.object({
  brandId: z.string().min(1).default(DEFAULT_BRAND_ID),
  content: z
    .string()
    .min(1, "content is required")
    .transform(value => value.trim()),
  platform: SocialPlatformSchema.default("instagram"),
  tone: z.enum(["professional", "casual", "engaging", "authoritative"]).default("engaging"),
  includeHashtags: z.boolean().default(false),
  hashtags: z.array(z.string().min(1)).default([]),
  callToAction: z
    .string()
    .min(1)
    .default("Learn more")
    .transform(value => value.trim()),
  topic: z
    .string()
    .min(1)
    .default("brand")
    .transform(value => value.trim()),
  createdById: z
    .string()
    .optional()
    .transform(value => (value ? value.trim() : value)),
});

export type GeneratePostInput = z.infer<typeof GeneratePostInputSchema>;

export type SocialPlatform = z.infer<typeof SocialPlatformSchema>;

export function normalizePostInput(input: Partial<GeneratePostInput>): GeneratePostInput {
  const normalized = GeneratePostInputSchema.safeParse({
    hashtags: input.includeHashtags === false ? [] : input.hashtags,
    ...input,
  });

  if (normalized.success) {
    return normalized.data;
  }

  throw normalized.error;
}

export function normalizeAgentInput<T>(raw: unknown, schema: z.ZodSchema<T>): T {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid agent input: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function normalizeAgentOutput<T>(result: unknown, schema: z.ZodSchema<T>): T {
  const parsed = schema.safeParse(result);
  if (!parsed.success) {
    throw new Error(`Invalid agent output: ${parsed.error.message}`);
  }
  return parsed.data;
}

export interface AgentRuntimeContext {
  organizationId: string;
  prisma: PrismaClient;
  logger?: Logger;
  userId?: string;
}

export function validateAgentContext(context: unknown): AgentRuntimeContext {
  if (!context || typeof context !== "object") {
    throw new Error("Agent context must be provided");
  }

  const record = context as Record<string, unknown>;

  const organizationId = typeof record.organizationId === "string" ? record.organizationId.trim() : "";
  if (!organizationId) {
    throw new Error("Missing organizationId in context");
  }

  const prisma = record.prisma as PrismaClient | undefined;
  if (!prisma) {
    throw new Error("Missing Prisma client in context");
  }

  const logger = record.logger as Logger | undefined;
  const userId = typeof record.userId === "string" && record.userId.trim().length ? record.userId : undefined;

  return {
    organizationId,
    prisma,
    logger,
    userId,
  };
}
