/**
 * SafetyToxicityEvaluator - Detects harmful content in AI outputs
 * Implements toxicity, harassment, hate speech, violence, and self-harm classifiers
 */
import { EthicsPolicy, SafetyMetrics } from '../types';
interface ContentAnalysis {
    text: string;
    context?: Record<string, any>;
}
export declare class SafetyToxicityEvaluator {
    private policy;
    private toxicPatterns;
    private hateSpeechPatterns;
    private violencePatterns;
    private selfHarmPatterns;
    private harassmentPatterns;
    constructor(policy: EthicsPolicy);
    /**
     * Initialize pattern detection libraries
     */
    private initializePatterns;
    /**
     * Evaluate safety metrics for content
     */
    evaluate(content: ContentAnalysis): Promise<SafetyMetrics>;
    /**
     * Calculate toxicity score using pattern matching
     */
    private calculateToxicityScore;
    /**
     * Calculate hate speech score
     */
    private calculateHateSpeechScore;
    /**
     * Calculate violence score
     */
    private calculateViolenceScore;
    /**
     * Calculate self-harm score
     */
    private calculateSelfHarmScore;
    /**
     * Calculate harassment score
     */
    private calculateHarassmentScore;
    /**
     * Generic pattern-based scoring
     */
    private calculatePatternScore;
    /**
     * Extract flagged content from text
     */
    private extractFlaggedContent;
    /**
     * Return passing metrics when safety is disabled
     */
    private getPassingMetrics;
    /**
     * Batch evaluate multiple content items
     */
    evaluateBatch(contents: ContentAnalysis[]): Promise<SafetyMetrics[]>;
    /**
     * Get severity level for a violation
     */
    getSeverityLevel(score: number): 'low' | 'medium' | 'high' | 'critical';
    /**
     * Advanced ML-based toxicity detection (placeholder for future implementation)
     * This would integrate with external services like Perspective API or custom models
     */
    evaluateWithML(content: ContentAnalysis): Promise<SafetyMetrics>;
    /**
     * Context-aware evaluation considering domain and use case
     */
    evaluateWithContext(content: ContentAnalysis, context: {
        domain?: string;
        intent?: string;
        audience?: string;
    }): Promise<SafetyMetrics>;
    /**
     * Get remediation suggestions for violations
     */
    getRemediationSuggestions(metrics: SafetyMetrics): string[];
}
export {};
//# sourceMappingURL=SafetyToxicityEvaluator.d.ts.map