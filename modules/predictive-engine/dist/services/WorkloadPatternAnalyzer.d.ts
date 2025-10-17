import { WorkloadPattern, CloudMetrics, PredictionResult } from '../types';
export declare class WorkloadPatternAnalyzer {
    private logger;
    private patterns;
    private metricsHistory;
    private readonly maxHistorySize;
    constructor();
    analyzeAndCreatePatterns(metrics: CloudMetrics[], serviceId: string): Promise<WorkloadPattern[]>;
    predictUsingPatterns(serviceId: string, currentTime?: Date): Promise<PredictionResult[]>;
    getOptimalScalingSchedule(serviceId: string): Promise<Array<{
        time: Date;
        recommendedReplicas: number;
        confidence: number;
        pattern: string;
    }>>;
    private analyzeDailyPattern;
    private analyzeWeeklyPattern;
    private analyzeSeasonalPatterns;
    private analyzeSpikePatterns;
    private generatePredictionFromPattern;
    private predictFromDailyPattern;
    private predictFromWeeklyPattern;
    private predictFromSpikePattern;
    private calculateVariance;
    private trimHistory;
    getPatterns(serviceId?: string): WorkloadPattern[];
    clearPatterns(serviceId?: string): void;
}
//# sourceMappingURL=WorkloadPatternAnalyzer.d.ts.map