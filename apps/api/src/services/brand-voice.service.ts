import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { openai, isOpenAIConfigured } from "../lib/openai.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";
import type {
  ComposeArgs,
  ComposeResult,
  GuardrailResult,
  PromptPack,
  StructuredPrompt,
} from "../types/agentic.js";
import { PersonService } from "./person.service.js";

const DEFAULT_VARIANT_COUNT = 2;
const FALLBACK_CHANNEL_LIMITS: Record<string, number> = {
  sms: 160,
  dm: 280,
  email: 1200,
  post: 500,
};

const FORBIDDEN_PATTERNS = [
  /{{\s*unsubscribe\s*}}/i,
  /http:\/\//i,
  /lorem ipsum/i,
  /\bBUY NOW\b/i,
  /\bFREE!!!\b/i,
];

const PII_REGEX = /\b\d{9,}\b/g;

type JsonRecord = Record<string, unknown>;

type PersonSummary = {
  displayName: string | null;
  primaryEmail: string | null;
  primaryHandle: string | null;
  primaryPhone: string | null;
};

function coerceString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length) {
    return value.trim();
  }
  return undefined;
}

function safeJsonParse<T>(payload: string): T | undefined {
  try {
    const trimmed = payload.trim();
    const withoutCodeFence = trimmed.startsWith("{") ? trimmed : trimmed.replace(/^```json|```$/g, "");
    return JSON.parse(withoutCodeFence) as T;
  } catch (error) {
    logger.warn({ error, payloadPreview: payload.slice(0, 200) }, "Failed to parse OpenAI response as JSON");
    return undefined;
  }
}

function truncateToLimit(text: string, channel: string): string {
  const limit = FALLBACK_CHANNEL_LIMITS[channel] ?? 500;
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 3)}...`;
}

function sanitizeChannelLength(body: string, channel: string): string {
  return truncateToLimit(body, channel);
}

function asJsonObject(value: Prisma.JsonValue | null | undefined): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as JsonRecord;
}

async function fetchPromptContext(brandId: string, channel: string) {
  const [brandVoice, snippets] = await Promise.all([
    prisma.brandVoice.findFirst({
      where: { brandId },
    }),
    prisma.snippetLibrary.findMany({
      where: {
        brandId,
        channel,
      },
      orderBy: [{ winRate: "desc" }, { usageCount: "desc" }],
      take: 3,
    }),
  ]);
  return { brandVoice, snippets };
}

function buildPrompt(
  args: ComposeArgs,
  structuredPrompt: StructuredPrompt | null,
  person: PersonSummary,
  memory: string,
  snippets: Prisma.SnippetLibraryGetPayload<{}>[],
  topics: { name: string; weight: number }[],
) {
  const personaLine = [
    person.displayName ? `Name: ${person.displayName}` : null,
    person.primaryEmail ? `Email: ${person.primaryEmail}` : null,
    person.primaryHandle ? `Handle: ${person.primaryHandle}` : null,
    person.primaryPhone ? `Phone: ${person.primaryPhone}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const topicLine = topics
    .slice(0, 5)
    .map((topic) => `${topic.name} (${topic.weight.toFixed(2)})`)
    .join(", ");

  const snippetLine = snippets
    .map((snippet, index) => `Snippet ${index + 1}: ${snippet.name} — ${truncateToLimit(snippet.content, args.channel)}`)
    .join("\n");

  const constraintsLine = args.constraints ? JSON.stringify(args.constraints, null, 2) : "{}";

  const guidance = structuredPrompt
    ? `${structuredPrompt.system}\nVoice: ${structuredPrompt.brandVoice.join(", ")}\nGuidelines: ${(structuredPrompt.guardrails ?? []).join(", ")}`
    : "Craft a message consistent with the brand's professional, optimistic tone.";

  const message = `Compose a ${args.channel} message for the objective "${args.objective}".
Person: ${personaLine || "Unknown"}
Topics: ${topicLine || "None"}
Memory Highlights: ${memory || "None"}
Constraints: ${constraintsLine}
Winning Snippets:\n${snippetLine || "(no snippets available)"}
Output JSON with keys subject (optional), body, variants (array of {subject?, body, cta?}), and cta.`;

  return [
    { role: "system", content: guidance },
    { role: "user", content: message },
  ];
}

function fallbackResponse(args: ComposeArgs, personName?: string | null): ComposeResult {
  const greeting = personName ? `Hi ${personName.split(" ")[0]},` : "Hi there,";
  const body = truncateToLimit(
    `${greeting}\n\nWe're focused on ${args.objective}. Here's a quick update tailored for you. Let me know if you'd like more details or a different direction.`,
    args.channel,
  );
  const subjectPrefix = personName ? `${personName.split(" ")[0]}, ` : "";
  const cta = args.channel === "email" ? "Reply to this email if you'd like to continue." : "Let me know what you think.";
  return {
    subject: args.channel === "email" ? `${subjectPrefix}quick update on ${args.objective}`.trim() : undefined,
    body,
    variants: [
      {
        subject: args.channel === "email" ? `Next steps for ${args.objective}` : undefined,
        body,
        cta,
        score: 0.5,
      },
    ],
    cta,
    metadata: { fallback: true },
  };
}

function applyGuardrails(text: string): GuardrailResult {
  const violations: string[] = [];
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      violations.push(`Contains forbidden pattern: ${pattern}`);
    }
  }

  const redacted = text.replace(PII_REGEX, "[REDACTED]");
  const safe = violations.length === 0 && redacted.length === text.length;
  return { safe, redacted: safe ? undefined : redacted, violations };
}

export const BrandVoiceService = {
  async compose(args: ComposeArgs): Promise<ComposeResult> {
    const person = await prisma.person.findUnique({
      where: { id: args.personId },
      include: {
        topics: {
          orderBy: { weight: "desc" },
          take: 5,
        },
      },
    });

    if (!person) {
      throw new Error(`Person not found for id ${args.personId}`);
    }

    const [{ brandVoice, snippets }, memoryRecords, objectives] = await Promise.all([
      fetchPromptContext(args.brandId, args.channel),
      PersonService.getMemory(args.personId, { limit: 5, includeVectors: false }),
      prisma.objective.findMany({
        where: { personId: args.personId, status: "active" },
        orderBy: { priority: "desc" },
        take: 3,
        select: { title: true },
      }),
    ]);

    const memorySummary = memoryRecords
      .map((record) => {
        const metadata = (record.metadata ?? {}) as JsonRecord;
        return coerceString(metadata.summary) ?? coerceString(record.label);
      })
      .filter(Boolean)
      .join(" | ");

    const styleRules = asJsonObject(brandVoice?.styleRulesJson);
    const promptPack = brandVoice
      ? {
          system: brandVoice.promptTemplate,
          brandVoice: Array.isArray(styleRules?.voice) ? (styleRules?.voice as string[]) : [brandVoice.promptTemplate.slice(0, 120)],
          guardrails: Array.isArray(styleRules?.guardrails) ? (styleRules?.guardrails as string[]) : undefined,
          examples: undefined,
          metadata: (brandVoice.metrics as JsonRecord | undefined) ?? undefined,
        }
      : null;

    const messages = buildPrompt(args, promptPack, person, memorySummary, snippets, person.topics);

    if (!isOpenAIConfigured) {
      logger.warn("OPENAI_API_KEY not set. Using fallback brand voice response.");
      return fallbackResponse(args, person.displayName);
    }

    try {
      const completion = await openai.chat.completions.create({
        model: env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.8,
        messages,
        max_tokens: args.channel === "email" ? 600 : 320,
      });
      const messageContent = completion.choices?.[0]?.message?.content;
      if (!messageContent) {
        return fallbackResponse(args, person.displayName);
      }

      const parsed = safeJsonParse<ComposeResult>(messageContent);
      if (parsed) {
        const sanitizedVariants = (parsed.variants ?? [])
          .slice(0, DEFAULT_VARIANT_COUNT)
          .map((variant) => ({
            subject: variant.subject,
            body: sanitizeChannelLength(variant.body, args.channel),
            cta: variant.cta,
            score: variant.score ?? 0.75,
          }));
        const primaryBody = sanitizeChannelLength(parsed.body, args.channel);
        return {
          subject: parsed.subject,
          body: primaryBody,
          variants:
            sanitizedVariants.length > 0
              ? sanitizedVariants
              : [
                  {
                    subject: parsed.subject,
                    body: primaryBody,
                    cta: parsed.cta,
                    score: 0.8,
                  },
                ],
          cta: parsed.cta,
          metadata: {
            completionId: completion.id,
            usage: completion.usage,
            objectives,
          },
        };
      }

      return fallbackResponse(args, person.displayName);
    } catch (error) {
      logger.error({ error }, "BrandVoiceService.compose failed. Falling back.");
      return fallbackResponse(args, person.displayName);
    }
  },

  async guardrail(text: string, channel: string, brandId: string): Promise<GuardrailResult> {
    const base = applyGuardrails(text);
    if (!base.safe) {
      return base;
    }

    const limit = FALLBACK_CHANNEL_LIMITS[channel] ?? 500;
    if (text.length > limit) {
      return {
        safe: false,
        redacted: truncateToLimit(text, channel),
        violations: [`Length exceeds limit for ${channel} (${limit} chars)`],
      };
    }

    const snippet = await prisma.snippetLibrary.findFirst({
      where: { brandId, channel },
      orderBy: { winRate: "desc" },
    });

    return {
      ...base,
      metadata: snippet
        ? {
            checkedAgainst: snippet.id,
            baselineWinRate: snippet.winRate,
          }
        : { checkedAgainst: null },
    };
  },

  async getPromptPack(useCase: string, brandId: string): Promise<PromptPack> {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        brandVoices: true,
      },
    });

    if (!brand) {
      throw new Error(`Brand not found for id ${brandId}`);
    }

    const voice = brand.brandVoices[0];
    const styleRules = asJsonObject(voice?.styleRulesJson);
    const metrics = asJsonObject((voice?.metrics as Prisma.JsonValue | undefined) ?? null);

    const prompt: StructuredPrompt = voice
      ? {
          system: voice.promptTemplate,
          brandVoice: Array.isArray(styleRules?.voice) ? (styleRules?.voice as string[]) : [voice.promptTemplate.slice(0, 120)],
          guardrails: Array.isArray(styleRules?.guardrails) ? (styleRules?.guardrails as string[]) : undefined,
          examples: Array.isArray(metrics?.examples)
            ? (metrics?.examples as StructuredPrompt["examples"])
            : undefined,
          metadata: metrics ?? undefined,
        }
      : {
          system: `You are the Brand Voice orchestrator for ${brand.name}. Maintain a consistent tone across channels.`,
          brandVoice: ["Confident", "Helpful", "Data-backed"],
          guardrails: ["Avoid overpromising", "Stay compliant with TCPA"],
        };

    return {
      useCase,
      brandId,
      prompt,
    };
  },
};
