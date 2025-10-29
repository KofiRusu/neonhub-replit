/**
 * Agentic Architecture Types for SDK
 * These mirror the backend API contract
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum Channel {
  EMAIL = "email",
  SMS = "sms",
  INSTAGRAM = "instagram",
  FACEBOOK = "facebook",
  X = "x",
  REDDIT = "reddit",
  WHATSAPP = "whatsapp",
  TIKTOK = "tiktok",
  YOUTUBE = "youtube",
  LINKEDIN = "linkedin",
  SITE = "site",
}

export enum ConsentStatus {
  GRANTED = "granted",
  REVOKED = "revoked",
  PENDING = "pending",
  UNKNOWN = "unknown",
}

export enum ConsentScope {
  MARKETING = "marketing",
  TRANSACTIONAL = "transactional",
  BOTH = "both",
}

export enum IdentityType {
  EMAIL = "email",
  PHONE = "phone",
  INSTAGRAM = "instagram",
  FACEBOOK = "facebook",
  X = "x",
  REDDIT = "reddit",
  WHATSAPP = "whatsapp",
  TIKTOK = "tiktok",
  YOUTUBE = "youtube",
  LINKEDIN = "linkedin",
  SHOPIFY = "shopify",
  STRIPE = "stripe",
  GA4 = "ga4",
  CRM = "crm",
}

export enum MemoryKind {
  FACT = "fact",
  INTENT = "intent",
  MESSAGE = "message",
  DOCUMENT = "document",
  OBJECTION = "objection",
  PREFERENCE = "preference",
}

export enum ObjectiveType {
  NURTURE = "nurture",
  WINBACK = "winback",
  DEMO_BOOK = "demo_book",
  UPSELL = "upsell",
  CROSS_SELL = "cross_sell",
  ONBOARD = "onboard",
  SUPPORT = "support",
  EDUCATION = "education",
}

export enum EventType {
  EMAIL_SENT = "email.sent",
  EMAIL_DELIVERED = "email.delivered",
  EMAIL_OPENED = "email.opened",
  EMAIL_CLICKED = "email.clicked",
  EMAIL_REPLIED = "email.replied",
  EMAIL_BOUNCED = "email.bounced",
  SMS_SENT = "sms.sent",
  SMS_DELIVERED = "sms.delivered",
  SMS_REPLIED = "sms.replied",
  DM_SENT = "dm.sent",
  DM_DELIVERED = "dm.delivered",
  DM_READ = "dm.read",
  DM_REPLIED = "dm.replied",
  MEETING_BOOKED = "conversion.meeting.booked",
  PURCHASE = "conversion.purchase",
}

// ============================================================================
// PERSON GRAPH
// ============================================================================

export interface Person {
  id: string;
  workspaceId: string;
  organizationId?: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
  timezone?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Identity {
  id: string;
  personId: string;
  type: IdentityType;
  value: string;
  verified: boolean;
  isPrimary?: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Consent {
  id: string;
  personId: string;
  channel: Channel;
  scope: ConsentScope;
  status: ConsentStatus;
  source: string;
  grantedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
}

export interface Note {
  id: string;
  personId: string;
  content: string;
  authorId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Topic {
  id: string;
  personId: string;
  name: string;
  weight: number;
  category?: string;
  source: string;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Memory {
  id: string;
  kind: MemoryKind;
  text: string;
  confidence: number;
  relevance?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface PartialIdentity {
  email?: string;
  phone?: string;
  handle?: string;
  type?: IdentityType;
}

export interface PersonResolutionResult {
  person: Person;
  identities: Identity[];
  matchedOn: IdentityType[];
  confidence: number;
}

export interface ConsentUpdate {
  channel: Channel;
  scope: ConsentScope;
  status: ConsentStatus;
  source: string;
}

export interface MemoryOpts {
  kinds?: MemoryKind[];
  limit?: number;
  minConfidence?: number;
  query?: string;
}

// ============================================================================
// BRAND VOICE
// ============================================================================

export interface BrandVoiceComposerArgs {
  channel: Channel | string;
  objective: ObjectiveType | string;
  personId: string;
  brandId?: string;
  workspaceId?: string;
  context?: Record<string, any>;
  constraints?: {
    maxVariants?: number;
    maxChars?: number;
    tone?: string;
    readingLevel?: string;
    includeEmoji?: boolean;
    includeLink?: boolean;
  };
  draft?: string;
}

export interface ComposerResultMeta {
  model?: string;
  source?: string;
  tokensUsed?: number;
  latencyMs?: number;
  guardrails?: Array<{
    name: string;
    status: "passed" | "flagged";
    details?: string;
  }>;
  [key: string]: any;
}

export interface ComposerResult {
  subjectLines: string[];
  htmlVariants: string[];
  textVariants?: string[];
  body: string;
  meta: ComposerResultMeta;
}

export interface GuardrailCheck {
  safe: boolean;
  violations: string[];
  redacted?: string;
  details?: {
    toxicity?: number;
    piiDetected?: string[];
    complianceIssues?: string[];
  };
}

export interface PromptPack {
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  examples?: Array<{
    input: Record<string, any>;
    output: string;
  }>;
  constraints: Record<string, any>;
}

export interface SnippetLibrary {
  id: string;
  brandId: string;
  channel: Channel;
  objective: ObjectiveType;
  snippet: string;
  usage: "subject" | "opening" | "body" | "cta" | "ps";
  winRate: number;
  impressions: number;
  conversions: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SnippetFilters {
  brandId: string;
  channel?: Channel;
  objective?: ObjectiveType;
  usage?: string;
  minWinRate?: number;
  limit?: number;
}

// ============================================================================
// SENDING
// ============================================================================

export interface EmailSendArgs {
  to?: string;
  personId?: string;
  subject?: string;
  body: string;
  html?: string;
  brandId?: string;
  objective?: ObjectiveType | string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  utmParams?: Record<string, string>;
  scheduleFor?: Date;
  sendAt?: Date;
  metadata?: Record<string, any>;
}

export interface SMSSendArgs {
  to?: string;
  personId?: string;
  body: string;
  brandId?: string;
  objective?: ObjectiveType | string;
  fromNumber?: string;
  scheduleFor?: Date;
  sendAt?: Date;
  metadata?: Record<string, any>;
}

export interface DMSendArgs {
  to?: string;
  personId?: string;
  brandId?: string;
  platform: Channel | string;
  body: string;
  objective?: ObjectiveType | string;
  threadId?: string;
  scheduleFor?: Date;
  sendAt?: Date;
  metadata?: Record<string, any>;
}

export interface SendResult {
  id: string;
  status: "queued" | "sent" | "delivered" | "failed";
  personId?: string;
  channel: Channel | string;
  externalId?: string;
  error?: string;
  metadata?: Record<string, any>;
  sentAt?: Date;
  queuedAt?: Date;
}

export interface SendStatus {
  id: string;
  status: "queued" | "sent" | "delivered" | "opened" | "clicked" | "replied" | "failed";
  events: Event[];
  lastUpdated: Date;
}

// ============================================================================
// EVENTS
// ============================================================================

export interface Event {
  id: string;
  workspaceId: string;
  organizationId?: string;
  personId?: string;
  type: EventType;
  channel?: Channel;
  source: string;
  payload: Record<string, any>;
  ts: Date;
  metadata?: Record<string, any>;
}

export interface EventFilters {
  workspaceId: string;
  personId?: string;
  types?: EventType[];
  channels?: Channel[];
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface TimelineResponse {
  events: Event[];
  nextCursor?: string;
}

export interface EventStats {
  totalEvents: number;
  byType: Record<string, number>;
  byChannel: Record<string, number>;
  recentEvents: Event[];
}

export interface TimelineOpts {
  channels?: Channel[];
  types?: EventType[];
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  includeMemory?: boolean;
}

// ============================================================================
// BUDGET ENGINE (Re-export from budget types)
// ============================================================================

export interface Wallet {
  id: string;
  workspaceId: string;
  organizationId: string;
  balance: number;
  currency: string;
  status: "active" | "frozen" | "depleted";
  autoReloadEnabled: boolean;
  autoReloadThreshold?: number;
  autoReloadAmount?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: "credit" | "debit" | "refund" | "adjustment";
  amount: number;
  balance: number;
  source: string;
  referenceId?: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface StripePayment {
  id: string;
  workspaceId: string;
  walletId: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  receiptUrl?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface StripePayout {
  id: string;
  workspaceId: string;
  connectAccountId: string;
  transferId: string;
  amount: number;
  currency: string;
  status: string;
  recipientType: string;
  recipientName: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  paidAt?: Date;
}

export interface BudgetAllocationRequest {
  workspaceId: string;
  profileId?: string;
  objectives: AllocationObjective[];
  constraints: AllocationConstraints;
  strategy?: AllocationStrategyType;
  dryRun?: boolean;
}

export interface AllocationObjective {
  type: ObjectiveType;
  priority: number;
  targetMetric: "leads" | "conversions" | "roas" | "engagement" | "reach";
  targetValue?: number;
  weight?: number;
}

export interface AllocationConstraints {
  totalBudget: number;
  period: "daily" | "weekly" | "monthly" | "campaign";
  minBudgetPerChannel?: number;
  maxBudgetPerChannel?: number;
  channelLimits?: Partial<Record<Channel, number>>;
  minROAS?: number;
  blacklistChannels?: Channel[];
  whitelistChannels?: Channel[];
  testBudgetPercent?: number;
}

export type AllocationStrategyType = "bandit" | "proportional" | "equal" | "manual" | "optimizer";

export interface AllocationPlan {
  id: string;
  workspaceId: string;
  requestId: string;
  strategy: AllocationStrategyType;
  channels: ChannelAllocation[];
  totalBudget: number;
  predictions: AllocationPredictions;
  confidence: number;
  reasoning: string;
  alternatives?: AllocationPlan[];
  status: "draft" | "pending_approval" | "approved" | "rejected";
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ChannelAllocation {
  channel: Channel;
  objective: ObjectiveType;
  budget: number;
  estimatedReach: number;
  estimatedImpressions: number;
  estimatedClicks: number;
  estimatedConversions: number;
  estimatedROAS: number;
  confidence: number;
  creative?: Record<string, any>;
  targeting?: Record<string, any>;
}

export interface AllocationPredictions {
  totalReach: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  averageROAS: number;
  riskLevel: "low" | "medium" | "high";
  modelConfidence: number;
}

export interface BudgetAllocation {
  id: string;
  workspaceId: string;
  profileId?: string;
  status: string;
  allocations: ChannelAllocation[];
  totalBudget: number;
  predictedROAS?: number;
  approvedBy?: string;
  approvedAt?: Date;
  executedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface BudgetProfile {
  id: string;
  workspaceId: string;
  name: string;
  objectives: ObjectiveType[];
  constraints: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReconciliationReport {
  allocationId: string;
  workspaceId: string;
  period: { from: Date; to: Date };
  summary: {
    plannedBudget: number;
    actualSpend: number;
    variance: number;
    variancePercent: number;
  };
  byChannel: ChannelReconciliation[];
  byObjective: ObjectiveReconciliation[];
  performance: {
    targetROAS?: number;
    actualROAS: number;
    targetConversions?: number;
    actualConversions: number;
    performanceScore: number;
  };
  recommendations: string[];
  createdAt: Date;
}

export interface ChannelReconciliation {
  channel: Channel;
  planned: number;
  actual: number;
  variance: number;
  conversions: {
    estimated: number;
    actual: number;
  };
  roas: {
    estimated: number;
    actual: number;
  };
  efficiency: number;
}

export interface ObjectiveReconciliation {
  objective: ObjectiveType;
  planned: number;
  actual: number;
  conversions: number;
  revenue: number;
  costPerConversion: number;
  roas: number;
}

export interface BudgetLedger {
  id: string;
  workspaceId: string;
  allocationId?: string;
  channel: Channel;
  amount: number;
  type: "planned" | "actual" | "adjustment";
  category: "send" | "ad" | "creator" | "service";
  externalId?: string;
  description?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface BudgetDashboard {
  workspaceId: string;
  period: { from: Date; to: Date };
  summary: {
    totalAllocated: number;
    totalSpent: number;
    remainingBudget: number;
    activeAllocations: number;
    avgROAS: number;
    topChannel: Channel;
    topObjective: ObjectiveType;
  };
  trends: {
    spendOverTime: Array<{ date: Date; amount: number }>;
    roasOverTime: Array<{ date: Date; value: number }>;
    conversionsByChannel: Array<{ channel: Channel; conversions: number }>;
  };
  alerts: SpendAlert[];
  recommendations: BudgetRecommendation[];
}

export interface SpendAlert {
  id: string;
  workspaceId: string;
  type: string;
  severity: string;
  message: string;
  currentSpend: number;
  thresholdSpend?: number;
  recommendedAction?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface BudgetRecommendation {
  type: string;
  channel?: Channel;
  objective?: ObjectiveType;
  currentValue: number;
  recommendedValue: number;
  expectedImpact: string;
  confidence: number;
  reasoning: string;
}
