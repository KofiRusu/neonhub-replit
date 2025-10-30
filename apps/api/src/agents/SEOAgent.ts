import { createHash } from "crypto";
import { z } from "zod";
import type { Keyword, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../db/prisma.js";
import {
  agentJobManager as defaultJobManager,
  type AgentJobInput,
} from "./base/AgentJobManager.js";
import { logger } from "../lib/logger.js";
import { validateAgentContext } from "./_shared/normalize.js";
import type { OrchestratorRequest, OrchestratorResponse } from "../services/orchestration/types.js";
import { executeAgentRun, type AgentExecutionContext } from "./utils/agent-run.js";

export type SearchIntent =
  | "informational"
  | "navigational"
  | "commercial"
  | "transactional";

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "for",
  "to",
  "and",
  "of",
  "with",
  "in",
  "on",
  "at",
  "by",
  "from",
  "best",
  "top",
  "guide",
  "how",
  "what",
]);

const TREND_VALUES = ["rising", "stable", "declining"] as const;

type Trend = (typeof TREND_VALUES)[number];
type KeywordSource = "seed" | "persona" | "generated";

interface CandidateKeyword {
  term: string;
  source: KeywordSource;
  personaPriority?: number | null;
  presetIntent?: SearchIntent | null;
}

export interface KeywordOpportunity {
  keyword: string;
  normalizedKeyword: string;
  source: KeywordSource;
  intent: SearchIntent;
  confidence: number;
  searchVolume: number;
  difficulty: number;
  opportunityScore: number;
  competitionScore: number;
  competitionLevel: "low" | "medium" | "high";
  backlinks: number;
  domainAuthority: number;
  trend: Trend;
  personaRelevance: number;
  insights: string[];
}

export interface KeywordCluster {
  key: string;
  label: string;
  headKeyword: string;
  aggregateOpportunity: number;
  averageDifficulty: number;
  totalSearchVolume: number;
  intentShare: Record<SearchIntent, number>;
  keywords: KeywordOpportunity[];
}

export interface DiscoverKeywordsInput {
  seeds: string[];
  personaId?: string | number;
  limit?: number;
  competitorDomains?: string[];
  createdById?: string;
}

export interface DiscoverKeywordsOutput {
  jobId: string;
  clusters: KeywordCluster[];
  summary: {
    totalKeywords: number;
    totalClusters: number;
    averageOpportunity: number;
    personaId?: number;
    computedAt: string;
    seedsAnalyzed: number;
  };
}

export interface AnalyzedIntent {
  keyword: string;
  intent: SearchIntent;
  confidence: number;
  reasons: string[];
}

export interface AnalyzeIntentInput {
  keywords: string[];
  personaId?: string | number;
}

export interface AnalyzeIntentOutput {
  intents: AnalyzedIntent[];
  summary: {
    distribution: Record<SearchIntent, number>;
    dominantIntent: SearchIntent;
    averageConfidence: number;
    personaId?: number;
    analyzedAt: string;
  };
}

export interface ScoreDifficultyInput {
  keyword: string;
  competitorDomains?: string[];
  backlinkCount?: number;
  domainAuthority?: number;
}

export interface ScoreDifficultyOutput {
  keyword: string;
  difficulty: number;
  tier: "easy" | "moderate" | "hard";
  components: {
    competition: number;
    backlinkProfile: number;
    domainAuthorityGap: number;
    serpVolatility: number;
    contentQuality: number;
  };
  recommendations: string[];
  context: {
    competitorDomains: string[];
    referencedBacklinks: number;
    domainAuthority: number;
    calculatedAt: string;
  };
}

export interface DiscoverOpportunitiesInput {
  personaId?: string | number;
  limit?: number;
  includeSeeds?: string[];
}

export interface DiscoverOpportunitiesOutput {
  opportunities: KeywordOpportunity[];
  summary: {
    personaId?: number;
    limit: number;
    dominantIntent: SearchIntent;
    averageOpportunity: number;
    generatedAt: string;
  };
}

export interface AgentDescriptor {
  id: string;
  name: string;
  capabilities: string[];
  config: {
    dataSources: string[];
    refreshInterval: string;
    defaultLimit: number;
  };
}

interface AgentJobManagerLike {
  createJob(input: AgentJobInput): Promise<string>;
  startJob(jobId: string): Promise<void>;
  completeJob(
    jobId: string,
    output: Record<string, unknown>,
    metrics?: Record<string, unknown>,
  ): Promise<void>;
  failJob(jobId: string, error: string): Promise<void>;
}

const DEFAULT_DESCRIPTOR: AgentDescriptor = {
  id: "seo",
  name: "SEO Strategy Agent",
  capabilities: [
    "keyword_discovery",
    "intent_analysis",
    "difficulty_scoring",
    "opportunity_ranking",
  ],
  config: {
    dataSources: ["prisma.keywords", "editorial_calendar"],
    refreshInterval: "weekly",
    defaultLimit: 40,
  },
};

const DiscoverKeywordsPayloadSchema = z
  .object({
    seeds: z.array(z.string().min(1, "seed keyword cannot be empty")).optional(),
    seed: z.string().min(1).optional(),
    topic: z.string().min(1).optional(),
    personaId: z.union([z.string(), z.number()]).optional(),
    limit: z.number().int().positive().max(100).optional(),
    competitorDomains: z.array(z.string().min(1)).optional(),
    createdById: z.string().optional(),
  })
  .refine(
    data => Boolean((data.seeds && data.seeds.length > 0) || data.seed || data.topic),
    { message: "At least one seed keyword is required." },
  );

const SeoAuditPayloadSchema = z
  .object({
    keyword: z.string().min(1).optional(),
    url: z.string().url().optional(),
    competitorDomains: z.array(z.string().min(1)).optional(),
    backlinkCount: z.number().int().nonnegative().optional(),
    domainAuthority: z.number().min(0).max(100).optional(),
    createdById: z.string().optional(),
  })
  .refine(data => Boolean(data.keyword || data.url), {
    message: "Provide either keyword or url.",
  });

type DiscoverKeywordsPayload = z.infer<typeof DiscoverKeywordsPayloadSchema>;
type SeoAuditPayload = z.infer<typeof SeoAuditPayloadSchema>;

/**
 * SEOAgent coordinates keyword discovery, intent analysis, and opportunity scoring.
 * The implementation is deterministic to remain test-friendly in offline environments.
 */
export class SEOAgent {
  private readonly prisma: PrismaClient;
  private readonly jobManager: AgentJobManagerLike;
  private readonly now: () => Date;
  private readonly agentName = "seo";
  private readonly orchestratorAgentId = "SEOAgent";
  private readonly descriptor = DEFAULT_DESCRIPTOR;

  constructor(deps: {
    prisma?: PrismaClient;
    jobManager?: AgentJobManagerLike;
    now?: () => Date;
  } = {}) {
    this.prisma = deps.prisma ?? defaultPrisma;
    this.jobManager = deps.jobManager ?? defaultJobManager;
    this.now = deps.now ?? (() => new Date());
  }

  /**
   * Discover and cluster keyword opportunities around a set of seed terms.
   */
  async discoverKeywords(
    input: DiscoverKeywordsInput,
  ): Promise<DiscoverKeywordsOutput> {
    const seeds = this.normalizeSeedList(input.seeds);

    if (seeds.length === 0) {
      throw new Error("At least one seed keyword is required.");
    }

    const personaId = this.coercePersonaId(input.personaId);
    const limit = this.normalizeLimit(input.limit);

    const jobId = await this.jobManager.createJob({
      agent: this.agentName,
      input: {
        seeds,
        personaId,
        limit,
        competitorDomains: input.competitorDomains ?? [],
      },
      createdById: input.createdById,
    });

    await this.jobManager.startJob(jobId);

    try {
      const personaKeywords = await this.fetchPersonaKeywords(personaId);
      const candidates = this.buildCandidateKeywords(seeds, personaKeywords);
      const enriched = candidates.map((candidate) =>
        this.enrichKeyword(candidate, personaId),
      );

      const ranked = enriched
        .sort((a, b) => b.opportunityScore - a.opportunityScore)
        .slice(0, limit);

      const clusters = this.buildClusters(ranked);
      const summary = this.buildDiscoverySummary(
        clusters,
        personaId,
        seeds.length,
      );

      await this.jobManager.completeJob(
        jobId,
        {
          clusters,
          summary,
        },
        {
          processedKeywords: ranked.length,
          totalClusters: clusters.length,
        },
      );

      return {
        jobId,
        clusters,
        summary,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown discovery error";
      await this.jobManager.failJob(jobId, message);
      logger.error(
        { error: message, seeds, personaId },
        "SEO keyword discovery failed",
      );
      throw error;
    }
  }

  /**
   * Classify search intent for a list of keywords.
   */
  async analyzeIntent(
    input: AnalyzeIntentInput,
  ): Promise<AnalyzeIntentOutput> {
    const keywords = this.normalizeSeedList(input.keywords);

    if (keywords.length === 0) {
      throw new Error("At least one keyword is required for analysis.");
    }

    const personaId = this.coercePersonaId(input.personaId);
    const personaKeywords = await this.fetchPersonaKeywords(personaId);
    const personaIntentMap = new Map<string, SearchIntent>();
    personaKeywords.forEach((keyword) => {
      const normalized = this.normalizeKeyword(keyword.term);
      const normalizedIntent = this.normalizeIntent(keyword.intent);
      if (normalizedIntent) {
        personaIntentMap.set(normalized, normalizedIntent);
      }
    });

    const intents = keywords.map((keyword) => {
      const presetIntent = personaIntentMap.get(this.normalizeKeyword(keyword));
      const classification = this.classifyIntent(keyword, presetIntent);
      return {
        keyword,
        intent: classification.intent,
        confidence: Number(
          Math.min(1, classification.confidence).toFixed(2),
        ),
        reasons: classification.reasons,
      };
    });

    const summary = this.buildIntentSummary(intents, personaId);

    return {
      intents,
      summary,
    };
  }

  /**
   * Score the ranking difficulty for a keyword using deterministic heuristics.
   */
  async scoreDifficulty(
    input: ScoreDifficultyInput,
  ): Promise<ScoreDifficultyOutput> {
    const keyword = input.keyword?.trim();
    if (!keyword) {
      throw new Error("Keyword is required for difficulty scoring.");
    }

    const normalized = this.normalizeKeyword(keyword);
    const baseHash = this.hash(normalized);

    const competition = this.computeCompetitionScore(
      baseHash,
      input.competitorDomains,
    );
    const backlinkProfile = this.computeBacklinkDifficulty(
      baseHash,
      input.backlinkCount,
    );
    const domainAuthorityGap = this.computeDomainAuthorityGap(
      baseHash,
      input.domainAuthority,
    );
    const serpVolatility = 30 + ((baseHash >> 8) % 45);
    const contentQuality = 50 + ((baseHash >> 14) % 45);

    const difficulty = Math.round(
      competition * 0.35 +
        backlinkProfile * 0.25 +
        domainAuthorityGap * 0.2 +
        serpVolatility * 0.1 +
        (100 - contentQuality) * 0.1,
    );

    const tier =
      difficulty < 35 ? "easy" : difficulty < 65 ? "moderate" : "hard";

    const recommendations = this.buildDifficultyRecommendations({
      competition,
      backlinkProfile,
      domainAuthorityGap,
      serpVolatility,
      contentQuality,
      tier,
    });

    return {
      keyword,
      difficulty: Math.min(100, Math.max(0, difficulty)),
      tier,
      components: {
        competition,
        backlinkProfile,
        domainAuthorityGap,
        serpVolatility,
        contentQuality,
      },
      recommendations,
      context: {
        competitorDomains: input.competitorDomains ?? [],
        referencedBacklinks:
          input.backlinkCount ?? Math.max(20, (baseHash >> 5) % 400),
        domainAuthority: input.domainAuthority ?? 45 + (baseHash % 30),
        calculatedAt: this.now().toISOString(),
      },
    };
  }

  /**
   * Rank existing keyword records to surface the best near-term opportunities.
   */
  async discoverOpportunities(
    input: DiscoverOpportunitiesInput = {},
  ): Promise<DiscoverOpportunitiesOutput> {
    const personaId = this.coercePersonaId(input.personaId);
    const limit = Math.max(1, Math.min(input.limit ?? 15, 50));

    const personaKeywords = await this.fetchPersonaKeywords(personaId);

    const opportunityPool = personaKeywords.map((keyword) =>
      this.enrichKeyword(
        {
          term: keyword.term,
          source: "persona",
          personaPriority: keyword.priority ?? undefined,
          presetIntent: this.normalizeIntent(keyword.intent),
        },
        personaId,
      ),
    );

    const seedCandidates =
      input.includeSeeds?.map((term) =>
        this.enrichKeyword(
          { term, source: "seed" },
          personaId,
        ),
      ) ?? [];

    const combined = [...opportunityPool, ...seedCandidates];

    const unique = this.deduplicateByKeyword(combined);
    const ranked = unique
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, limit);

    const summary = {
      personaId: personaId ?? undefined,
      limit,
      dominantIntent: this.computeDominantIntent(ranked),
      averageOpportunity: Number(
        (
          ranked.reduce((acc, item) => acc + item.opportunityScore, 0) /
          Math.max(1, ranked.length)
        ).toFixed(2),
      ),
      generatedAt: this.now().toISOString(),
    };

    return {
      opportunities: ranked,
      summary,
    };
  }

  /**
   * Return agent descriptor metadata for registration purposes.
   */
  getDescriptor(): AgentDescriptor {
    return this.descriptor;
  }

  private normalizeSeedList(list: string[]): string[] {
    return Array.from(
      new Set(
        (list ?? [])
          .map((value) => value?.trim().toLowerCase())
          .filter((value): value is string => Boolean(value)),
      ),
    );
  }

  private normalizeLimit(limit?: number): number {
    if (typeof limit !== "number" || Number.isNaN(limit)) {
      return DEFAULT_DESCRIPTOR.config.defaultLimit;
    }
    return Math.max(15, Math.min(Math.floor(limit), 100));
  }

  private coercePersonaId(
    personaId?: string | number,
  ): number | undefined {
    if (typeof personaId === "number" && Number.isFinite(personaId)) {
      return personaId;
    }
    if (typeof personaId === "string" && personaId.trim().length > 0) {
      const parsed = Number(personaId);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private async fetchPersonaKeywords(
    personaId?: number,
  ): Promise<Keyword[]> {
    try {
      return await this.prisma.keyword.findMany({
        where: personaId ? { personaId } : undefined,
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
        take: 200,
      });
    } catch (error) {
      logger.warn(
        { error, personaId },
        "Falling back to empty persona keyword list",
      );
      return [];
    }
  }

  private buildCandidateKeywords(
    seeds: string[],
    personaKeywords: Keyword[],
  ): CandidateKeyword[] {
    const candidates = new Map<string, CandidateKeyword>();

    personaKeywords.forEach((keyword) => {
      const normalized = this.normalizeKeyword(keyword.term);
      candidates.set(normalized, {
        term: keyword.term,
        source: "persona",
        personaPriority: keyword.priority ?? undefined,
        presetIntent: this.normalizeIntent(keyword.intent),
      });
    });

    seeds.forEach((seed) => {
      const normalized = this.normalizeKeyword(seed);
      if (!candidates.has(normalized)) {
        candidates.set(normalized, {
          term: seed,
          source: "seed",
        });
      }

      this.generateVariants(seed).forEach((variant) => {
        const normalizedVariant = this.normalizeKeyword(variant);
        if (!candidates.has(normalizedVariant)) {
          candidates.set(normalizedVariant, {
            term: variant,
            source: "generated",
          });
        }
      });
    });

    return Array.from(candidates.values());
  }

  private generateVariants(seed: string): string[] {
    const normalized = seed.trim();
    const baseWords = normalized.split(/\s+/);
    const head = baseWords[0] ?? normalized;
    return [
      `${normalized} strategy`,
      `${normalized} tools`,
      `${normalized} best practices`,
      `how to ${normalized}`,
      `${head} vs alternative`,
    ];
  }

  private enrichKeyword(
    candidate: CandidateKeyword,
    personaId?: number,
  ): KeywordOpportunity {
    const normalized = this.normalizeKeyword(candidate.term);
    const hash = this.hash(normalized);

    const classification = this.classifyIntent(
      candidate.term,
      candidate.presetIntent ?? undefined,
    );

    const searchVolume = 250 + (hash % 7500);
    const difficulty = 25 + ((hash >> 5) % 60);
    const competitionScore = 30 + ((hash >> 8) % 60);
    const competitionLevel =
      competitionScore < 45 ? "low" : competitionScore < 70 ? "medium" : "high";
    const backlinks = 40 + ((hash >> 10) % 500);
    const domainAuthority = 35 + ((hash >> 13) % 55);
    const personaRelevance =
      candidate.personaPriority != null
        ? this.normalizePersonaPriority(candidate.personaPriority)
        : 0.5 + ((hash >> 16) % 30) / 100;
    const opportunityScore = this.calculateOpportunityScore({
      searchVolume,
      difficulty,
      competitionScore,
      personaRelevance,
      trend: TREND_VALUES[hash % TREND_VALUES.length],
    });

    const insights = this.buildKeywordInsights({
      intent: classification.intent,
      trend: TREND_VALUES[hash % TREND_VALUES.length],
      opportunityScore,
      difficulty,
      personaRelevance,
    });

    return {
      keyword: this.formatKeyword(candidate.term),
      normalizedKeyword: normalized,
      source: candidate.source,
      intent: classification.intent,
      confidence: Number(
        Math.min(1, classification.confidence).toFixed(2),
      ),
      searchVolume,
      difficulty,
      opportunityScore,
      competitionScore,
      competitionLevel,
      backlinks,
      domainAuthority,
      trend: TREND_VALUES[hash % TREND_VALUES.length],
      personaRelevance: Number(personaRelevance.toFixed(2)),
      insights,
    };
  }

  private normalizePersonaPriority(priority: number): number {
    if (Number.isNaN(priority)) {
      return 0.5;
    }
    return Math.max(0, Math.min(1, priority / 100));
  }

  private normalizeKeyword(keyword: string): string {
    return keyword.trim().toLowerCase();
  }

  private formatKeyword(keyword: string): string {
    const lower = keyword.trim().toLowerCase();
    return lower.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private hash(value: string): number {
    return parseInt(createHash("sha256").update(value).digest("hex").slice(0, 8), 16);
  }

  private calculateOpportunityScore(input: {
    searchVolume: number;
    difficulty: number;
    competitionScore: number;
    personaRelevance: number;
    trend: Trend;
  }): number {
    const volumeScore = Math.min(1, input.searchVolume / 10000);
    const difficultyScore = 1 - input.difficulty / 100;
    const competitionScore = 1 - input.competitionScore / 100;
    const trendBoost =
      input.trend === "rising" ? 0.1 : input.trend === "declining" ? -0.05 : 0;

    const raw =
      volumeScore * 0.45 +
      difficultyScore * 0.25 +
      competitionScore * 0.15 +
      input.personaRelevance * 0.1 +
      trendBoost;

    return Math.round(Math.max(0, Math.min(1, raw)) * 100);
  }

  private classifyIntent(
    keyword: string,
    presetIntent?: SearchIntent,
  ): { intent: SearchIntent; confidence: number; reasons: string[] } {
    if (presetIntent) {
      return {
        intent: presetIntent,
        confidence: 0.92,
        reasons: ["Persona dataset"],
      };
    }

    const normalized = keyword.toLowerCase();
    const patterns: Array<{
      intent: SearchIntent;
      regex: RegExp;
      boost: number;
      reason: string;
    }> = [
      {
        intent: "transactional",
        regex: /\b(buy|purchase|pricing|order|subscribe|get)\b/,
        boost: 0.25,
        reason: "Transactional verb detected",
      },
      {
        intent: "commercial",
        regex: /\b(best|top|vs|review|compare|comparison)\b/,
        boost: 0.22,
        reason: "Comparison pattern",
      },
      {
        intent: "informational",
        regex: /\b(how|what|guide|tutorial|tips|strategy|ideas)\b/,
        boost: 0.2,
        reason: "Educational language",
      },
      {
        intent: "navigational",
        regex: /\b(login|dashboard|pricing page|contact|neonhub)\b/,
        boost: 0.18,
        reason: "Brand/navigation term",
      },
    ];

    let intent: SearchIntent = "informational";
    let confidence = 0.55;
    const reasons: string[] = [];

    for (const pattern of patterns) {
      if (pattern.regex.test(normalized)) {
        intent = pattern.intent;
        confidence += pattern.boost;
        reasons.push(pattern.reason);
      }
    }

    if (normalized.length <= 3) {
      intent = "navigational";
      confidence = 0.6;
      reasons.push("Short branded query heuristic");
    }

    return {
      intent,
      confidence,
      reasons: reasons.length > 0 ? reasons : ["Heuristic classification"],
    };
  }

  private normalizeIntent(
    intent?: string | null,
  ): SearchIntent | undefined {
    if (!intent) {
      return undefined;
    }

    const normalized = intent.toLowerCase();
    switch (normalized) {
      case "informational":
      case "info":
        return "informational";
      case "navigational":
      case "navigational-intent":
        return "navigational";
      case "commercial":
      case "commercial-investigation":
        return "commercial";
      case "transactional":
      case "trans":
        return "transactional";
      default:
        return undefined;
    }
  }

  private buildClusters(
    opportunities: KeywordOpportunity[],
  ): KeywordCluster[] {
    const clusterMap = new Map<string, KeywordOpportunity[]>();

    opportunities.forEach((opportunity) => {
      const key = this.extractClusterKey(opportunity.normalizedKeyword);
      const bucket = clusterMap.get(key) ?? [];
      bucket.push(opportunity);
      clusterMap.set(key, bucket);
    });

    return Array.from(clusterMap.entries())
      .map(([key, list]) => {
        const sorted = [...list].sort(
          (a, b) => b.opportunityScore - a.opportunityScore,
        );
        const head = sorted[0];
        const totalSearchVolume = sorted.reduce(
          (acc, item) => acc + item.searchVolume,
          0,
        );
        const averageDifficulty =
          sorted.reduce((acc, item) => acc + item.difficulty, 0) /
          Math.max(1, sorted.length);
        const aggregateOpportunity =
          sorted.reduce((acc, item) => acc + item.opportunityScore, 0) /
          Math.max(1, sorted.length);

        const intentShare: Record<SearchIntent, number> = {
          informational: 0,
          navigational: 0,
          commercial: 0,
          transactional: 0,
        };
        sorted.forEach((item) => {
          intentShare[item.intent] += 1;
        });

        return {
          key,
          label: this.toTitleCase(key),
          headKeyword: head.keyword,
          aggregateOpportunity: Number(aggregateOpportunity.toFixed(2)),
          averageDifficulty: Number(averageDifficulty.toFixed(2)),
          totalSearchVolume,
          intentShare,
          keywords: sorted,
        };
      })
      .sort((a, b) => b.aggregateOpportunity - a.aggregateOpportunity);
  }

  private extractClusterKey(keyword: string): string {
    const tokens = keyword
      .split(/\s+/)
      .map((token) => token.replace(/[^a-z0-9]/g, ""))
      .filter((token) => token && !STOP_WORDS.has(token));

    if (tokens.length === 0) {
      return keyword;
    }

    tokens.sort((a, b) => b.length - a.length);
    return tokens[0] ?? keyword;
  }

  private toTitleCase(value: string): string {
    return value.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private buildDiscoverySummary(
    clusters: KeywordCluster[],
    personaId: number | undefined,
    seedsAnalyzed: number,
  ): DiscoverKeywordsOutput["summary"] {
    const totalKeywords = clusters.reduce(
      (acc, cluster) => acc + cluster.keywords.length,
      0,
    );
    const averageOpportunity =
      clusters.reduce(
        (acc, cluster) => acc + cluster.aggregateOpportunity,
        0,
      ) / Math.max(1, clusters.length);

    return {
      totalKeywords,
      totalClusters: clusters.length,
      averageOpportunity: Number(averageOpportunity.toFixed(2)),
      personaId: personaId ?? undefined,
      computedAt: this.now().toISOString(),
      seedsAnalyzed,
    };
  }

  private buildIntentSummary(
    intents: AnalyzedIntent[],
    personaId?: number,
  ): AnalyzeIntentOutput["summary"] {
    const distribution: Record<SearchIntent, number> = {
      informational: 0,
      navigational: 0,
      commercial: 0,
      transactional: 0,
    };

    intents.forEach((intent) => {
      distribution[intent.intent] += 1;
    });

    const dominantIntent = (Object.entries(distribution).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0] ?? "informational") as SearchIntent;

    const averageConfidence =
      intents.reduce((acc, item) => acc + item.confidence, 0) /
      Math.max(1, intents.length);

    return {
      distribution,
      dominantIntent,
      averageConfidence: Number(averageConfidence.toFixed(2)),
      personaId: personaId ?? undefined,
      analyzedAt: this.now().toISOString(),
    };
  }

  private buildKeywordInsights(input: {
    intent: SearchIntent;
    trend: Trend;
    opportunityScore: number;
    difficulty: number;
    personaRelevance: number;
  }): string[] {
    const insights: string[] = [];

    if (input.opportunityScore > 75) {
      insights.push("High-priority gap with favorable demand-to-difficulty ratio.");
    }

    if (input.intent === "transactional") {
      insights.push("Conversion-ready traffic potential detected.");
    } else if (input.intent === "commercial") {
      insights.push("Strong commercial research signal; consider comparison content.");
    }

    if (input.trend === "rising") {
      insights.push("Trending upward; act before competition increases.");
    }

    if (input.personaRelevance > 0.7) {
      insights.push("Persona-aligned keyword supported by historical data.");
    }

    if (input.difficulty > 65) {
      insights.push("Expect medium-term effort to capture rankings.");
    }

    return insights;
  }

  private computeCompetitionScore(
    hash: number,
    competitorDomains?: string[],
  ): number {
    const base = 35 + (hash % 50);
    const competitorModifier = Math.min(
      30,
      (competitorDomains?.length ?? 0) * 6,
    );
    return Math.min(100, base + competitorModifier);
  }

  private computeBacklinkDifficulty(
    hash: number,
    backlinkCount?: number,
  ): number {
    if (backlinkCount != null) {
      return Math.min(100, 20 + Math.log10(Math.max(1, backlinkCount)) * 25);
    }
    return 25 + ((hash >> 6) % 60);
  }

  private computeDomainAuthorityGap(
    hash: number,
    domainAuthority?: number,
  ): number {
    if (domainAuthority != null) {
      return Math.max(0, 100 - Math.min(100, domainAuthority * 1.2));
    }
    return 30 + ((hash >> 4) % 50);
  }

  private buildDifficultyRecommendations(input: {
    competition: number;
    backlinkProfile: number;
    domainAuthorityGap: number;
    serpVolatility: number;
    contentQuality: number;
    tier: "easy" | "moderate" | "hard";
  }): string[] {
    const recommendations: string[] = [];

    if (input.tier === "easy") {
      recommendations.push("Publish optimized content within 2-3 weeks to capture momentum.");
    } else if (input.tier === "moderate") {
      recommendations.push(
        "Plan supporting content cluster and build 3-5 internal links post-publication.",
      );
    } else {
      recommendations.push(
        "Pair content production with targeted backlink outreach for authority lift.",
      );
    }

    if (input.domainAuthorityGap > 55) {
      recommendations.push(
        "Increase domain authority via digital PR or partner content syndication.",
      );
    }

    if (input.backlinkProfile > 60) {
      recommendations.push("Develop link-worthy assets (original data, calculators) for outreach.");
    }

    if (input.serpVolatility > 55) {
      recommendations.push("Monitor rankings weekly; SERP volatility indicates algorithmic churn.");
    }

    if (input.contentQuality > 70) {
      recommendations.push("Benchmark top results to exceed depth and freshness expectations.");
    }

    return recommendations;
  }

  private deduplicateByKeyword(
    opportunities: KeywordOpportunity[],
  ): KeywordOpportunity[] {
    const seen = new Map<string, KeywordOpportunity>();
    opportunities.forEach((item) => {
      if (!seen.has(item.normalizedKeyword)) {
        seen.set(item.normalizedKeyword, item);
      }
    });
    return Array.from(seen.values());
  }

  private computeDominantIntent(
    opportunities: KeywordOpportunity[],
  ): SearchIntent {
    if (opportunities.length === 0) {
      return "informational";
    }
    const tallies: Record<SearchIntent, number> = {
      informational: 0,
      navigational: 0,
      commercial: 0,
      transactional: 0,
    };
    opportunities.forEach((item) => {
      tallies[item.intent] += 1;
    });
    return (Object.entries(tallies).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "informational") as SearchIntent;
  }

  private withUserFallback<T extends { createdById?: string | undefined }>(
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

  private deriveKeywordFromUrl(rawUrl: string): string {
    try {
      const parsed = new URL(rawUrl);
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        const normalized = lastSegment.replace(/[-_]+/g, " ").trim();
        if (normalized.length > 0) {
          return normalized;
        }
      }
      const host = parsed.hostname.replace(/^www\./, "");
      return host.replace(/\./g, " ").trim() || "homepage";
    } catch {
      return rawUrl.replace(/https?:\/\//gi, "").replace(/[^a-z0-9]+/gi, " ").trim() || "homepage";
    }
  }

  private async handleKeywordResearchIntent(
    payload: unknown,
    context: AgentExecutionContext,
    intent: string,
  ): Promise<OrchestratorResponse> {
    let parsed: DiscoverKeywordsPayload;
    try {
      parsed = DiscoverKeywordsPayloadSchema.parse(payload);
    } catch (error) {
      return this.invalidInput(error);
    }

    const seeds = [
      ...(parsed.seeds ?? []),
      ...(parsed.seed ? [parsed.seed] : []),
      ...(parsed.topic ? [parsed.topic] : []),
    ]
      .map((seed) => seed.trim())
      .filter(Boolean);

    if (seeds.length === 0) {
      return this.invalidInput(new Error("At least one seed keyword is required."));
    }

    const input: DiscoverKeywordsInput = {
      seeds,
      personaId: parsed.personaId,
      limit: parsed.limit,
      competitorDomains: parsed.competitorDomains,
      createdById: parsed.createdById,
    };

    const resolvedInput = this.withUserFallback(input, context);

    try {
      const { result } = await executeAgentRun(
        this.orchestratorAgentId,
        context,
        resolvedInput,
        () => this.discoverKeywords(resolvedInput),
        {
          intent,
          buildMetrics: output => ({
            clusters: output.clusters.length,
            totalKeywords: output.summary.totalKeywords,
          }),
        },
      );

      return { ok: true, data: result };
    } catch (error) {
      return this.executionError(error);
    }
  }

  private async handleSeoAuditIntent(
    payload: unknown,
    context: AgentExecutionContext,
    intent: string,
  ): Promise<OrchestratorResponse> {
    let parsed: SeoAuditPayload;
    try {
      parsed = SeoAuditPayloadSchema.parse(payload);
    } catch (error) {
      return this.invalidInput(error);
    }

    const keywordSource = parsed.keyword?.trim() ?? "";
    const keyword =
      keywordSource.length > 0
        ? keywordSource
        : parsed.url
        ? this.deriveKeywordFromUrl(parsed.url)
        : "";

    if (!keyword) {
      return this.invalidInput(new Error("Unable to derive keyword for audit"));
    }

    const payloadWithUser = this.withUserFallback(
      {
        keyword,
        competitorDomains: parsed.competitorDomains,
        backlinkCount: parsed.backlinkCount,
        domainAuthority: parsed.domainAuthority,
        createdById: parsed.createdById,
      },
      context,
    );

    const scoreInput: ScoreDifficultyInput = {
      keyword: payloadWithUser.keyword,
      competitorDomains: payloadWithUser.competitorDomains,
      backlinkCount: payloadWithUser.backlinkCount,
      domainAuthority: payloadWithUser.domainAuthority,
    };

    try {
      const { result } = await executeAgentRun(
        this.orchestratorAgentId,
        context,
        payloadWithUser,
        () => this.scoreDifficulty(scoreInput),
        {
          intent,
          buildMetrics: output => ({
            difficulty: output.difficulty,
            tier: output.tier,
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
      case "keyword-research":
        return this.handleKeywordResearchIntent(request.payload, executionContext, request.intent);
      case "seo-audit":
        return this.handleSeoAuditIntent(request.payload, executionContext, request.intent);
      default:
        return {
          ok: false,
          error: `Unsupported intent: ${request.intent}`,
          code: "UNSUPPORTED_INTENT",
        };
    }
  }
}

export const seoAgent = new SEOAgent();
