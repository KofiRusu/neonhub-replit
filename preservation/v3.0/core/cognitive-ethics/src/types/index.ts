/**
 * NeonHub v7.1 Cognitive Ethics & Alignment Types
 * Comprehensive type definitions for ethics-by-design framework
 */

import { z } from 'zod';

// ============================================================================
// Core Policy Types
// ============================================================================

export const EthicsPolicySchema = z.object({
  id: z.string(),
  version: z.string(),
  name: z.string(),
  description: z.string(),
  tenantId: z.string().optional(),
  jurisdiction: z.string().optional(),
  enabled: z.boolean().default(true),
  fairness: z.object({
    enabled: z.boolean().default(true),
    demographicParityThreshold: z.number().min(0).max(1).default(0.05),
    equalizedOddsThreshold: z.number().min(0).max(1).default(0.05),
    protectedAttributes: z.array(z.string()).default(['gender', 'race', 'age']),
  }).optional(),
  safety: z.object({
    enabled: z.boolean().default(true),
    toxicityThreshold: z.number().min(0).max(1).default(0.3),
    hateSpeechThreshold: z.number().min(0).max(1).default(0.2),
    violenceThreshold: z.number().min(0).max(1).default(0.3),
    selfHarmThreshold: z.number().min(0).max(1).default(0.1),
    harassmentThreshold: z.number().min(0).max(1).default(0.3),
  }).optional(),
  privacy: z.object({
    enabled: z.boolean().default(true),
    piiDetectionEnabled: z.boolean().default(true),
    autoRedactionEnabled: z.boolean().default(true),
    differentialPrivacyEnabled: z.boolean().default(false),
    privacyBudgetEpsilon: z.number().default(1.0),
    allowedPIITypes: z.array(z.string()).default([]),
  }).optional(),
  grounding: z.object({
    enabled: z.boolean().default(true),
    minConfidenceScore: z.number().min(0).max(1).default(0.85),
    requireCitations: z.boolean().default(true),
    maxHallucinationScore: z.number().min(0).max(1).default(0.15),
  }).optional(),
  explainability: z.object({
    enabled: z.boolean().default(true),
    requireRationale: z.boolean().default(true),
    captureShapValues: z.boolean().default(false),
    generateCounterfactuals: z.boolean().default(false),
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type EthicsPolicy = z.infer<typeof EthicsPolicySchema>;

// ============================================================================
// Evaluation Result Types
// ============================================================================

export interface FairnessMetrics {
  demographicParity: number;
  equalizedOdds: number;
  falsePositiveRateGap: number;
  falseNegativeRateGap: number;
  passed: boolean;
  violations: FairnessViolation[];
}

export interface FairnessViolation {
  metric: string;
  value: number;
  threshold: number;
  protectedAttribute: string;
  groups: string[];
}

export interface SafetyMetrics {
  toxicityScore: number;
  hateSpeechScore: number;
  violenceScore: number;
  selfHarmScore: number;
  harassmentScore: number;
  passed: boolean;
  violations: SafetyViolation[];
}

export interface SafetyViolation {
  category: 'toxicity' | 'hate_speech' | 'violence' | 'self_harm' | 'harassment';
  score: number;
  threshold: number;
  confidence: number;
  flaggedContent: string;
}

export interface PrivacyMetrics {
  piiDetected: PIIDetection[];
  privacyBudgetRemaining: number;
  passed: boolean;
  violations: PrivacyViolation[];
}

export interface PIIDetection {
  type: string;
  value: string;
  location: { start: number; end: number };
  confidence: number;
  redacted: boolean;
}

export interface PrivacyViolation {
  type: 'pii_leak' | 'budget_exceeded' | 'unauthorized_access';
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface GroundingMetrics {
  confidenceScore: number;
  hallucinationScore: number;
  citationsProvided: number;
  citationsVerified: number;
  passed: boolean;
  violations: GroundingViolation[];
}

export interface GroundingViolation {
  type: 'low_confidence' | 'missing_citation' | 'hallucination';
  claim: string;
  score: number;
  threshold: number;
}

export interface ExplainabilityMetrics {
  rationaleProvided: boolean;
  shapValues: Record<string, number> | null;
  counterfactuals: Counterfactual[] | null;
  passed: boolean;
}

export interface Counterfactual {
  original: string;
  modified: string;
  impact: number;
}

// ============================================================================
// Evaluation Results Aggregate
// ============================================================================

export interface EthicsEvaluationResult {
  evaluationId: string;
  timestamp: string;
  agentId: string;
  agentType: string;
  policyId: string;
  input: any;
  output: any;
  fairness: FairnessMetrics | null;
  safety: SafetyMetrics | null;
  privacy: PrivacyMetrics | null;
  grounding: GroundingMetrics | null;
  explainability: ExplainabilityMetrics | null;
  overallPassed: boolean;
  criticalViolations: number;
  attestation: EthicsAttestation;
}

export interface EthicsAttestation {
  hash: string;
  signature: string;
  merkleRoot: string;
  timestamp: string;
  policyVersion: string;
}

// ============================================================================
// Mitigation Types
// ============================================================================

export interface MitigationAction {
  type: 'block' | 'sanitize' | 'flag' | 'fallback' | 'human_review';
  reason: string;
  appliedAt: string;
  metadata?: Record<string, any>;
}

export interface MitigationResult {
  original: any;
  mitigated: any;
  actions: MitigationAction[];
  passed: boolean;
}

// ============================================================================
// Alignment Loop Types
// ============================================================================

export interface AlignmentTask {
  id: string;
  type: 'review' | 'approve' | 'override';
  agentId: string;
  evaluationId: string;
  violations: any[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated';
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  slaDeadline: string;
}

export interface AlignmentDecision {
  taskId: string;
  decision: 'approve' | 'reject' | 'modify' | 'escalate';
  reviewedBy: string;
  rationale: string;
  modifications?: any;
  timestamp: string;
}

// ============================================================================
// Model & Data Cards
// ============================================================================

export interface ModelCard {
  modelId: string;
  modelName: string;
  version: string;
  description: string;
  intendedUse: string;
  limitations: string[];
  trainingData: {
    sources: string[];
    size: number;
    demographics: Record<string, any>;
  };
  evaluationMetrics: {
    fairness: Record<string, number>;
    safety: Record<string, number>;
    performance: Record<string, number>;
  };
  ethicalConsiderations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DataCard {
  datasetId: string;
  datasetName: string;
  version: string;
  description: string;
  schema: any;
  statistics: {
    rowCount: number;
    columnCount: number;
    demographics: Record<string, any>;
  };
  provenance: {
    sources: string[];
    collectionMethod: string;
    consentObtained: boolean;
  };
  privacyMeasures: string[];
  biasAssessment: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Risk Dashboard Types
// ============================================================================

export interface RiskScore {
  agentId: string;
  agentType: string;
  tenantId: string;
  jurisdiction: string;
  fairnessRisk: number;
  safetyRisk: number;
  privacyRisk: number;
  overallRisk: number;
  trend: 'improving' | 'stable' | 'degrading';
  lastEvaluated: string;
}

export interface ViolationReport {
  violationId: string;
  evaluationId: string;
  agentId: string;
  category: 'fairness' | 'safety' | 'privacy' | 'grounding';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigationApplied: boolean;
  status: 'open' | 'mitigated' | 'resolved';
  createdAt: string;
  resolvedAt: string | null;
}

// ============================================================================
// Adapter Types
// ============================================================================

export interface AgentEthicsContext {
  agentId: string;
  agentType: string;
  tenantId: string;
  jurisdiction: string;
  policy: EthicsPolicy;
}

export interface PreCheckResult {
  passed: boolean;
  violations: any[];
  mitigations: MitigationAction[];
}

export interface PostCheckResult {
  passed: boolean;
  evaluation: EthicsEvaluationResult;
  attestation: EthicsAttestation;
}

// ============================================================================
// Export All
// ============================================================================

export type { z };