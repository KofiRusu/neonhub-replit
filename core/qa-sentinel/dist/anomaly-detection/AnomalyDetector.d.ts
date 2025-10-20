import { Anomaly, TelemetryData, PerformanceMetrics } from '../types';
export declare class AnomalyDetector {
    private historicalData;
    private anomalyThreshold;
    private windowSize;
    constructor(threshold?: number, windowSize?: number);
    detectAnomalies(telemetryData: TelemetryData[]): Anomaly[];
    private analyzeMetric;
    private calculateSeverity;
    private classifyAnomalyType;
    detectPerformanceAnomalies(metrics: PerformanceMetrics): Anomaly[];
    detectTrendAnomalies(telemetryData: TelemetryData[], windowMinutes?: number): Anomaly[];
    private calculateTrend;
    getAnomalyStats(): {
        totalAnomalies: number;
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
    };
    updateThresholds(newThreshold: number): void;
    resetHistoricalData(): void;
    getHistoricalData(metricKey: string): number[];
}
//# sourceMappingURL=AnomalyDetector.d.ts.map