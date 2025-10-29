/**
 * Brand Voice specific types
 * @module types/brand-voice
 */

// Import types from agentic module
import type { Channel, ObjectiveType } from "./agentic";

// ============================================================================
// BRAND VOICE CONFIGURATION
// ============================================================================

export interface BrandVoiceConfig {
  id: string;
  brandId: string;
  version: string;
  tone: ToneConfig;
  style: StyleConfig;
  vocabulary: VocabularyConfig;
  compliance: ComplianceConfig;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToneConfig {
  primary: ToneDimension[];
  avoid: string[];
  examples: string[];
  sliders: {
    formal: number; // 0-100
    playful: number;
    confident: number;
    empathetic: number;
    technical: number;
  };
}

export type ToneDimension =
  | "professional"
  | "casual"
  | "witty"
  | "empathetic"
  | "authoritative"
  | "friendly"
  | "technical"
  | "conversational"
  | "inspirational";

export interface StyleConfig {
  sentenceLength: "short" | "medium" | "long" | "varied";
  paragraphStructure: "single" | "multiple" | "scannable";
  punctuation: {
    useExclamation: boolean;
    useEmoji: boolean;
    useDashes: boolean;
    useEllipsis: boolean;
  };
  formatting: {
    useBold: boolean;
    useItalic: boolean;
    useBullets: boolean;
    useNumberedLists: boolean;
  };
}

export interface VocabularyConfig {
  preferred: string[]; // words/phrases to use
  forbidden: string[]; // words/phrases to avoid
  jargon: string[]; // industry terms OK to use
  replacements: Record<string, string>; // bad → good mappings
  glossary: Record<string, string>; // product/company terms
}

export interface ComplianceConfig {
  regulations: ("CAN-SPAM" | "GDPR" | "TCPA" | "CASL")[];
  disclaimers: Record<string, string>; // channel → disclaimer text
  requiredElements: {
    unsubscribeLink?: boolean;
    physicalAddress?: boolean;
    optOutLanguage?: boolean;
  };
  countryRules: Record<string, CountryRule>;
}

export interface CountryRule {
  country: string;
  quietHours: { start: string; end: string }; // "22:00", "08:00"
  maxMessagesPerDay?: number;
  consentRequired: boolean;
  additionalDisclosures?: string[];
}

// ============================================================================
// PROMPT ENGINEERING
// ============================================================================

export interface PromptTemplate {
  id: string;
  brandId: string;
  channel: Channel;
  objective: ObjectiveType;
  version: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: PromptVariable[];
  constraints: PromptConstraints;
  examples: PromptExample[];
  performance: PromptPerformance;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptVariable {
  name: string;
  type: "string" | "number" | "boolean" | "object";
  required: boolean;
  description: string;
  default?: any;
  examples?: any[];
}

export interface PromptConstraints {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

export interface PromptExample {
  input: Record<string, any>;
  output: string;
  reasoning?: string;
  quality: "excellent" | "good" | "acceptable" | "poor";
}

export interface PromptPerformance {
  usageCount: number;
  avgSentiment: number;
  conversionRate: number;
  openRate?: number;
  clickRate?: number;
  replyRate?: number;
  lastUsed?: Date;
}

// ============================================================================
// COMPOSITION
// ============================================================================

export interface CompositionRequest {
  brandId: string;
  channel: Channel;
  objective: ObjectiveType;
  personContext: PersonContext;
  constraints?: CompositionConstraints;
  draft?: string;
  variantsCount?: number;
}

export interface PersonContext {
  personId: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
  timezone?: string;
  topics: Array<{ name: string; weight: number }>;
  recentEvents: Array<{ type: string; ts: Date; payload: any }>;
  memory: Array<{ text: string; relevance: number }>;
  objectives: Array<{ type: string; status: string }>;
}

export interface CompositionConstraints {
  maxLength?: number;
  minLength?: number;
  tone?: ToneDimension;
  includeEmoji?: boolean;
  includeLink?: boolean;
  linkUrl?: string;
  ctaStyle?: "direct" | "soft" | "question" | "value";
  urgency?: "low" | "medium" | "high";
  personalization?: "high" | "medium" | "low";
  testMode?: boolean; // if true, don't log as production usage
}

export interface Composition {
  id: string;
  requestId: string;
  primary: ComposedMessage;
  variants: ComposedMessage[];
  reasoning: string;
  metadata: CompositionMetadata;
  createdAt: Date;
}

export interface ComposedMessage {
  subject?: string;
  preview?: string; // email preview text
  body: string;
  cta?: {
    text: string;
    url?: string;
    style: string;
  };
  ps?: string;
  attachments?: Array<{ name: string; url: string }>;
}

export interface CompositionMetadata {
  model: string;
  provider: "openai" | "anthropic" | "local";
  promptVersion: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  latencyMs: number;
  snippetsUsed: string[];
  personalizationScore: number; // 0-1
  brandAlignmentScore: number; // 0-1
  estimatedReadingTime?: number; // seconds
}

// ============================================================================
// GUARDRAILS
// ============================================================================

export interface GuardrailConfig {
  id: string;
  brandId: string;
  name: string;
  enabled: boolean;
  checks: GuardrailCheck[];
  actions: GuardrailAction[];
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuardrailCheck {
  type: GuardrailCheckType;
  config: Record<string, any>;
  severity: "block" | "warn" | "info";
  message?: string;
}

export type GuardrailCheckType =
  | "toxicity"
  | "pii"
  | "profanity"
  | "competitor_mention"
  | "forbidden_word"
  | "link_validation"
  | "length_check"
  | "readability"
  | "spam_score"
  | "brand_alignment"
  | "compliance"
  | "sentiment_check";

export interface GuardrailAction {
  when: "block" | "warn";
  action: "reject" | "redact" | "notify" | "log";
  config?: Record<string, any>;
}

export interface GuardrailResult {
  passed: boolean;
  violations: GuardrailViolation[];
  warnings: GuardrailWarning[];
  redactedText?: string;
  metadata: {
    checksRun: number;
    checksDuration: number;
    timestamp: Date;
  };
}

export interface GuardrailViolation {
  check: GuardrailCheckType;
  severity: "block" | "warn";
  message: string;
  location?: { start: number; end: number };
  suggestion?: string;
  metadata?: Record<string, any>;
}

export interface GuardrailWarning {
  check: GuardrailCheckType;
  message: string;
  location?: { start: number; end: number };
  suggestion?: string;
}

// ============================================================================
// SNIPPET LIBRARY
// ============================================================================

export interface Snippet {
  id: string;
  brandId: string;
  text: string;
  usage: SnippetUsage;
  context: SnippetContext;
  performance: SnippetPerformance;
  tags: string[];
  status: "active" | "testing" | "retired";
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SnippetUsage =
  | "subject"
  | "preview"
  | "opening"
  | "body"
  | "transition"
  | "cta"
  | "ps"
  | "closing"
  | "objection_handler";

export interface SnippetContext {
  channel: Channel[];
  objective: ObjectiveType[];
  tone: ToneDimension[];
  stage: ("cold" | "warm" | "hot" | "customer")[];
}

export interface SnippetPerformance {
  impressions: number;
  opens?: number;
  clicks?: number;
  replies?: number;
  conversions: number;
  winRate: number; // 0-1
  avgSentiment: number; // -1 to 1
  lastUsed?: Date;
  testStatus?: "control" | "variant_a" | "variant_b" | "winner";
}

export interface SnippetRecommendation {
  snippet: Snippet;
  relevanceScore: number;
  reason: string;
  usage: SnippetUsage;
}

// ============================================================================
// A/B TESTING
// ============================================================================

export interface VoiceExperiment {
  id: string;
  brandId: string;
  name: string;
  hypothesis: string;
  channel: Channel;
  objective: ObjectiveType;
  variants: VoiceVariant[];
  sampleSize: number;
  currentSample: number;
  status: "draft" | "running" | "paused" | "completed";
  winner?: string;
  startedAt?: Date;
  completedAt?: Date;
  results?: ExperimentResults;
}

export interface VoiceVariant {
  id: string;
  name: string;
  promptChanges?: Partial<PromptTemplate>;
  toneChanges?: Partial<ToneConfig>;
  styleChanges?: Partial<StyleConfig>;
  weight: number; // traffic allocation
}

export interface ExperimentResults {
  variants: Record<
    string,
    {
      impressions: number;
      conversions: number;
      conversionRate: number;
      avgSentiment: number;
      confidence: number; // statistical confidence
      lift?: number; // vs control
    }
  >;
  winner?: string;
  significance: number; // p-value
  recommendation: string;
}

// ============================================================================
// VOICE EMBEDDINGS
// ============================================================================

export interface VoiceEmbedding {
  id: string;
  brandId: string;
  text: string;
  vector: number[];
  kind: "example" | "guideline" | "anti_example";
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface VoiceMatch {
  text: string;
  similarity: number;
  kind: "example" | "guideline" | "anti_example";
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface VoiceAnalytics {
  brandId: string;
  period: { from: Date; to: Date };
  byChannel: Record<
    Channel,
    {
      messagesGenerated: number;
      avgBrandAlignment: number;
      avgSentiment: number;
      conversionRate: number;
      topPerformingSnippets: string[];
    }
  >;
  byObjective: Record<
    ObjectiveType,
    {
      messagesGenerated: number;
      conversionRate: number;
      avgResponseTime: number;
    }
  >;
  experiments: {
    active: number;
    completed: number;
    avgLift: number;
  };
  guardrails: {
    totalChecks: number;
    violations: number;
    warnings: number;
    topViolations: Array<{ type: string; count: number }>;
  };
}

