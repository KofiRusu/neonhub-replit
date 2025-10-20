/**
 * PrivacyEvaluator - Protects user privacy through PII detection and differential privacy
 * Implements PII detection/redaction and differential privacy budget management
 */
import { EthicsPolicy, PrivacyMetrics, PIIDetection } from '../types';
interface PrivacyContext {
    text: string;
    tenantId?: string;
    userId?: string;
    metadata?: Record<string, any>;
}
export declare class PrivacyEvaluator {
    private policy;
    private readonly PII_PATTERNS;
    private privacyBudgets;
    constructor(policy: EthicsPolicy);
    /**
     * Evaluate privacy metrics for content
     */
    evaluate(context: PrivacyContext): Promise<PrivacyMetrics>;
    /**
     * Detect PII in text using pattern matching
     */
    private detectPII;
    /**
     * Calculate confidence score for PII detection
     */
    private calculateConfidence;
    /**
     * Calculate severity of PII violations
     */
    private calculatePIISeverity;
    /**
     * Redact PII from text
     */
    redactPII(text: string, detections: PIIDetection[]): string;
    /**
     * Get redaction mask for PII type
     */
    private getRedactionMask;
    /**
     * Check differential privacy budget
     */
    private checkPrivacyBudget;
    /**
     * Consume privacy budget for a query
     */
    consumePrivacyBudget(key: string, cost: number): {
        success: boolean;
        remaining: number;
    };
    /**
     * Reset privacy budget for a key
     */
    resetPrivacyBudget(key: string): void;
    /**
     * Get budget key from context
     */
    private getBudgetKey;
    /**
     * Return passing metrics when privacy is disabled
     */
    private getPassingMetrics;
    /**
     * Evaluate and auto-redact in one operation
     */
    evaluateAndRedact(context: PrivacyContext): Promise<{
        metrics: PrivacyMetrics;
        redactedText: string;
    }>;
    /**
     * Batch evaluate multiple contexts
     */
    evaluateBatch(contexts: PrivacyContext[]): Promise<PrivacyMetrics[]>;
    /**
     * Add noise for differential privacy (Laplace mechanism)
     */
    addNoise(value: number, sensitivity: number, epsilon: number): number;
    /**
     * Check if text contains sensitive information
     */
    containsSensitiveInfo(text: string): boolean;
    /**
     * Get privacy risk score for text
     */
    getPrivacyRiskScore(text: string): number;
}
export {};
//# sourceMappingURL=PrivacyEvaluator.d.ts.map