/**
 * Budget Engine types
 * @module types/budget
 */

// Import types from agentic module
import type { Channel, ObjectiveType } from "./agentic";

// ============================================================================
// WALLET & PAYMENTS
// ============================================================================

export interface Wallet {
  id: string;
  workspaceId: string;
  organizationId: string;
  balance: number; // in cents
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
  amount: number; // in cents, positive for credit, negative for debit
  balance: number; // balance after transaction
  source:
    | "stripe_payment"
    | "campaign_spend"
    | "refund"
    | "manual"
    | "auto_reload";
  referenceId?: string; // payment_intent_id, allocation_id, etc.
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface StripePayment {
  id: string;
  workspaceId: string;
  walletId: string;
  paymentIntentId: string;
  amount: number; // in cents
  currency: string;
  status:
    | "pending"
    | "processing"
    | "succeeded"
    | "failed"
    | "canceled"
    | "refunded";
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
  connectAccountId: string; // partner/creator Stripe Connect account
  transferId: string;
  amount: number; // in cents
  currency: string;
  status: "pending" | "in_transit" | "paid" | "failed" | "canceled";
  recipientType: "creator" | "freelancer" | "partner" | "vendor";
  recipientName: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  paidAt?: Date;
}

// ============================================================================
// BUDGET ALLOCATION
// ============================================================================

export interface BudgetAllocationRequest {
  workspaceId: string;
  profileId?: string; // optional reference to saved profile
  objectives: AllocationObjective[];
  constraints: AllocationConstraints;
  strategy?: AllocationStrategyType;
  dryRun?: boolean; // if true, return plan without executing
}

export interface AllocationObjective {
  type: ObjectiveType;
  priority: number; // 1-10
  targetMetric: "leads" | "conversions" | "roas" | "engagement" | "reach";
  targetValue?: number;
  weight?: number; // relative importance if multiple objectives
}

export interface AllocationConstraints {
  totalBudget: number; // in cents
  period: "daily" | "weekly" | "monthly" | "campaign";
  minBudgetPerChannel?: number;
  maxBudgetPerChannel?: number;
  channelLimits?: Partial<Record<Channel, number>>;
  minROAS?: number;
  blacklistChannels?: Channel[];
  whitelistChannels?: Channel[];
  testBudgetPercent?: number; // % to allocate for A/B testing
}

export type AllocationStrategyType =
  | "bandit" // Thompson sampling for exploration/exploitation
  | "proportional" // allocate based on historical performance
  | "equal" // equal split across channels
  | "manual" // user specifies exact amounts
  | "optimizer"; // constrained optimization (max conversions under budget)

export interface AllocationPlan {
  id: string;
  workspaceId: string;
  requestId: string;
  strategy: AllocationStrategyType;
  channels: ChannelAllocation[];
  totalBudget: number;
  predictions: AllocationPredictions;
  confidence: number; // 0-1
  reasoning: string;
  alternatives?: AllocationPlan[]; // alternative plans for comparison
  status: "draft" | "pending_approval" | "approved" | "rejected";
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ChannelAllocation {
  channel: Channel;
  objective: ObjectiveType;
  budget: number; // in cents
  estimatedReach: number;
  estimatedImpressions: number;
  estimatedClicks: number;
  estimatedConversions: number;
  estimatedROAS: number;
  confidence: number;
  creative?: CreativeSpec;
  targeting?: TargetingSpec;
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
  confidenceInterval?: {
    conversions: { min: number; max: number };
    revenue: { min: number; max: number };
  };
}

export interface CreativeSpec {
  templateId?: string;
  variantId?: string;
  copy?: string;
  media?: string[];
  format: string;
}

export interface TargetingSpec {
  demographics?: {
    ageMin?: number;
    ageMax?: number;
    gender?: string[];
    locations?: string[];
    languages?: string[];
  };
  interests?: string[];
  behaviors?: string[];
  customAudiences?: string[];
  lookalikes?: string[];
}

// ============================================================================
// EXECUTION
// ============================================================================

export interface ExecutionPlan {
  allocationId: string;
  workspaceId: string;
  jobs: ExecutionJob[];
  status: "pending" | "running" | "paused" | "completed" | "failed";
  startedAt?: Date;
  completedAt?: Date;
  pausedAt?: Date;
  error?: string;
}

export interface ExecutionJob {
  id: string;
  channel: Channel;
  type: "email_campaign" | "sms_campaign" | "dm_campaign" | "ad_campaign";
  budget: number;
  status: "pending" | "running" | "completed" | "failed";
  config: Record<string, any>;
  externalIds?: string[]; // campaign_id, ad_set_id, etc.
  spent: number;
  results?: JobResults;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface JobResults {
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  replied?: number;
  converted?: number;
  bounced?: number;
  unsubscribed?: number;
  impressions?: number;
  reach?: number;
  engagement?: number;
  revenue?: number;
}

// ============================================================================
// RECONCILIATION
// ============================================================================

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
    performanceScore: number; // 0-100
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
  efficiency: number; // actual_conversions / actual_spend
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

// ============================================================================
// LEARNING & OPTIMIZATION
// ============================================================================

export interface ChannelPerformanceHistory {
  channel: Channel;
  objective: ObjectiveType;
  dataPoints: PerformanceDataPoint[];
  trends: {
    costPerImpression: number; // avg over period
    costPerClick: number;
    costPerConversion: number;
    conversionRate: number;
    roas: number;
  };
  seasonality?: Record<string, number>; // day_of_week or month → modifier
}

export interface PerformanceDataPoint {
  date: Date;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cvr: number;
  roas: number;
}

export interface BanditState {
  channel: Channel;
  objective: ObjectiveType;
  alpha: number; // successes + 1
  beta: number; // failures + 1
  expectedValue: number;
  confidence: number;
  pulls: number; // times this arm has been pulled
  lastUpdated: Date;
}

export interface OptimizationSignal {
  type:
    | "keyword_velocity"
    | "social_trending"
    | "competitor_activity"
    | "seasonality"
    | "inventory_change"
    | "external_event";
  channel?: Channel;
  strength: number; // -1 to 1, negative = reduce spend, positive = increase
  confidence: number;
  source: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// ============================================================================
// COST TRACKING
// ============================================================================

export interface CostBreakdown {
  workspaceId: string;
  period: { from: Date; to: Date };
  categories: {
    emailSends: { count: number; cost: number };
    smsSends: { count: number; cost: number };
    dmSends: { count: number; cost: number };
    adSpend: { impressions: number; cost: number };
    creatorPayments: { count: number; cost: number };
    aiTokens: { count: number; cost: number };
    storage: { gb: number; cost: number };
    other: { description: string; cost: number }[];
  };
  totalCost: number;
  totalRevenue: number;
  netProfit: number;
  overallROAS: number;
}

export interface UnitCost {
  channel: Channel;
  unit: "send" | "impression" | "click" | "conversion";
  cost: number; // in cents
  currency: string;
  effectiveDate: Date;
  source: "platform" | "actual" | "estimated";
}

// ============================================================================
// APPROVALS & GOVERNANCE
// ============================================================================

export interface ApprovalWorkflow {
  id: string;
  workspaceId: string;
  allocationId: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requiredApprovers: string[]; // user IDs
  approvers: Approval[];
  reason?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface Approval {
  userId: string;
  userName: string;
  decision: "approve" | "reject";
  reason?: string;
  timestamp: Date;
}

export interface SpendAlert {
  id: string;
  workspaceId: string;
  type: "threshold_exceeded" | "pace_high" | "pace_low" | "anomaly_detected";
  severity: "info" | "warning" | "critical";
  message: string;
  currentSpend: number;
  thresholdSpend?: number;
  recommendedAction?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

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

export interface BudgetRecommendation {
  type:
    | "increase_budget"
    | "decrease_budget"
    | "reallocate"
    | "test_new_channel"
    | "pause_campaign";
  channel?: Channel;
  objective?: ObjectiveType;
  currentValue: number;
  recommendedValue: number;
  expectedImpact: string;
  confidence: number;
  reasoning: string;
}

