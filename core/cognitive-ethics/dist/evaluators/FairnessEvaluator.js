/**
 * FairnessEvaluator - Implements fairness metrics for AI systems
 * Evaluates demographic parity, equalized odds, and false positive/negative rates
 */
export class FairnessEvaluator {
    constructor(policy) {
        this.policy = policy;
    }
    /**
     * Evaluate fairness metrics for a set of predictions
     */
    async evaluate(predictions) {
        if (!this.policy.fairness?.enabled) {
            return this.getPassingMetrics();
        }
        const violations = [];
        const protectedAttributes = this.policy.fairness.protectedAttributes || [];
        // Calculate metrics for each protected attribute
        for (const attribute of protectedAttributes) {
            const groups = this.getUniqueGroups(predictions, attribute);
            if (groups.length < 2)
                continue;
            // Demographic Parity
            const dpGap = this.calculateDemographicParity(predictions, attribute, groups);
            if (dpGap > this.policy.fairness.demographicParityThreshold) {
                violations.push({
                    metric: 'demographic_parity',
                    value: dpGap,
                    threshold: this.policy.fairness.demographicParityThreshold,
                    protectedAttribute: attribute,
                    groups,
                });
            }
            // Equalized Odds
            const eoGap = this.calculateEqualizedOdds(predictions, attribute, groups);
            if (eoGap > this.policy.fairness.equalizedOddsThreshold) {
                violations.push({
                    metric: 'equalized_odds',
                    value: eoGap,
                    threshold: this.policy.fairness.equalizedOddsThreshold,
                    protectedAttribute: attribute,
                    groups,
                });
            }
            // False Positive Rate Gap
            const fprGap = this.calculateFalsePositiveRateGap(predictions, attribute, groups);
            if (fprGap > this.policy.fairness.equalizedOddsThreshold) {
                violations.push({
                    metric: 'false_positive_rate_gap',
                    value: fprGap,
                    threshold: this.policy.fairness.equalizedOddsThreshold,
                    protectedAttribute: attribute,
                    groups,
                });
            }
            // False Negative Rate Gap
            const fnrGap = this.calculateFalseNegativeRateGap(predictions, attribute, groups);
            if (fnrGap > this.policy.fairness.equalizedOddsThreshold) {
                violations.push({
                    metric: 'false_negative_rate_gap',
                    value: fnrGap,
                    threshold: this.policy.fairness.equalizedOddsThreshold,
                    protectedAttribute: attribute,
                    groups,
                });
            }
        }
        // Calculate aggregate metrics
        const demographicParity = this.calculateOverallDemographicParity(predictions);
        const equalizedOdds = this.calculateOverallEqualizedOdds(predictions);
        const fprGap = this.calculateOverallFPRGap(predictions);
        const fnrGap = this.calculateOverallFNRGap(predictions);
        return {
            demographicParity,
            equalizedOdds,
            falsePositiveRateGap: fprGap,
            falseNegativeRateGap: fnrGap,
            passed: violations.length === 0,
            violations,
        };
    }
    /**
     * Calculate demographic parity gap for a protected attribute
     * Demographic Parity: P(Ŷ=1|A=a) ≈ P(Ŷ=1|A=b)
     */
    calculateDemographicParity(predictions, attribute, groups) {
        const positiveRates = groups.map(group => {
            const groupPredictions = predictions.filter(p => p.protectedAttributes[attribute] === group);
            const positives = groupPredictions.filter(p => p.prediction).length;
            return positives / groupPredictions.length;
        });
        return Math.max(...positiveRates) - Math.min(...positiveRates);
    }
    /**
     * Calculate equalized odds gap
     * Equalized Odds: P(Ŷ=1|Y=y,A=a) ≈ P(Ŷ=1|Y=y,A=b) for all y
     */
    calculateEqualizedOdds(predictions, attribute, groups) {
        const tprGap = this.calculateTruePositiveRateGap(predictions, attribute, groups);
        const fprGap = this.calculateFalsePositiveRateGap(predictions, attribute, groups);
        return Math.max(tprGap, fprGap);
    }
    /**
     * Calculate true positive rate gap
     */
    calculateTruePositiveRateGap(predictions, attribute, groups) {
        const tprs = groups.map(group => {
            const groupPositives = predictions.filter(p => p.protectedAttributes[attribute] === group && p.actualLabel === true);
            if (groupPositives.length === 0)
                return 0;
            const truePositives = groupPositives.filter(p => p.prediction === true).length;
            return truePositives / groupPositives.length;
        });
        return Math.max(...tprs) - Math.min(...tprs);
    }
    /**
     * Calculate false positive rate gap
     */
    calculateFalsePositiveRateGap(predictions, attribute, groups) {
        const fprs = groups.map(group => {
            const groupNegatives = predictions.filter(p => p.protectedAttributes[attribute] === group && p.actualLabel === false);
            if (groupNegatives.length === 0)
                return 0;
            const falsePositives = groupNegatives.filter(p => p.prediction === true).length;
            return falsePositives / groupNegatives.length;
        });
        return Math.max(...fprs) - Math.min(...fprs);
    }
    /**
     * Calculate false negative rate gap
     */
    calculateFalseNegativeRateGap(predictions, attribute, groups) {
        const fnrs = groups.map(group => {
            const groupPositives = predictions.filter(p => p.protectedAttributes[attribute] === group && p.actualLabel === true);
            if (groupPositives.length === 0)
                return 0;
            const falseNegatives = groupPositives.filter(p => p.prediction === false).length;
            return falseNegatives / groupPositives.length;
        });
        return Math.max(...fnrs) - Math.min(...fnrs);
    }
    /**
     * Calculate overall demographic parity across all protected attributes
     */
    calculateOverallDemographicParity(predictions) {
        const protectedAttributes = this.policy.fairness?.protectedAttributes || [];
        const gaps = protectedAttributes.map(attr => {
            const groups = this.getUniqueGroups(predictions, attr);
            return this.calculateDemographicParity(predictions, attr, groups);
        });
        return gaps.length > 0 ? Math.max(...gaps) : 0;
    }
    /**
     * Calculate overall equalized odds across all protected attributes
     */
    calculateOverallEqualizedOdds(predictions) {
        const protectedAttributes = this.policy.fairness?.protectedAttributes || [];
        const gaps = protectedAttributes.map(attr => {
            const groups = this.getUniqueGroups(predictions, attr);
            return this.calculateEqualizedOdds(predictions, attr, groups);
        });
        return gaps.length > 0 ? Math.max(...gaps) : 0;
    }
    /**
     * Calculate overall false positive rate gap
     */
    calculateOverallFPRGap(predictions) {
        const protectedAttributes = this.policy.fairness?.protectedAttributes || [];
        const gaps = protectedAttributes.map(attr => {
            const groups = this.getUniqueGroups(predictions, attr);
            return this.calculateFalsePositiveRateGap(predictions, attr, groups);
        });
        return gaps.length > 0 ? Math.max(...gaps) : 0;
    }
    /**
     * Calculate overall false negative rate gap
     */
    calculateOverallFNRGap(predictions) {
        const protectedAttributes = this.policy.fairness?.protectedAttributes || [];
        const gaps = protectedAttributes.map(attr => {
            const groups = this.getUniqueGroups(predictions, attr);
            return this.calculateFalseNegativeRateGap(predictions, attr, groups);
        });
        return gaps.length > 0 ? Math.max(...gaps) : 0;
    }
    /**
     * Get unique groups for a protected attribute
     */
    getUniqueGroups(predictions, attribute) {
        const groups = new Set();
        predictions.forEach(p => {
            if (p.protectedAttributes[attribute]) {
                groups.add(p.protectedAttributes[attribute]);
            }
        });
        return Array.from(groups);
    }
    /**
     * Return passing metrics when fairness is disabled
     */
    getPassingMetrics() {
        return {
            demographicParity: 0,
            equalizedOdds: 0,
            falsePositiveRateGap: 0,
            falseNegativeRateGap: 0,
            passed: true,
            violations: [],
        };
    }
    /**
     * Evaluate fairness for a single prediction (simplified)
     */
    async evaluateSingle(prediction, context) {
        // For single predictions, we can only do basic checks
        // Full fairness metrics require a batch of predictions
        if (!this.policy.fairness?.enabled) {
            return this.getPassingMetrics();
        }
        const violations = [];
        // Check if protected attributes are present in context
        const protectedAttributes = this.policy.fairness.protectedAttributes || [];
        for (const attr of protectedAttributes) {
            if (context[attr]) {
                // Log for batch analysis but don't fail single prediction
                console.log(`Protected attribute ${attr} present in prediction context`);
            }
        }
        return {
            demographicParity: 0,
            equalizedOdds: 0,
            falsePositiveRateGap: 0,
            falseNegativeRateGap: 0,
            passed: violations.length === 0,
            violations,
        };
    }
}
//# sourceMappingURL=FairnessEvaluator.js.map