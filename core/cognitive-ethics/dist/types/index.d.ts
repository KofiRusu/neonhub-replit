/**
 * NeonHub v7.1 Cognitive Ethics & Alignment Types
 * Comprehensive type definitions for ethics-by-design framework
 */
import { z } from 'zod';
export declare const EthicsPolicySchema: z.ZodObject<{
    id: z.ZodString;
    version: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    tenantId: z.ZodOptional<z.ZodString>;
    jurisdiction: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    fairness: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        demographicParityThreshold: z.ZodDefault<z.ZodNumber>;
        equalizedOddsThreshold: z.ZodDefault<z.ZodNumber>;
        protectedAttributes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        demographicParityThreshold: number;
        equalizedOddsThreshold: number;
        protectedAttributes: string[];
    }, {
        enabled?: boolean | undefined;
        demographicParityThreshold?: number | undefined;
        equalizedOddsThreshold?: number | undefined;
        protectedAttributes?: string[] | undefined;
    }>>;
    safety: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        toxicityThreshold: z.ZodDefault<z.ZodNumber>;
        hateSpeechThreshold: z.ZodDefault<z.ZodNumber>;
        violenceThreshold: z.ZodDefault<z.ZodNumber>;
        selfHarmThreshold: z.ZodDefault<z.ZodNumber>;
        harassmentThreshold: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        toxicityThreshold: number;
        hateSpeechThreshold: number;
        violenceThreshold: number;
        selfHarmThreshold: number;
        harassmentThreshold: number;
    }, {
        enabled?: boolean | undefined;
        toxicityThreshold?: number | undefined;
        hateSpeechThreshold?: number | undefined;
        violenceThreshold?: number | undefined;
        selfHarmThreshold?: number | undefined;
        harassmentThreshold?: number | undefined;
    }>>;
    privacy: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        piiDetectionEnabled: z.ZodDefault<z.ZodBoolean>;
        autoRedactionEnabled: z.ZodDefault<z.ZodBoolean>;
        differentialPrivacyEnabled: z.ZodDefault<z.ZodBoolean>;
        privacyBudgetEpsilon: z.ZodDefault<z.ZodNumber>;
        allowedPIITypes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        piiDetectionEnabled: boolean;
        autoRedactionEnabled: boolean;
        differentialPrivacyEnabled: boolean;
        privacyBudgetEpsilon: number;
        allowedPIITypes: string[];
    }, {
        enabled?: boolean | undefined;
        piiDetectionEnabled?: boolean | undefined;
        autoRedactionEnabled?: boolean | undefined;
        differentialPrivacyEnabled?: boolean | undefined;
        privacyBudgetEpsilon?: number | undefined;
        allowedPIITypes?: string[] | undefined;
    }>>;
    grounding: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        minConfidenceScore: z.ZodDefault<z.ZodNumber>;
        requireCitations: z.ZodDefault<z.ZodBoolean>;
        maxHallucinationScore: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        minConfidenceScore: number;
        requireCitations: boolean;
        maxHallucinationScore: number;
    }, {
        enabled?: boolean | undefined;
        minConfidenceScore?: number | undefined;
        requireCitations?: boolean | undefined;
        maxHallucinationScore?: number | undefined;
    }>>;
    explainability: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        requireRationale: z.ZodDefault<z.ZodBoolean>;
        captureShapValues: z.ZodDefault<z.ZodBoolean>;
        generateCounterfactuals: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        requireRationale: boolean;
        captureShapValues: boolean;
        generateCounterfactuals: boolean;
    }, {
        enabled?: boolean | undefined;
        requireRationale?: boolean | undefined;
        captureShapValues?: boolean | undefined;
        generateCounterfactuals?: boolean | undefined;
    }>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    version: string;
    name: string;
    description: string;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
    tenantId?: string | undefined;
    jurisdiction?: string | undefined;
    fairness?: {
        enabled: boolean;
        demographicParityThreshold: number;
        equalizedOddsThreshold: number;
        protectedAttributes: string[];
    } | undefined;
    safety?: {
        enabled: boolean;
        toxicityThreshold: number;
        hateSpeechThreshold: number;
        violenceThreshold: number;
        selfHarmThreshold: number;
        harassmentThreshold: number;
    } | undefined;
    privacy?: {
        enabled: boolean;
        piiDetectionEnabled: boolean;
        autoRedactionEnabled: boolean;
        differentialPrivacyEnabled: boolean;
        privacyBudgetEpsilon: number;
        allowedPIITypes: string[];
    } | undefined;
    grounding?: {
        enabled: boolean;
        minConfidenceScore: number;
        requireCitations: boolean;
        maxHallucinationScore: number;
    } | undefined;
    explainability?: {
        enabled: boolean;
        requireRationale: boolean;
        captureShapValues: boolean;
        generateCounterfactuals: boolean;
    } | undefined;
}, {
    id: string;
    version: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    tenantId?: string | undefined;
    jurisdiction?: string | undefined;
    enabled?: boolean | undefined;
    fairness?: {
        enabled?: boolean | undefined;
        demographicParityThreshold?: number | undefined;
        equalizedOddsThreshold?: number | undefined;
        protectedAttributes?: string[] | undefined;
    } | undefined;
    safety?: {
        enabled?: boolean | undefined;
        toxicityThreshold?: number | undefined;
        hateSpeechThreshold?: number | undefined;
        violenceThreshold?: number | undefined;
        selfHarmThreshold?: number | undefined;
        harassmentThreshold?: number | undefined;
    } | undefined;
    privacy?: {
        enabled?: boolean | undefined;
        piiDetectionEnabled?: boolean | undefined;
        autoRedactionEnabled?: boolean | undefined;
        differentialPrivacyEnabled?: boolean | undefined;
        privacyBudgetEpsilon?: number | undefined;
        allowedPIITypes?: string[] | undefined;
    } | undefined;
    grounding?: {
        enabled?: boolean | undefined;
        minConfidenceScore?: number | undefined;
        requireCitations?: boolean | undefined;
        maxHallucinationScore?: number | undefined;
    } | undefined;
    explainability?: {
        enabled?: boolean | undefined;
        requireRationale?: boolean | undefined;
        captureShapValues?: boolean | undefined;
        generateCounterfactuals?: boolean | undefined;
    } | undefined;
}>;
export type EthicsPolicy = z.infer<typeof EthicsPolicySchema>;
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
    location: {
        start: number;
        end: number;
    };
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
export type { z };
//# sourceMappingURL=index.d.ts.map