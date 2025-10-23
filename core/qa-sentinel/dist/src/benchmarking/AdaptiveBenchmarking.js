import { mean } from 'stats-lite';
export class AdaptiveBenchmarking {
    constructor() {
        this.baselineMetrics = new Map();
        this.historicalResults = [];
        this.loadBaselineData();
    }
    loadBaselineData() {
        // Load v5.0 baseline metrics
        this.baselineMetrics.set('api', {
            responseTime: {
                avg: 150,
                p95: 300,
                p99: 500,
                min: 50,
                max: 800
            },
            throughput: {
                requestsPerSecond: 100,
                concurrentUsers: 50
            },
            errorRate: 0.01,
            memoryUsage: 256,
            cpuUsage: 45,
            networkIO: {
                bytesIn: 1024000,
                bytesOut: 2048000
            }
        });
        this.baselineMetrics.set('database', {
            responseTime: {
                avg: 25,
                p95: 50,
                p99: 100,
                min: 5,
                max: 200
            },
            throughput: {
                requestsPerSecond: 500,
                concurrentUsers: 100
            },
            errorRate: 0.005,
            memoryUsage: 512,
            cpuUsage: 35,
            networkIO: {
                bytesIn: 512000,
                bytesOut: 1024000
            }
        });
    }
    async runBenchmark(buildId, telemetryData) {
        const currentMetrics = await this.collectCurrentMetrics(telemetryData);
        const baseline = this.baselineMetrics.get('api'); // Default to API baseline
        const comparison = this.compareWithBaseline(currentMetrics, baseline);
        const anomalies = this.detectBenchmarkAnomalies(currentMetrics, baseline);
        const result = {
            id: `benchmark-${Date.now()}`,
            buildId,
            baselineVersion: 'v5.0',
            metrics: currentMetrics,
            anomalies,
            comparison,
            timestamp: new Date()
        };
        this.historicalResults.push(result);
        // Keep only last 100 results
        if (this.historicalResults.length > 100) {
            this.historicalResults = this.historicalResults.slice(-100);
        }
        return result;
    }
    async collectCurrentMetrics(telemetryData) {
        // Group telemetry by component
        const componentData = new Map();
        for (const data of telemetryData) {
            if (!componentData.has(data.component)) {
                componentData.set(data.component, []);
            }
            componentData.get(data.component).push(data);
        }
        // Calculate metrics for API component (primary focus)
        const apiData = componentData.get('api') || [];
        const responseTimes = apiData
            .filter(d => d.metric === 'response_time')
            .map(d => d.value);
        const errorRates = apiData
            .filter(d => d.metric === 'error_rate')
            .map(d => d.value);
        const throughputData = apiData
            .filter(d => d.metric === 'throughput')
            .map(d => d.value);
        return {
            responseTime: {
                avg: responseTimes.length > 0 ? mean(responseTimes) : 200,
                p95: this.calculatePercentile(responseTimes, 95),
                p99: this.calculatePercentile(responseTimes, 99),
                min: responseTimes.length > 0 ? Math.min(...responseTimes) : 100,
                max: responseTimes.length > 0 ? Math.max(...responseTimes) : 500
            },
            throughput: {
                requestsPerSecond: throughputData.length > 0 ? mean(throughputData) : 80,
                concurrentUsers: 40 // Estimated
            },
            errorRate: errorRates.length > 0 ? mean(errorRates) : 0.02,
            memoryUsage: 300, // MB - would come from system metrics
            cpuUsage: 50, // Percentage - would come from system metrics
            networkIO: {
                bytesIn: 1048576, // 1MB
                bytesOut: 2097152 // 2MB
            }
        };
    }
    calculatePercentile(values, percentile) {
        if (values.length === 0)
            return 0;
        const sorted = values.sort((a, b) => a - b);
        const index = (percentile / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (upper >= sorted.length)
            return sorted[sorted.length - 1];
        return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
    }
    compareWithBaseline(current, baseline) {
        const delta = {
            responseTime: ((current.responseTime.avg - baseline.responseTime.avg) / baseline.responseTime.avg) * 100,
            throughput: ((current.throughput.requestsPerSecond - baseline.throughput.requestsPerSecond) / baseline.throughput.requestsPerSecond) * 100,
            errorRate: ((current.errorRate - baseline.errorRate) / baseline.errorRate) * 100,
            memoryUsage: ((current.memoryUsage - baseline.memoryUsage) / baseline.memoryUsage) * 100,
            cpuUsage: ((current.cpuUsage - baseline.cpuUsage) / baseline.cpuUsage) * 100
        };
        const regressionDetected = (current.responseTime.avg > baseline.responseTime.avg * 1.1 || // 10% degradation
            current.errorRate > baseline.errorRate * 2 || // Double error rate
            current.throughput.requestsPerSecond < baseline.throughput.requestsPerSecond * 0.9 // 10% throughput drop
        );
        const improvementAreas = [];
        if (delta.responseTime > 5)
            improvementAreas.push('Response time optimization needed');
        if (delta.errorRate > 10)
            improvementAreas.push('Error rate reduction required');
        if (delta.throughput < -5)
            improvementAreas.push('Throughput performance degraded');
        return {
            baseline,
            current,
            delta,
            regressionDetected,
            improvementAreas
        };
    }
    detectBenchmarkAnomalies(current, baseline) {
        const anomalies = [];
        // Response time anomaly
        const responseTimeDeviation = Math.abs(current.responseTime.avg - baseline.responseTime.avg) / baseline.responseTime.avg;
        if (responseTimeDeviation > 0.15) { // 15% deviation
            anomalies.push({
                id: `anomaly-response-${Date.now()}`,
                type: 'performance',
                severity: responseTimeDeviation > 0.3 ? 'high' : 'medium',
                metric: 'response_time',
                expectedValue: baseline.responseTime.avg,
                actualValue: current.responseTime.avg,
                deviation: responseTimeDeviation,
                confidence: 0.9,
                timestamp: new Date()
            });
        }
        // Error rate anomaly
        const errorRateDeviation = Math.abs(current.errorRate - baseline.errorRate) / baseline.errorRate;
        if (errorRateDeviation > 0.5) { // 50% increase in error rate
            anomalies.push({
                id: `anomaly-error-${Date.now()}`,
                type: 'error',
                severity: current.errorRate > baseline.errorRate * 2 ? 'high' : 'medium',
                metric: 'error_rate',
                expectedValue: baseline.errorRate,
                actualValue: current.errorRate,
                deviation: errorRateDeviation,
                confidence: 0.95,
                timestamp: new Date()
            });
        }
        // Throughput anomaly
        const throughputDeviation = Math.abs(current.throughput.requestsPerSecond - baseline.throughput.requestsPerSecond) / baseline.throughput.requestsPerSecond;
        if (throughputDeviation > 0.1) { // 10% deviation
            anomalies.push({
                id: `anomaly-throughput-${Date.now()}`,
                type: 'performance',
                severity: throughputDeviation > 0.2 ? 'high' : 'medium',
                metric: 'throughput',
                expectedValue: baseline.throughput.requestsPerSecond,
                actualValue: current.throughput.requestsPerSecond,
                deviation: throughputDeviation,
                confidence: 0.85,
                timestamp: new Date()
            });
        }
        return anomalies;
    }
    getHistoricalResults(limit = 10) {
        return this.historicalResults.slice(-limit);
    }
    getBaselineMetrics(component) {
        return this.baselineMetrics.get(component) || null;
    }
    updateBaseline(component, metrics) {
        this.baselineMetrics.set(component, metrics);
    }
    getPerformanceTrend(component, days = 7) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return this.historicalResults
            .filter(result => result.timestamp >= cutoff)
            .map(result => ({
            date: result.timestamp,
            metrics: result.metrics
        }));
    }
    calculatePerformanceScore(metrics, baseline) {
        // Calculate a composite performance score (0-100)
        const responseTimeScore = Math.max(0, 100 - (metrics.responseTime.avg / baseline.responseTime.avg) * 50);
        const errorRateScore = Math.max(0, 100 - (metrics.errorRate / baseline.errorRate) * 100);
        const throughputScore = Math.min(100, (metrics.throughput.requestsPerSecond / baseline.throughput.requestsPerSecond) * 100);
        return (responseTimeScore * 0.4 + errorRateScore * 0.4 + throughputScore * 0.2);
    }
    isPerformanceAcceptable(metrics, baseline, threshold = 80) {
        const score = this.calculatePerformanceScore(metrics, baseline);
        return score >= threshold;
    }
}
//# sourceMappingURL=AdaptiveBenchmarking.js.map