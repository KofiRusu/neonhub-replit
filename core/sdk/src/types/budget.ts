/**
 * Budget Engine Types for SDK
 */

import { Channel, ObjectiveType } from './agentic';

// ============================================================================
// WALLET & PAYMENTS
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

// ============================================================================
// BUDGET ALLOCATION
// ============================================================================

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
