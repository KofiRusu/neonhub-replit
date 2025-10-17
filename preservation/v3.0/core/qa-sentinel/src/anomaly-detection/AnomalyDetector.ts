import { Anomaly, TelemetryData, PerformanceMetrics } from '../types';
import { mean, std } from 'stats-lite';

export class AnomalyDetector {
  private historicalData: Map<string, number[]> = new Map();
  private anomalyThreshold: number = 3.0; // Standard deviations
  private windowSize: number = 100; // Number of data points to keep for analysis

  constructor(threshold: number = 3.0, windowSize: number = 100) {
    this.anomalyThreshold = threshold;
    this.windowSize = windowSize;
  }

  detectAnomalies(telemetryData: TelemetryData[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Group data by metric
    const metricsData = new Map<string, TelemetryData[]>();
    for (const data of telemetryData) {
      const key = `${data.component}:${data.metric}`;
      if (!metricsData.has(key)) {
        metricsData.set(key, []);
      }
      metricsData.get(key)!.push(data);
    }

    // Analyze each metric
    for (const [metricKey, data] of metricsData) {
      const values = data.map(d => d.value);
      const detected = this.analyzeMetric(metricKey, values, data);

      // Update historical data
      if (!this.historicalData.has(metricKey)) {
        this.historicalData.set(metricKey, []);
      }
      const historical = this.historicalData.get(metricKey)!;
      historical.push(...values);

      // Keep only recent data
      if (historical.length > this.windowSize) {
        this.historicalData.set(metricKey, historical.slice(-this.windowSize));
      }

      anomalies.push(...detected);
    }

    return anomalies;
  }

  private analyzeMetric(metricKey: string, values: number[], telemetryData: TelemetryData[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (values.length < 10) return anomalies; // Need minimum data for analysis

    const historical = this.historicalData.get(metricKey) || [];
    if (historical.length < 20) return anomalies; // Need historical baseline

    const baselineMean = mean(historical);
    const baselineStd = std(historical);

    if (baselineStd === 0) return anomalies; // Cannot detect anomalies without variance

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const zScore = Math.abs((value - baselineMean) / baselineStd);

      if (zScore > this.anomalyThreshold) {
        const [component, metric] = metricKey.split(':');
        const severity = this.calculateSeverity(zScore, value, baselineMean);

        anomalies.push({
          id: `anomaly-${metricKey}-${Date.now()}-${i}`,
          type: this.classifyAnomalyType(metric, value, baselineMean),
          severity,
          metric,
          expectedValue: baselineMean,
          actualValue: value,
          deviation: zScore,
          confidence: Math.min(zScore / 5, 1.0), // Normalize confidence
          timestamp: telemetryData[i].timestamp
        });
      }
    }

    return anomalies;
  }

  private calculateSeverity(zScore: number, actualValue: number, expectedValue: number): 'low' | 'medium' | 'high' | 'critical' {
    if (zScore > 5) return 'critical';
    if (zScore > 4) return 'high';
    if (zScore > 3.5) return 'medium';
    return 'low';
  }

  private classifyAnomalyType(metric: string, actualValue: number, expectedValue: number): 'performance' | 'error' | 'resource' | 'behavior' {
    if (metric.includes('error') || metric.includes('failure')) {
      return 'error';
    }

    if (metric.includes('cpu') || metric.includes('memory') || metric.includes('disk')) {
      return 'resource';
    }

    if (metric.includes('response_time') || metric.includes('latency') || metric.includes('throughput')) {
      return 'performance';
    }

    return 'behavior';
  }

  detectPerformanceAnomalies(metrics: PerformanceMetrics): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const timestamp = new Date();

    // Response time anomalies
    if (metrics.responseTime.avg > 1000) { // Over 1 second average
      anomalies.push({
        id: `perf-anomaly-response-avg-${Date.now()}`,
        type: 'performance',
        severity: metrics.responseTime.avg > 2000 ? 'high' : 'medium',
        metric: 'response_time_avg',
        expectedValue: 500, // Expected baseline
        actualValue: metrics.responseTime.avg,
        deviation: (metrics.responseTime.avg - 500) / 500,
        confidence: 0.9,
        timestamp
      });
    }

    // P95 response time
    if (metrics.responseTime.p95 > 1500) {
      anomalies.push({
        id: `perf-anomaly-response-p95-${Date.now()}`,
        type: 'performance',
        severity: metrics.responseTime.p95 > 3000 ? 'high' : 'medium',
        metric: 'response_time_p95',
        expectedValue: 1000,
        actualValue: metrics.responseTime.p95,
        deviation: (metrics.responseTime.p95 - 1000) / 1000,
        confidence: 0.85,
        timestamp
      });
    }

    // Error rate anomalies
    if (metrics.errorRate > 0.05) { // Over 5% error rate
      anomalies.push({
        id: `perf-anomaly-error-rate-${Date.now()}`,
        type: 'error',
        severity: metrics.errorRate > 0.1 ? 'critical' : 'high',
        metric: 'error_rate',
        expectedValue: 0.02,
        actualValue: metrics.errorRate,
        deviation: (metrics.errorRate - 0.02) / 0.02,
        confidence: 0.95,
        timestamp
      });
    }

    // Resource usage anomalies
    if (metrics.cpuUsage > 90) {
      anomalies.push({
        id: `perf-anomaly-cpu-${Date.now()}`,
        type: 'resource',
        severity: 'high',
        metric: 'cpu_usage',
        expectedValue: 70,
        actualValue: metrics.cpuUsage,
        deviation: (metrics.cpuUsage - 70) / 70,
        confidence: 0.9,
        timestamp
      });
    }

    if (metrics.memoryUsage > 1024) { // Over 1GB
      anomalies.push({
        id: `perf-anomaly-memory-${Date.now()}`,
        type: 'resource',
        severity: 'high',
        metric: 'memory_usage',
        expectedValue: 512,
        actualValue: metrics.memoryUsage,
        deviation: (metrics.memoryUsage - 512) / 512,
        confidence: 0.85,
        timestamp
      });
    }

    return anomalies;
  }

  detectTrendAnomalies(telemetryData: TelemetryData[], windowMinutes: number = 60): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

    // Group data by metric within time window
    const windowData = telemetryData.filter(d => d.timestamp >= windowStart);
    const metricsData = new Map<string, TelemetryData[]>();

    for (const data of windowData) {
      const key = `${data.component}:${data.metric}`;
      if (!metricsData.has(key)) {
        metricsData.set(key, []);
      }
      metricsData.get(key)!.push(data);
    }

    // Analyze trends for each metric
    for (const [metricKey, data] of metricsData) {
      if (data.length < 10) continue; // Need enough data points

      const trend = this.calculateTrend(data);
      if (Math.abs(trend.slope) > trend.threshold) {
        const [component, metric] = metricKey.split(':');
        const severity = Math.abs(trend.slope) > trend.threshold * 2 ? 'high' : 'medium';

        anomalies.push({
          id: `trend-anomaly-${metricKey}-${Date.now()}`,
          type: this.classifyAnomalyType(metric, data[data.length - 1].value, trend.baseline),
          severity,
          metric,
          expectedValue: trend.baseline,
          actualValue: data[data.length - 1].value,
          deviation: Math.abs(trend.slope / trend.threshold),
          confidence: 0.8,
          timestamp: now
        });
      }
    }

    return anomalies;
  }

  private calculateTrend(data: TelemetryData[]): { slope: number, baseline: number, threshold: number } {
    const values = data.map(d => d.value);
    const times = data.map(d => d.timestamp.getTime());

    // Simple linear regression
    const n = values.length;
    const sumX = times.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = times.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = times.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const baseline = sumY / n;

    // Calculate threshold based on standard deviation
    const stdDev = std(values);
    const threshold = stdDev * 2; // 2 standard deviations

    return { slope, baseline, threshold };
  }

  getAnomalyStats(): { totalAnomalies: number, byType: Record<string, number>, bySeverity: Record<string, number> } {
    // This would track anomalies over time in a real implementation
    return {
      totalAnomalies: 0,
      byType: {},
      bySeverity: {}
    };
  }

  updateThresholds(newThreshold: number): void {
    this.anomalyThreshold = newThreshold;
  }

  resetHistoricalData(): void {
    this.historicalData.clear();
  }

  getHistoricalData(metricKey: string): number[] {
    return this.historicalData.get(metricKey) || [];
  }
}