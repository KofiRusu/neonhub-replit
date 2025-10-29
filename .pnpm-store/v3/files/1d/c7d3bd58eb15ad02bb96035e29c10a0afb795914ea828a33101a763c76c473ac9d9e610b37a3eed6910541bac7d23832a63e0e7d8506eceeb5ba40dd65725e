import { PerformanceMetrics, PredictiveThresholds, ScalingDecision, PredictionResult } from '../types';
export declare class PredictiveEngine {
    private logger;
    private thresholds;
    private baselineMetrics;
    private historicalData;
    constructor(thresholds: PredictiveThresholds);
    initialize(): Promise<void>;
    predictTrafficLoad(currentMetrics: PerformanceMetrics): Promise<PredictionResult>;
    predictLatency(currentMetrics: PerformanceMetrics): Promise<PredictionResult>;
    predictErrorRate(currentMetrics: PerformanceMetrics): Promise<PredictionResult>;
    makeScalingDecision(currentMetrics: PerformanceMetrics): Promise<ScalingDecision>;
    updateHistoricalData(metrics: PerformanceMetrics): void;
    private calculateTrafficLatencyCorrelation;
    getBaselineMetrics(): PerformanceMetrics;
    getHistoricalData(): PerformanceMetrics[];
}
//# sourceMappingURL=PredictiveEngine.d.ts.map