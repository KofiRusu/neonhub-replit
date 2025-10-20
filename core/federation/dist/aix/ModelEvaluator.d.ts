import { ModelEvaluationRequest, EvaluationResult } from '../types';
import { Logger } from '../utils/Logger';
export declare class ModelEvaluator {
    private logger;
    constructor(logger?: Logger);
    /**
     * Evaluate a model against test data
     */
    evaluateModel(request: ModelEvaluationRequest, modelData: any, testDataset: any[]): Promise<EvaluationResult>;
    /**
     * Run benchmark tests on model
     */
    private runBenchmarks;
    /**
     * Benchmark model latency
     */
    private benchmarkLatency;
    /**
     * Benchmark model throughput
     */
    private benchmarkThroughput;
    /**
     * Benchmark memory usage
     */
    private benchmarkMemory;
    /**
     * Benchmark device utilization
     */
    private benchmarkDeviceUtilization;
    /**
     * Calculate evaluation metrics
     */
    private calculateMetrics;
    /**
     * Perform cross-validation
     */
    private crossValidate;
    /**
     * Simulate model inference
     */
    private simulateInference;
    /**
     * Simulate model predictions on dataset
     */
    private simulatePredictions;
    /**
     * Generate sample inputs for benchmarking
     */
    private generateSampleInputs;
    private calculateAccuracy;
    private calculatePrecision;
    private calculateRecall;
    private calculateF1Score;
    private calculateMSE;
    private calculateMAE;
    private percentile;
    /**
     * Validate evaluation request
     */
    validateEvaluationRequest(request: ModelEvaluationRequest): boolean;
}
//# sourceMappingURL=ModelEvaluator.d.ts.map