/**
 * Type exports for NeonHub SDK
 * Re-exports Prisma types and defines SDK-specific types
 */

// Re-export Prisma enums
export {
  AgentKind,
  AgentStatus,
  MessageRole,
  ConversationKind,
  DatasetKind,
  TrainStatus,
  ContentKind,
  CampaignStatus,
  ConnectorKind,
  MarketingCampaignType,
  MarketingCampaignStatus,
  MarketingLeadGrade,
  MarketingLeadStatus,
  MarketingTouchpointType,
} from '@prisma/client';

// Re-export Prisma types
export type {
  User,
  Organization,
  Brand,
  Agent,
  AgentRun,
  Content,
  ContentDraft,
  Campaign,
  CampaignMetric,
  MarketingCampaign,
  MarketingLead,
  MarketingTouchpoint,
  MarketingMetric,
  AgentJob,
  MetricEvent,
  BrandVoice,
  Persona,
  Keyword,
  EditorialCalendar,
  Conversation,
  Message,
  Dataset,
  Document,
  Task,
  Feedback,
  TeamMember,
  Subscription,
  Invoice,
} from '@prisma/client';

/**
 * SDK Client Configuration
 */
export interface NeonHubConfig {
  /** API base URL */
  baseURL: string;
  /** API key for authentication */
  apiKey?: string;
  /** Access token for authentication */
  accessToken?: string;
  /** Allow unauthenticated requests (for mocks/local development) */
  allowUnauthenticated?: boolean;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts */
  maxRetries?: number;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * HTTP request options
 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Agent execution input
 */
export interface AgentExecuteInput {
  agent: string;
  input: Record<string, unknown>;
  organizationId?: string;
}

/**
 * Agent execution result
 */
export interface AgentExecuteResult {
  id: string;
  agent: string;
  status: string;
  output?: unknown;
  error?: string;
  metrics?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Content generation input
 */
export interface ContentGenerateInput {
  topic: string;
  tone?: string;
  audience?: string;
  kind?: string;
  brandVoiceId?: string;
}

/**
 * Campaign creation input
 */
export interface CampaignCreateInput {
  name: string;
  type: string;
  organizationId: string;
  ownerId: string;
  config?: Record<string, unknown>;
  schedule?: Record<string, unknown>;
  budget?: Record<string, unknown>;
}

/**
 * Orchestration workflow input
 */
export interface OrchestrationInput {
  workflow: string;
  params: Record<string, unknown>;
  organizationId?: string;
}

/**
 * Orchestration result
 */
export interface OrchestrationResult {
  runId: string;
  workflow: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  steps: OrchestrationStep[];
  output?: unknown;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Orchestration step
 */
export interface OrchestrationStep {
  stepId: string;
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: unknown;
  output?: unknown;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Marketing metrics
 */
export interface MarketingMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
  leadsGenerated: number;
  leadsCost: number;
  ctr: number;
  conversionRate: number;
  roi: number;
  cpl: number;
}

/**
 * SEO keyword analysis
 */
export interface SEOKeywordAnalysis {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  opportunity: number;
  intent: string;
  relatedKeywords: string[];
}

/**
 * SEO content optimization
 */
export interface SEOContentOptimization {
  title: string;
  description: string;
  keywords: string[];
  readabilityScore: number;
  seoScore: number;
  recommendations: string[];
}

/**
 * List query parameters
 */
export interface ListParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filter?: Record<string, unknown>;
}

// Re-export agentic architecture types
export * from './types/agentic';
