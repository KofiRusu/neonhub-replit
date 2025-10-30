import { z } from "zod";
import { generateText as defaultGenerateText } from "../../ai/openai.js";
import { prisma as defaultPrisma } from "../../db/prisma.js";
import { agentJobManager as defaultJobManager } from "../base/AgentJobManager.js";
import { seoAgent as defaultSeoAgent, SEOAgent } from "../SEOAgent.js";
import {
  searchSimilarBrandVoice as defaultBrandVoiceSearch,
} from "../../services/brand-voice-ingestion.js";
import { InternalLinkingService } from "../../services/seo/internal-linking.service.js";
import { logger } from "../../lib/logger.js";
import { broadcast } from "../../ws/index.js";
import type { GenerateTextResult, GenerateTextOptions } from "../../ai/openai.js";
import type { AgentJobInput } from "../base/AgentJobManager.js";
import { validateAgentContext } from "../_shared/normalize.js";
import type { OrchestratorRequest, OrchestratorResponse } from "../../services/orchestration/types.js";
import { executeAgentRun, type AgentExecutionContext } from "../utils/agent-run.js";

type PrismaLike = typeof defaultPrisma;

interface JobManagerLike {
  createJob(input: AgentJobInput): Promise<string>;
  startJob(jobId: string): Promise<void>;
  completeJob(
    jobId: string,
    output: Record<string, unknown>,
    metrics?: Record<string, unknown>
  ): Promise<void>;
  failJob(jobId: string, error: string): Promise<void>;
}

type BrandVoiceSearch = typeof defaultBrandVoiceSearch;
type GenerateTextFn = (options: GenerateTextOptions) => Promise<GenerateTextResult>;

const OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_TONE = "professional";
const TITLE_MIN = 50;
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 150;
const DESCRIPTION_MAX = 160;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_CALLS = 6;

interface RateBucket {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private readonly buckets = new Map<string, RateBucket>();

  constructor(private readonly maxCalls: number, private readonly windowMs: number) {}

  consume(key: string): void {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }

    if (bucket.count >= this.maxCalls) {
      const waitMs = bucket.resetAt - now;
      throw new Error(
        `Rate limit exceeded. Try again in ${Math.ceil(waitMs / 1000)} seconds.`
      );
    }

    bucket.count += 1;
  }
}

interface BrandVoiceSnippet {
  summary: string;
  tone: string[];
  vocabulary: string[];
  doExamples: string[];
  dontExamples: string[];
  knowledgeBase: string[];
  brandName?: string;
  slogan?: string;
  website?: string | null;
}

interface KeywordInsight {
  keyword: string;
  intent: string;
  opportunity: number;
  difficulty: number;
  searchVolume: number;
}

interface StructuredArticle {
  title: string;
  summary: string;
  sections: Array<{ heading: string; body: string }>;
  conclusion: string;
  callToAction: string;
}

export interface MetaTags {
  title: string;
  description: string;
  canonicalUrl?: string;
  openGraph: {
    title: string;
    description: string;
    type: string;
  };
  twitter: {
    card: "summary_large_image" | "summary";
    title: string;
    description: string;
  };
}

interface SchemaMarkup {
  article: string;
  organization: string;
  breadcrumb: string;
}

interface KeywordDensity {
  keyword: string;
  occurrences: number;
  density: number;
}

interface ReadabilityStats {
  fleschEase: number;
  gradeBand: string;
  words: number;
  sentences: number;
  paragraphs: number;
  avgSentenceLength: number;
}

export interface QualityScore {
  readability: ReadabilityStats;
  keywordDensity: KeywordDensity[];
  overall: number;
}

export interface GenerateArticleInput {
  topic: string;
  primaryKeyword: string;
  personaId?: number | string;
  secondaryKeywords?: string[];
  outline?: string[];
  tone?: "professional" | "casual" | "friendly" | "authoritative";
  audience?: string;
  callToAction?: string;
  brandId?: string;
  brandVoiceId?: string;
  wordCount?: number;
  createdById: string;
}

export interface GenerateArticleOutput {
  jobId: string;
  draftId: string;
  title: string;
  summary: string;
  body: string;
  meta: MetaTags;
  schema: SchemaMarkup;
  keywordInsights: KeywordInsight[];
  quality: QualityScore;
  socialSnippets: SocialSnippetOutput;
}

export interface OptimizeArticleInput {
  draftId?: string;
  content: string;
  primaryKeyword: string;
  personaId?: number | string;
  brandId?: string;
  brandVoiceId?: string;
  callToAction?: string;
  createdById: string;
}

export interface OptimizeArticleOutput {
  jobId: string;
  revisedContent: string;
  notes: string[];
  quality: QualityScore;
}

export interface SocialSnippetInput {
  topic: string;
  primaryKeyword: string;
  brandId?: string;
  brandVoiceId?: string;
  tone?: "professional" | "casual" | "friendly" | "authoritative";
}

export interface SocialSnippetOutput {
  linkedin: string;
  twitter: string;
  emailSubject: string;
}

const RepurposeFormatSchema = z.enum(["linkedin", "twitter", "email", "outline"]);

const GenerateDraftPayloadSchema = z.object({
  topic: z.string().min(1, "topic is required"),
  primaryKeyword: z.string().min(1, "primaryKeyword is required"),
  personaId: z.union([z.string(), z.number()]).optional(),
  secondaryKeywords: z.array(z.string().min(1)).optional(),
  outline: z.array(z.string().min(1)).optional(),
  tone: z.enum(["professional", "casual", "friendly", "authoritative"]).optional(),
  audience: z.string().optional(),
  callToAction: z.string().optional(),
  brandId: z.string().optional(),
  brandVoiceId: z.string().optional(),
  wordCount: z.number().int().min(300).max(4000).optional(),
  createdById: z.string().optional(),
});

const SummarizePayloadSchema = z.object({
  content: z.string().min(1, "content is required"),
  sentences: z.number().int().min(1).max(6).optional(),
  highlights: z.number().int().min(1).max(6).optional(),
  createdById: z.string().optional(),
});

const RepurposePayloadSchema = z.object({
  content: z.string().min(1, "content is required"),
  format: RepurposeFormatSchema.default("linkedin"),
  topic: z.string().optional(),
  primaryKeyword: z.string().optional(),
  tone: z.string().optional(),
  brandId: z.string().optional(),
  brandVoiceId: z.string().optional(),
  createdById: z.string().optional(),
});

type GenerateDraftPayload = z.infer<typeof GenerateDraftPayloadSchema>;
type SummarizePayload = z.infer<typeof SummarizePayloadSchema>;
type RepurposePayload = z.infer<typeof RepurposePayloadSchema>;
type RepurposeFormat = z.infer<typeof RepurposeFormatSchema>;

interface SummarizeContentOutput {
  summary: string;
  highlights: string[];
  stats: {
    sentences: number;
    words: number;
    readingTimeMinutes: number;
  };
}

interface RepurposeContentOutput {
  format: RepurposeFormat;
  content: string;
  metadata: {
    topic: string;
    primaryKeyword: string;
    tone: string;
    estimatedLength: number;
  };
}

const rateLimiter = new RateLimiter(RATE_LIMIT_MAX_CALLS, RATE_LIMIT_WINDOW_MS);

function clampLength(text: string, min: number, max: number): string {
  if (text.length <= max) {
    return text.length >= min ? text : text.padEnd(min, ".");
  }
  const truncated = text.slice(0, max - 1);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : truncated.length)}…`;
}

function countSyllables(word: string): number {
  const sanitized = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!sanitized) return 0;
  const vowelGroups = sanitized.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(vowelGroups ? vowelGroups.length : 1, 1);
}

function computeReadability(text: string): ReadabilityStats {
  const sentences = text.split(/[.!?]+/).filter((part) => part.trim().length > 0);
  const words = text.split(/\s+/).filter((part) => part.trim().length > 0);
  const paragraphs = text.split(/\n{2,}/).filter((part) => part.trim().length > 0);
  const syllables = words.reduce((acc, word) => acc + countSyllables(word), 0);

  if (words.length === 0 || sentences.length === 0) {
    return {
      fleschEase: 100,
      gradeBand: "Very Easy",
      words: 0,
      sentences: 0,
      paragraphs: 0,
      avgSentenceLength: 0,
    };
  }

  const flesch =
    206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);

  const gradeBand =
    flesch >= 90
      ? "Very Easy"
      : flesch >= 80
      ? "Easy"
      : flesch >= 70
      ? "Fairly Easy"
      : flesch >= 60
      ? "Standard"
      : flesch >= 50
      ? "Fairly Difficult"
      : flesch >= 30
      ? "Difficult"
      : "Very Confusing";

  return {
    fleschEase: Math.max(0, Math.min(100, Number(flesch.toFixed(2)))),
    gradeBand,
    words: words.length,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
    avgSentenceLength: Number((words.length / sentences.length).toFixed(2)),
  };
}

function calculateKeywordDensity(content: string, keywords: string[]): KeywordDensity[] {
  const words = content
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.trim().length > 0);

  if (words.length === 0) {
    return keywords.map((keyword) => ({ keyword, occurrences: 0, density: 0 }));
  }

  return keywords.map((keyword) => {
    const normalized = keyword.toLowerCase();
    const regex = new RegExp(`\\b${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const matches = content.match(regex);
    const count = matches ? matches.length : 0;
    return {
      keyword,
      occurrences: count,
      density: Number(((count / words.length) * 100).toFixed(2)),
    };
  });
}

function computeQualityScore(content: string, keywords: string[]): QualityScore {
  const readability = computeReadability(content);
  const keywordDensity = calculateKeywordDensity(content, keywords);

  const densityScore =
    keywordDensity.reduce((acc, item) => acc + (item.density >= 0.5 && item.density <= 3 ? 1 : 0), 0) /
    Math.max(keywordDensity.length, 1);

  const readabilityScore =
    readability.fleschEase >= 55 && readability.fleschEase <= 80 ? 1 : Math.max(readability.fleschEase / 100, 0);

  const overall = Number(((readabilityScore * 0.6 + densityScore * 0.4) * 100).toFixed(2));

  return {
    readability,
    keywordDensity,
    overall,
  };
}

function stringifySchema(data: Record<string, unknown>): string {
  return JSON.stringify(data, null, 2);
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export class ContentAgent {
  private readonly prisma: PrismaLike;
  private readonly jobManager: JobManagerLike;
  private readonly seoAgent: SEOAgent;
  private readonly brandVoiceSearch: BrandVoiceSearch;
  private readonly generateText: GenerateTextFn;
  private readonly now: () => Date;
  private readonly orchestratorAgentId = "ContentAgent";
  private readonly contentStopWords = new Set<string>([
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "about",
    "into",
    "your",
    "you",
    "have",
    "will",
    "just",
    "more",
    "than",
    "then",
    "them",
    "they",
    "their",
    "what",
    "when",
    "where",
    "which",
    "while",
    "after",
    "before",
    "over",
    "under",
    "between",
    "across",
    "within",
    "without",
    "make",
    "made",
    "toward",
    "towards",
  ]);

  constructor(deps: {
    prisma?: PrismaLike;
    jobManager?: JobManagerLike;
    seoAgent?: SEOAgent;
    brandVoiceSearch?: BrandVoiceSearch;
    generateText?: GenerateTextFn;
    now?: () => Date;
  } = {}) {
    this.prisma = deps.prisma ?? defaultPrisma;
    this.jobManager = deps.jobManager ?? defaultJobManager;
    this.seoAgent = deps.seoAgent ?? defaultSeoAgent;
    this.brandVoiceSearch = deps.brandVoiceSearch ?? defaultBrandVoiceSearch;
    this.generateText = deps.generateText ?? defaultGenerateText;
    this.now = deps.now ?? (() => new Date());
  }

  /**
   * Generate a long-form article draft with SEO and brand alignment.
   */
  async generateArticle(input: GenerateArticleInput): Promise<GenerateArticleOutput> {
    if (!input.createdById) {
      throw new Error("createdById is required");
    }

    rateLimiter.consume(input.createdById);

    const jobId = await this.jobManager.createJob({
      agent: "content",
      input,
      createdById: input.createdById,
    });

    await this.jobManager.startJob(jobId);

    try {
      const [organizationId, brandVoice, keywordContext] = await Promise.all([
        this.resolveOrganizationId(input.createdById),
        this.buildBrandVoiceSnippet(input),
        this.collectKeywordInsights({
          primaryKeyword: input.primaryKeyword,
          personaId: input.personaId,
          secondaryKeywords: input.secondaryKeywords,
        }),
      ]);

      const structuredArticle = await this.requestArticleFromModel(input, brandVoice, keywordContext);
      let body = this.composeMarkdownBody(structuredArticle);

      // Internal linking integration
      try {
        const internalLinkingService = new InternalLinkingService(this.prisma);
        const contentSlug = structuredArticle.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        const linkSuggestions = await internalLinkingService.suggestLinks({
          currentPageUrl: `/content/${contentSlug}`,
          currentPageContent: body,
          targetKeyword: input.primaryKeyword,
          maxSuggestions: 5,
        });

        // Insert top 3-5 high-priority links into content
        const highPriorityLinks = linkSuggestions.filter(link => link.priority === 'high').slice(0, 3);
        const mediumPriorityLinks = linkSuggestions.filter(link => link.priority === 'medium').slice(0, 2);
        const linksToInsert = [...highPriorityLinks, ...mediumPriorityLinks].slice(0, 5);

        if (linksToInsert.length > 0) {
          body = this.insertLinksIntoContent(body, linksToInsert);
          logger.info({ linkCount: linksToInsert.length }, '[ContentAgent] Internal links inserted');
        }
      } catch (linkError) {
        logger.warn({ error: linkError }, '[ContentAgent] Internal linking failed, continuing without links');
        // Continue without links if linking fails
      }

      const meta = this.createMetaTags({
        title: structuredArticle.title,
        summary: structuredArticle.summary,
        primaryKeyword: input.primaryKeyword,
        brand: brandVoice.brandName,
        callToAction: structuredArticle.callToAction,
      });

      const schema = this.createSchemaMarkup({
        meta,
        brand: brandVoice.brandName,
        topic: input.topic,
        draftId: undefined,
      });

      const keywordsForScoring = [
        input.primaryKeyword,
        ...(input.secondaryKeywords ?? keywordContext.slice(1).map((item) => item.keyword)),
      ].filter((value, index, array) => array.indexOf(value) === index);

      const quality = computeQualityScore(body, keywordsForScoring);
      const socialSnippets = await this.generateSocialSnippets({
        topic: input.topic,
        primaryKeyword: input.primaryKeyword,
        brandId: input.brandId,
        brandVoiceId: input.brandVoiceId,
        tone: input.tone ?? DEFAULT_TONE,
      });

      const draft = await this.prisma.contentDraft.create({
        data: {
          title: structuredArticle.title,
          topic: input.topic,
          body,
          tone: input.tone ?? DEFAULT_TONE,
          audience: input.audience,
          status: "generated",
          createdById: input.createdById,
          organizationId: organizationId ?? null,
        },
      });

      const outputPayload = {
        draftId: draft.id,
        title: structuredArticle.title,
        summary: structuredArticle.summary,
        meta,
        schema,
        keywordInsights: keywordContext,
        quality,
        socialSnippets,
      };

      await this.jobManager.completeJob(
        jobId,
        outputPayload,
        {
          generatedAt: this.now().toISOString(),
          primaryKeyword: input.primaryKeyword,
          seoOpportunity: keywordContext[0]?.opportunity ?? 0,
        }
      );

      broadcast("metrics:delta", {
        type: "content_draft_created",
        increment: 1,
        timestamp: this.now(),
      });

      return {
        jobId,
        draftId: draft.id,
        title: structuredArticle.title,
        summary: structuredArticle.summary,
        body,
        meta,
        schema,
        keywordInsights: keywordContext,
        quality,
        socialSnippets,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await this.jobManager.failJob(jobId, message);
      logger.error({ jobId, error: message }, "Content generation failed");
      throw error;
    }
  }

  /**
   * Optimize existing content for SEO alignment.
   */
  async optimizeArticle(input: OptimizeArticleInput): Promise<OptimizeArticleOutput> {
    if (!input.createdById) {
      throw new Error("createdById is required");
    }

    rateLimiter.consume(input.createdById);

    const jobId = await this.jobManager.createJob({
      agent: "content",
      input,
      createdById: input.createdById,
    });

    await this.jobManager.startJob(jobId);

    try {
      const [brandVoice, keywordContext] = await Promise.all([
        this.buildBrandVoiceSnippet({
          topic: input.primaryKeyword,
          primaryKeyword: input.primaryKeyword,
          brandId: input.brandId,
          brandVoiceId: input.brandVoiceId,
          createdById: input.createdById,
        }),
        this.collectKeywordInsights({
          primaryKeyword: input.primaryKeyword,
          personaId: input.personaId,
        }),
      ]);

      const prompt = this.buildOptimizationPrompt(input, brandVoice, keywordContext);

      const response = await this.generateText({
        prompt,
        model: OPENAI_MODEL,
        temperature: 0.4,
        maxTokens: 1200,
        systemPrompt:
          "You are a senior SEO editor. Produce only JSON with fields {\"revision\":\"string\",\"notes\":[\"string\"]}.",
      });

      const parsed = this.parseOptimizationResponse(response.text, input.content);

      const quality = computeQualityScore(parsed.revision, [
        input.primaryKeyword,
        ...keywordContext.slice(1, 3).map((item) => item.keyword),
      ]);

      if (input.draftId) {
        await this.prisma.contentDraft.update({
          where: { id: input.draftId },
          data: { body: parsed.revision },
        });
      }

      await this.jobManager.completeJob(
        jobId,
        {
          revisedContent: parsed.revision,
          notes: parsed.notes,
          quality,
        },
        {
          optimizedAt: this.now().toISOString(),
          targetKeyword: input.primaryKeyword,
        }
      );

      return {
        jobId,
        revisedContent: parsed.revision,
        notes: parsed.notes,
        quality,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await this.jobManager.failJob(jobId, message);
      logger.error({ jobId, error: message }, "Content optimization failed");
      throw error;
    }
  }

  /**
   * Score content quality and keyword density without external calls.
   */
  scoreContent(content: string, keywords: string[]): QualityScore {
    return computeQualityScore(content, keywords);
  }

  /**
   * Generate OpenGraph, Twitter, and canonical meta tags.
   */
  generateMetaTagsForContent(content: string, primaryKeyword: string, titleHint?: string): MetaTags {
    const firstSentence = content.split(/[.!?]/).find((line) => line.trim().length > 0) ?? "";
    return this.createMetaTags({
      title: titleHint ?? firstSentence.trim(),
      summary: firstSentence.trim(),
      primaryKeyword,
    });
  }

  /**
   * Create social snippets aligned with generated content.
   */
  async generateSocialSnippets(input: SocialSnippetInput): Promise<SocialSnippetOutput> {
    const prompt = `Create platform-specific social copy based on the topic "${input.topic}" and keyword "${input.primaryKeyword}".

Return JSON:
{
  "linkedin": "long-form post",
  "twitter": "concise tweet",
  "emailSubject": "catchy subject line"
}

Constraints:
- Respect brand voice descriptors if provided.
- Include the primary keyword in at least one post.
- Focus on value-driven messaging.`;

    const response = await this.generateText({
      prompt,
      model: OPENAI_MODEL,
      temperature: 0.6,
      maxTokens: 500,
      systemPrompt: "You are a social media strategist. Respond with JSON only.",
    });

    const parsed = safeJsonParse(response.text) as Partial<SocialSnippetOutput> | null;

    return {
      linkedin: parsed?.linkedin ?? `Discover insights about ${input.primaryKeyword}.`,
      twitter: parsed?.twitter ?? `${input.primaryKeyword} matters now. #${input.primaryKeyword.replace(/\s+/g, "")}`,
      emailSubject: parsed?.emailSubject ?? `New insights on ${input.topic}`,
    };
  }

  /**
   * Schedule a generated draft for publication via editorial calendar entry.
   */
  async schedulePublication({
    draftId,
    publishAt,
    personaId,
    channel,
  }: {
    draftId: string;
    publishAt: Date;
    personaId?: number;
    channel: string;
  }): Promise<void> {
    const draft = await this.prisma.contentDraft.findUnique({
      where: { id: draftId },
      select: { title: true, topic: true, organizationId: true },
    });

    if (!draft) {
      throw new Error("Draft not found");
    }

    await this.prisma.editorialCalendar.create({
      data: {
        title: draft.title,
        publishAt,
        status: `scheduled:${channel}`,
        personaId: personaId ?? null,
        priority: 50,
      },
    });
  }

  private async resolveOrganizationId(userId: string): Promise<string | undefined> {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { userId },
      select: { organizationId: true },
    });
    return membership?.organizationId ?? undefined;
  }

  private async buildBrandVoiceSnippet(
    input: Partial<GenerateArticleInput>
  ): Promise<BrandVoiceSnippet> {
    if (!input.brandId && !input.brandVoiceId) {
      return {
        summary: "",
        tone: [],
        vocabulary: [],
        doExamples: [],
        dontExamples: [],
        knowledgeBase: [],
      };
    }

    const brandVoice = input.brandVoiceId
      ? await this.prisma.brandVoice.findUnique({
          where: { id: input.brandVoiceId },
          select: {
            id: true,
            promptTemplate: true,
            styleRulesJson: true,
            brand: {
              select: {
                id: true,
                name: true,
                slogan: true,
                metadata: true,
              },
            },
          },
        })
      : null;

    const brand = brandVoice?.brand
      ? brandVoice.brand
      : input.brandId
      ? await this.prisma.brand.findUnique({
          where: { id: input.brandId },
          select: { id: true, name: true, slogan: true, metadata: true },
        })
      : null;

    const searchResults =
      brand?.id && input.primaryKeyword
        ? await this.brandVoiceSearch({
            brandId: brand.id,
            query: input.primaryKeyword,
            limit: 5,
          })
        : [];

    const knowledgeBase = searchResults.map((item) => item.summary);

    return {
      summary: brandVoice?.promptTemplate ?? "",
      tone: this.jsonArray(brandVoice?.styleRulesJson, "tone"),
      vocabulary: this.jsonArray(brandVoice?.styleRulesJson, "vocabulary"),
      doExamples: this.jsonArray(brandVoice?.styleRulesJson, "doExamples"),
      dontExamples: this.jsonArray(brandVoice?.styleRulesJson, "dontExamples"),
      knowledgeBase,
      brandName: brand?.name ?? undefined,
      slogan: brand?.slogan ?? undefined,
      website: this.extractWebsite(brand?.metadata) ?? null,
    };
  }

  private extractWebsite(metadata: unknown): string | null {
    if (!metadata || typeof metadata !== "object") {
      return null;
    }
    const record = metadata as Record<string, unknown>;
    const website = record.website ?? record.url;
    return typeof website === "string" ? website : null;
  }

  private jsonArray(value: unknown, key: string): string[] {
    if (!value || typeof value !== "object") {
      return [];
    }
    const record = value as Record<string, unknown>;
    const raw = record[key];
    if (Array.isArray(raw)) {
      return raw.map((item) => String(item));
    }
    return [];
  }

  private async collectKeywordInsights(
    input: Pick<GenerateArticleInput, "primaryKeyword" | "personaId" | "secondaryKeywords">
  ): Promise<KeywordInsight[]> {
    try {
      const opportunities = await this.seoAgent.discoverOpportunities({
        personaId: input.personaId,
        limit: 6,
        includeSeeds: [input.primaryKeyword],
      });

      return opportunities.opportunities.slice(0, 6).map((item) => ({
        keyword: item.keyword,
        intent: item.intent,
        opportunity: item.opportunityScore,
        difficulty: item.difficulty,
        searchVolume: item.searchVolume,
      }));
    } catch (error) {
      logger.warn({ error }, "Falling back to synthetic keyword insights");
      return [
        {
          keyword: input.primaryKeyword,
          intent: "informational",
          opportunity: 72,
          difficulty: 38,
          searchVolume: 1200,
        },
        ...(input.secondaryKeywords ?? []).map((keyword, index) => ({
          keyword,
          intent: "commercial",
          opportunity: 55 - index * 5,
          difficulty: 45 + index * 4,
          searchVolume: 800 - index * 60,
        })),
      ];
    }
  }

  private async requestArticleFromModel(
    input: GenerateArticleInput,
    brand: BrandVoiceSnippet,
    keywordInsights: KeywordInsight[]
  ): Promise<StructuredArticle> {
    const prompt = this.buildArticlePrompt(input, brand, keywordInsights);

    const response = await this.generateText({
      prompt,
      model: OPENAI_MODEL,
      temperature: 0.55,
      maxTokens: 2200,
      systemPrompt:
        "You are an SEO strategist and senior copywriter. Respond ONLY with JSON matching {\"title\":\"\",\"summary\":\"\",\"sections\":[{\"heading\":\"\",\"body\":\"\"}],\"conclusion\":\"\",\"callToAction\":\"\"}.",
    });

    const parsed = safeJsonParse(response.text) as Partial<StructuredArticle> | null;

    if (
      parsed &&
      parsed.title &&
      parsed.summary &&
      Array.isArray(parsed.sections) &&
      parsed.sections.length > 0
    ) {
      return {
        title: parsed.title,
        summary: parsed.summary,
        sections: parsed.sections.map((section) => ({
          heading: section.heading ?? "Section",
          body: section.body ?? "",
        })),
        conclusion: parsed.conclusion ?? "",
        callToAction: parsed.callToAction ?? input.callToAction ?? "",
      };
    }

    logger.warn({ response: response.text.slice(0, 200) }, "Model response not in JSON format, falling back");

    const fallback = response.text.split(/\n#+\s/).filter((block) => block.trim().length > 0);
    const title = fallback.shift() ?? input.topic;
    const sections = fallback.map((block) => {
      const [headingLine, ...rest] = block.split("\n");
      return {
        heading: headingLine.trim(),
        body: rest.join("\n").trim(),
      };
    });

    return {
      title: title.replace(/^#\s*/, "").trim(),
      summary: sections[0]?.body.slice(0, 200) ?? input.topic,
      sections: sections.length > 0 ? sections : [{ heading: input.topic, body: response.text.trim() }],
      conclusion: sections.at(-1)?.body ?? "",
      callToAction: input.callToAction ?? "",
    };
  }

  private buildArticlePrompt(
    input: GenerateArticleInput,
    brand: BrandVoiceSnippet,
    keywordInsights: KeywordInsight[]
  ): string {
    const outline = input.outline?.length
      ? input.outline.map((item, index) => `${index + 1}. ${item}`).join("\n")
      : "1. Hook\n2. Problem Context\n3. Strategic Recommendations\n4. Implementation Guidance\n5. Closing Takeaways";

    const tone = input.tone ?? DEFAULT_TONE;

    const keywordBlock = keywordInsights
      .map(
        (item, index) =>
          `${index === 0 ? "Primary" : "Secondary"} Keyword: "${item.keyword}" — intent ${item.intent}, opportunity ${item.opportunity}/100`
      )
      .join("\n");

    const brandDirectives = [
      brand.brandName ? `Brand: ${brand.brandName}` : null,
      brand.slogan ? `Brand Promise: ${brand.slogan}` : null,
      brand.tone.length ? `Tone Descriptors: ${brand.tone.join(", ")}` : null,
      brand.vocabulary.length ? `Preferred Vocabulary: ${brand.vocabulary.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const knowledgeBase = brand.knowledgeBase.length
      ? `Brand Voice Excerpts:\n${brand.knowledgeBase.map((item) => `- ${item}`).join("\n")}`
      : "";

    return `Create an SEO-optimized article as JSON for the topic "${input.topic}" targeting "${input.primaryKeyword}".

Tone: ${tone}
Audience: ${input.audience ?? "Marketing decision makers"}
Desired Word Count: ${input.wordCount ?? 900}

${brandDirectives}

${knowledgeBase}

SEO Keywords:
${keywordBlock}

Outline:
${outline}

Include:
- A compelling title (<= 60 characters)
- A 2-3 sentence summary aligned with the keyword
- 4-6 sections with actionable insights and subheadings
- References to data or trends where relevant (fabricate respectfully if unavailable)
- A conclusion and CTA: ${input.callToAction ?? "Invite readers to explore NeonHub solutions."}
- Incorporate the primary keyword in title, summary, first section, and conclusion
- Maintain factual tone and avoid unsupported product claims.`;
  }

  private buildOptimizationPrompt(
    input: OptimizeArticleInput,
    brand: BrandVoiceSnippet,
    keywordContext: KeywordInsight[]
  ): string {
    const keywordBlock = keywordContext
      .map((item) => `- ${item.keyword} (${item.intent}, opportunity ${item.opportunity})`)
      .join("\n");

    return `Revise the following Markdown content to improve SEO performance for the keyword "${input.primaryKeyword}".

Brand Voice:
- Name: ${brand.brandName ?? "Generic"}
- Tone: ${brand.tone.join(", ") || "Professional"}
- Preferred Vocabulary: ${brand.vocabulary.join(", ") || "N/A"}

SEO Keywords:
${keywordBlock}

Call To Action: ${input.callToAction ?? "Encourage readers to engage with NeonHub."}

Original Content:
${input.content}

Improve keyword placement, clarity, and readability. Return JSON with keys "revision" and "notes".`;
  }

  private parseOptimizationResponse(
    response: string,
    fallbackContent: string
  ): { revision: string; notes: string[] } {
    const parsed = safeJsonParse(response) as { revision?: string; notes?: string[] } | null;

    if (parsed?.revision) {
      return {
        revision: parsed.revision,
        notes: Array.isArray(parsed.notes) ? parsed.notes.map((note) => String(note)) : [],
      };
    }

    return {
      revision: fallbackContent,
      notes: ["Model response could not be parsed; original content retained."],
    };
  }

  private composeMarkdownBody(article: StructuredArticle): string {
    const sections = article.sections
      .map((section) => `## ${section.heading}\n\n${section.body.trim()}`)
      .join("\n\n");

    const conclusion = article.conclusion ? `\n\n## Conclusion\n\n${article.conclusion.trim()}` : "";
    const cta = article.callToAction ? `\n\n**Call to Action:** ${article.callToAction.trim()}` : "";

    return `# ${article.title}\n\n${article.summary}\n\n${sections}${conclusion}${cta}`.trim();
  }

  private createMetaTags({
    title,
    summary,
    primaryKeyword,
    brand,
    callToAction,
  }: {
    title: string;
    summary: string;
    primaryKeyword: string;
    brand?: string;
    callToAction?: string;
  }): MetaTags {
    const normalizedTitle = clampLength(
      title.includes(primaryKeyword) ? title : `${primaryKeyword} | ${title}`,
      TITLE_MIN,
      TITLE_MAX
    );

    const descriptionSource =
      summary ||
      callToAction ||
      `Discover how ${primaryKeyword} drives outcomes for ${brand ?? "modern teams"}.`;

    const description = clampLength(descriptionSource, DESCRIPTION_MIN, DESCRIPTION_MAX);

    const ogTitle = `${normalizedTitle}${brand ? ` • ${brand}` : ""}`;

    return {
      title: normalizedTitle,
      description,
      canonicalUrl: undefined,
      openGraph: {
        title: ogTitle,
        description,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: normalizedTitle,
        description,
      },
    };
  }

  private createSchemaMarkup({
    meta,
    brand,
    topic,
    draftId,
  }: {
    meta: MetaTags;
    brand?: string;
    topic: string;
    draftId?: string;
  }): SchemaMarkup {
    const now = this.now().toISOString();
    const articleSchema = stringifySchema({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: meta.title,
      description: meta.description,
      datePublished: now,
      dateModified: now,
      author: {
        "@type": "Organization",
        name: brand ?? "NeonHub",
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://neonhub.example/articles/${draftId ?? "draft"}`,
      },
    });

    const organizationSchema = stringifySchema({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: brand ?? "NeonHub",
      url: "https://neonhub.example",
    });

    const breadcrumbSchema = stringifySchema({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://neonhub.example",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "SEO",
          item: "https://neonhub.example/seo",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: topic,
          item: `https://neonhub.example/seo/${encodeURIComponent(topic.toLowerCase())}`,
        },
      ],
    });

    return {
      article: articleSchema,
      organization: organizationSchema,
      breadcrumb: breadcrumbSchema,
    };
  }

  /**
   * Insert internal links into markdown content at optimal positions
   * @private
   */
  private insertLinksIntoContent(
    markdownBody: string,
    linkSuggestions: Array<{
      targetUrl: string;
      targetTitle: string;
      anchorText: string;
      position?: { paragraph: number; sentence?: number };
    }>
  ): string {
    const paragraphs = markdownBody.split('\n\n');
    let insertedCount = 0;

    for (const link of linkSuggestions) {
      const linkMarkdown = `[${link.anchorText}](${link.targetUrl} "${link.targetTitle}")`;

      // Try to insert at specified position
      if (link.position && link.position.paragraph < paragraphs.length) {
        const targetParagraph = paragraphs[link.position.paragraph];
        
        // Replace first occurrence of anchor text with link
        if (targetParagraph.toLowerCase().includes(link.anchorText.toLowerCase())) {
          const regex = new RegExp(`\\b${link.anchorText}\\b`, 'i');
          paragraphs[link.position.paragraph] = targetParagraph.replace(regex, linkMarkdown);
          insertedCount++;
        } else {
          // Append to end of paragraph if exact match not found
          paragraphs[link.position.paragraph] = `${targetParagraph} ${linkMarkdown}`;
          insertedCount++;
        }
      } else {
        // No position specified or invalid — append as "Related" link at end
        const relatedSection = paragraphs[paragraphs.length - 1];
        if (relatedSection?.startsWith('**Related:**')) {
          paragraphs[paragraphs.length - 1] = `${relatedSection}, ${linkMarkdown}`;
        } else {
          paragraphs.push(`\n**Related:** ${linkMarkdown}`);
        }
        insertedCount++;
      }
    }

    logger.debug({ insertedCount }, '[ContentAgent] Inserted internal links');
    return paragraphs.join('\n\n');
  }

  private buildSummary(input: SummarizePayload): SummarizeContentOutput {
    const sentences = this.extractSentences(input.content);
    const desiredSentences = Math.max(
      1,
      Math.min(input.sentences ?? 3, sentences.length || 1),
    );
    const summarySentences = sentences.slice(0, desiredSentences);
    const summaryText = summarySentences.join(" ").trim();

    const highlights = this.buildHighlightSentences(
      sentences,
      input.highlights ?? Math.min(3, sentences.length || 1),
    );

    const wordCount = input.content.split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Number((wordCount / 200).toFixed(2));

    return {
      summary: summaryText,
      highlights,
      stats: {
        sentences: summarySentences.length,
        words: wordCount,
        readingTimeMinutes,
      },
    };
  }

  private extractSentences(content: string): string[] {
    return (content.match(/[^.!?]+[.!?]?/g) ?? [content])
      .map((sentence) => sentence.trim())
      .filter(Boolean);
  }

  private buildHighlightSentences(sentences: string[], limit: number): string[] {
    if (sentences.length === 0 || limit <= 0) {
      return [];
    }

    const scored = sentences.map((sentence, index) => ({
      index,
      sentence: sentence.replace(/\s+/g, " ").trim(),
      score: sentence.length,
    }));

    scored.sort((a, b) => b.score - a.score || a.index - b.index);
    const selected = scored.slice(0, Math.min(limit, scored.length));
    selected.sort((a, b) => a.index - b.index);

    return selected.map((item) => item.sentence);
  }

  private deriveTopicFromContent(content: string): string {
    const sentences = this.extractSentences(content);
    if (sentences.length > 0) {
      const words = sentences[0].split(/\s+/).filter(Boolean);
      return words.slice(0, 12).join(" ") || "Content insight";
    }
    const fallbackWords = content.split(/\s+/).filter(Boolean);
    return fallbackWords.slice(0, 8).join(" ") || "Content insight";
  }

  private deriveKeywordFromContent(content: string): string {
    const tokens = content.toLowerCase().match(/\b[a-z0-9]{4,}\b/g) ?? [];
    const tally = new Map<string, number>();

    tokens.forEach((token) => {
      if (!this.contentStopWords.has(token)) {
        tally.set(token, (tally.get(token) ?? 0) + 1);
      }
    });

    if (tally.size === 0) {
      return tokens[0] ?? "insights";
    }

    const [top] = Array.from(tally.entries()).sort((a, b) => b[1] - a[1]);
    return top?.[0] ?? "insights";
  }

  private buildOutlineFromContent(content: string): string {
    const paragraphs = content
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    if (paragraphs.length === 0) {
      return ["1. Introduction", "2. Key Insight", "3. Next Steps"].join("\n");
    }

    return paragraphs
      .slice(0, 5)
      .map((paragraph, index) => {
        const sentence = this.extractSentences(paragraph)[0] ?? paragraph;
        const words = sentence.split(/\s+/).filter(Boolean);
        const heading = words.slice(0, 10).join(" ");
        return `${index + 1}. ${heading}`;
      })
      .join("\n");
  }

  private truncateTweet(text: string): string {
    const limit = 260;
    if (text.length <= limit) {
      return text;
    }
    return `${text.slice(0, limit - 3).trimEnd()}...`;
  }

  private async repurposeContent(input: RepurposePayload): Promise<RepurposeContentOutput> {
    const format = input.format;
    const topic = input.topic?.trim() || this.deriveTopicFromContent(input.content);
    const primaryKeyword =
      input.primaryKeyword?.trim() || this.deriveKeywordFromContent(input.content);
    const requestedTone = input.tone?.trim().toLowerCase() ?? DEFAULT_TONE;
    const allowedTones = new Set(["professional", "casual", "friendly", "authoritative"]);
    const tone = allowedTones.has(requestedTone)
      ? (requestedTone as GenerateArticleInput["tone"])
      : DEFAULT_TONE;

    const snippets = await this.generateSocialSnippets({
      topic,
      primaryKeyword,
      brandId: input.brandId,
      brandVoiceId: input.brandVoiceId,
      tone,
    });

    const summary = this.buildSummary({
      content: input.content,
      sentences: 2,
      highlights: 3,
    });

    let repurposed: string;
    switch (format) {
      case "twitter":
        repurposed = this.truncateTweet(snippets.twitter);
        break;
      case "email":
        repurposed = `Subject: ${snippets.emailSubject}\n\n${summary.summary}`;
        break;
      case "outline":
        repurposed = this.buildOutlineFromContent(input.content);
        break;
      case "linkedin":
      default:
        repurposed = snippets.linkedin;
        break;
    }

    return {
      format,
      content: repurposed.trim(),
      metadata: {
        topic,
        primaryKeyword,
        tone,
        estimatedLength: repurposed.length,
      },
    };
  }

  private attachUser<T extends { createdById?: string | undefined }>(
    input: T,
    context: AgentExecutionContext,
  ): T {
    if (input.createdById || !context.userId) {
      return input;
    }

    return {
      ...input,
      createdById: context.userId ?? undefined,
    } as T;
  }

  private resolveExecutionContext(context: unknown): AgentExecutionContext {
    const validated = validateAgentContext(context);
    return {
      organizationId: validated.organizationId,
      prisma: validated.prisma,
      logger: validated.logger,
      userId: validated.userId ?? null,
    };
  }

  private invalidInput(error: unknown): OrchestratorResponse {
    const message = error instanceof Error ? error.message : "Invalid input";
    return { ok: false, error: message, code: "INVALID_INPUT" };
  }

  private executionError(error: unknown): OrchestratorResponse {
    const message = error instanceof Error ? error.message : "Agent execution failed";
    return { ok: false, error: message, code: "AGENT_EXECUTION_FAILED" };
  }

  private async handleGenerateDraftIntent(
    payload: unknown,
    context: AgentExecutionContext,
    intent: string,
  ): Promise<OrchestratorResponse> {
    let parsed: GenerateDraftPayload;
    try {
      parsed = GenerateDraftPayloadSchema.parse(payload);
    } catch (error) {
      return this.invalidInput(error);
    }

    const augmented = this.attachUser(parsed, context);
    if (!augmented.createdById) {
      return this.invalidInput(new Error("createdById is required for draft generation"));
    }

    const generateInput: GenerateArticleInput = {
      topic: augmented.topic,
      primaryKeyword: augmented.primaryKeyword,
      personaId: augmented.personaId,
      secondaryKeywords: augmented.secondaryKeywords,
      outline: augmented.outline,
      tone: augmented.tone ?? DEFAULT_TONE,
      audience: augmented.audience,
      callToAction: augmented.callToAction,
      brandId: augmented.brandId,
      brandVoiceId: augmented.brandVoiceId,
      wordCount: augmented.wordCount,
      createdById: augmented.createdById,
    };

    try {
      const { result } = await executeAgentRun(
        this.orchestratorAgentId,
        context,
        generateInput,
        () => this.generateArticle(generateInput),
        {
          intent,
          buildMetrics: (output) => ({
            draftId: output.draftId,
            wordCount: output.body.split(/\s+/).filter(Boolean).length,
            keywordInsights: output.keywordInsights.length,
          }),
        },
      );

      return { ok: true, data: result };
    } catch (error) {
      return this.executionError(error);
    }
  }

  private async handleSummarizeIntent(
    payload: unknown,
    context: AgentExecutionContext,
    intent: string,
  ): Promise<OrchestratorResponse> {
    let parsed: SummarizePayload;
    try {
      parsed = SummarizePayloadSchema.parse(payload);
    } catch (error) {
      return this.invalidInput(error);
    }

    const augmented = this.attachUser(parsed, context);
    const summary = this.buildSummary(augmented);

    try {
      const { result } = await executeAgentRun(
        this.orchestratorAgentId,
        context,
        augmented,
        async () => summary,
        {
          intent,
          buildMetrics: () => ({
            sentences: summary.stats.sentences,
            words: summary.stats.words,
          }),
        },
      );

      return { ok: true, data: result };
    } catch (error) {
      return this.executionError(error);
    }
  }

  private async handleRepurposeIntent(
    payload: unknown,
    context: AgentExecutionContext,
    intent: string,
  ): Promise<OrchestratorResponse> {
    let parsed: RepurposePayload;
    try {
      parsed = RepurposePayloadSchema.parse(payload);
    } catch (error) {
      return this.invalidInput(error);
    }

    const augmented = this.attachUser(parsed, context);

    try {
      const { result } = await executeAgentRun(
        this.orchestratorAgentId,
        context,
        augmented,
        () => this.repurposeContent(augmented),
        {
          intent,
          buildMetrics: (output) => ({
            format: output.format,
            length: output.content.length,
          }),
        },
      );

      return { ok: true, data: result };
    } catch (error) {
      return this.executionError(error);
    }
  }

  async handle(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    let executionContext: AgentExecutionContext;

    try {
      executionContext = this.resolveExecutionContext(request.context);
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid context",
        code: "INVALID_CONTEXT",
      };
    }

    switch (request.intent) {
      case "generate-draft":
        return this.handleGenerateDraftIntent(request.payload, executionContext, request.intent);
      case "summarize":
        return this.handleSummarizeIntent(request.payload, executionContext, request.intent);
      case "repurpose":
        return this.handleRepurposeIntent(request.payload, executionContext, request.intent);
      default:
        return {
          ok: false,
          error: `Unsupported intent: ${request.intent}`,
          code: "UNSUPPORTED_INTENT",
        };
    }
  }
}

export const contentAgent = new ContentAgent();
