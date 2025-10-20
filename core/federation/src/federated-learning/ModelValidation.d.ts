import { Logger } from '../utils/Logger';
import { ModelUpdate, PoisoningDetectionResult } from '../types';
export declare class ModelValidation {
    private logger;
    constructor(logger: Logger);
    /**
     * Validates a model update for basic sanity checks
     */
    validateModelUpdate(modelUpdate: ModelUpdate): {
        isValid: boolean;
        reason?: string;
    };
    /**
     * Detects potential model poisoning using statistical analysis
     */
    detectPoisoning(modelUpdates: ModelUpdate[], globalModel?: ModelUpdate): PoisoningDetectionResult[];
    /**
     * Calculates statistical measures for model layers
     */
    private calculateLayerStatistics;
    /**
     * Analyzes a single model for poisoning indicators
     */
    private analyzeModelForPoisoning;
    /**
     * Compares model updates for consistency
     */
    compareModelConsistency(modelA: ModelUpdate, modelB: ModelUpdate): number;
}
//# sourceMappingURL=ModelValidation.d.ts.map