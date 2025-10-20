/**
 * FairnessEvaluator - Implements fairness metrics for AI systems
 * Evaluates demographic parity, equalized odds, and false positive/negative rates
 */
import { EthicsPolicy, FairnessMetrics } from '../types';
interface PredictionData {
    prediction: boolean;
    actualLabel: boolean;
    protectedAttributes: Record<string, string>;
}
export declare class FairnessEvaluator {
    private policy;
    constructor(policy: EthicsPolicy);
    /**
     * Evaluate fairness metrics for a set of predictions
     */
    evaluate(predictions: PredictionData[]): Promise<FairnessMetrics>;
    /**
     * Calculate demographic parity gap for a protected attribute
     * Demographic Parity: P(Ŷ=1|A=a) ≈ P(Ŷ=1|A=b)
     */
    private calculateDemographicParity;
    /**
     * Calculate equalized odds gap
     * Equalized Odds: P(Ŷ=1|Y=y,A=a) ≈ P(Ŷ=1|Y=y,A=b) for all y
     */
    private calculateEqualizedOdds;
    /**
     * Calculate true positive rate gap
     */
    private calculateTruePositiveRateGap;
    /**
     * Calculate false positive rate gap
     */
    private calculateFalsePositiveRateGap;
    /**
     * Calculate false negative rate gap
     */
    private calculateFalseNegativeRateGap;
    /**
     * Calculate overall demographic parity across all protected attributes
     */
    private calculateOverallDemographicParity;
    /**
     * Calculate overall equalized odds across all protected attributes
     */
    private calculateOverallEqualizedOdds;
    /**
     * Calculate overall false positive rate gap
     */
    private calculateOverallFPRGap;
    /**
     * Calculate overall false negative rate gap
     */
    private calculateOverallFNRGap;
    /**
     * Get unique groups for a protected attribute
     */
    private getUniqueGroups;
    /**
     * Return passing metrics when fairness is disabled
     */
    private getPassingMetrics;
    /**
     * Evaluate fairness for a single prediction (simplified)
     */
    evaluateSingle(prediction: boolean, context: Record<string, any>): Promise<FairnessMetrics>;
}
export {};
//# sourceMappingURL=FairnessEvaluator.d.ts.map