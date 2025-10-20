import { BenchmarkResult, PerformanceMetrics, TelemetryData } from '../types';
export declare class AdaptiveBenchmarking {
    private baselineMetrics;
    private historicalResults;
    constructor();
    private loadBaselineData;
    runBenchmark(buildId: string, telemetryData: TelemetryData[]): Promise<BenchmarkResult>;
    private collectCurrentMetrics;
    private calculatePercentile;
    private compareWithBaseline;
    private detectBenchmarkAnomalies;
    getHistoricalResults(limit?: number): BenchmarkResult[];
    getBaselineMetrics(component: string): PerformanceMetrics | null;
    updateBaseline(component: string, metrics: PerformanceMetrics): void;
    getPerformanceTrend(component: string, days?: number): {
        date: Date;
        metrics: PerformanceMetrics;
    }[];
    calculatePerformanceScore(metrics: PerformanceMetrics, baseline: PerformanceMetrics): number;
    isPerformanceAcceptable(metrics: PerformanceMetrics, baseline: PerformanceMetrics, threshold?: number): boolean;
}
//# sourceMappingURL=AdaptiveBenchmarking.d.ts.map