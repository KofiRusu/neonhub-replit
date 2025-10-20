import { IntelligenceAggregationRequest, ModelSummary } from '../types';
import { Logger } from '../utils/Logger';
export declare class IntelligenceAggregator {
    private logger;
    constructor(logger?: Logger);
    /**
     * Aggregate intelligence from multiple models
     */
    aggregateIntelligence(request: IntelligenceAggregationRequest, modelSummaries: ModelSummary[]): Promise<ModelSummary>;
    /**
     * Federated averaging of model weights
     */
    private federatedAverage;
    /**
     * Ensemble averaging for model predictions
     */
    private ensembleAverage;
    /**
     * Stacked generalization aggregation
     */
    private stackedGeneralization;
    /**
     * Meta-learning aggregation
     */
    private metaLearningAggregation;
    /**
     * Average weights across models
     */
    private averageWeights;
    /**
     * Aggregate performance metrics
     */
    private aggregatePerformance;
    /**
     * Aggregate validation metrics
     */
    private aggregateValidationMetrics;
    /**
     * Initialize meta weights for meta-learning
     */
    private initializeMetaWeights;
    /**
     * Validate aggregation request
     */
    validateAggregationRequest(request: IntelligenceAggregationRequest): boolean;
}
//# sourceMappingURL=IntelligenceAggregator.d.ts.map