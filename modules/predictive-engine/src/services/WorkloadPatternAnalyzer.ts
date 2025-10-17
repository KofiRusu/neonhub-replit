import {
  WorkloadPattern,
  PerformanceMetrics,
  CloudMetrics,
  PredictionResult
} from '../types';
import * as winston from 'winston';

export class WorkloadPatternAnalyzer {
  private logger: winston.Logger;
  private patterns: Map<string, WorkloadPattern> = new Map();
  private metricsHistory: CloudMetrics[] = [];
  private readonly maxHistorySize = 10000; // Keep last 10k metrics points

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'workload-pattern-analyzer.log' })
      ]
    });
  }

  async analyzeAndCreatePatterns(metrics: CloudMetrics[], serviceId: string): Promise<WorkloadPattern[]> {
    try {
      // Add metrics to history
      this.metricsHistory.push(...metrics);
      this.trimHistory();

      // Filter metrics for this service
      const serviceMetrics = this.metricsHistory.filter(m => m.serviceId === serviceId);

      if (serviceMetrics.length < 100) { // Need minimum data points
        this.logger.warn(`Insufficient data for pattern analysis of ${serviceId}`);
        return [];
      }

      const patterns: WorkloadPattern[] = [];

      // Analyze daily patterns
      const dailyPattern = await this.analyzeDailyPattern(serviceMetrics, serviceId);
      if (dailyPattern) patterns.push(dailyPattern);

      // Analyze weekly patterns
      const weeklyPattern = await this.analyzeWeeklyPattern(serviceMetrics, serviceId);
      if (weeklyPattern) patterns.push(weeklyPattern);

      // Analyze seasonal patterns
      const seasonalPatterns = await this.analyzeSeasonalPatterns(serviceMetrics, serviceId);
      patterns.push(...seasonalPatterns);

      // Analyze traffic spike patterns
      const spikePattern = await this.analyzeSpikePatterns(serviceMetrics, serviceId);
      if (spikePattern) patterns.push(spikePattern);

      // Store patterns
      patterns.forEach(pattern => {
        this.patterns.set(pattern.patternId, pattern);
      });

      this.logger.info(`Created ${patterns.length} workload patterns for ${serviceId}`);
      return patterns;
    } catch (error) {
      this.logger.error(`Failed to analyze patterns for ${serviceId}`, error);
      return [];
    }
  }

  async predictUsingPatterns(serviceId: string, currentTime: Date = new Date()): Promise<PredictionResult[]> {
    try {
      const relevantPatterns = Array.from(this.patterns.values())
        .filter(pattern => pattern.patternId.startsWith(`${serviceId}-`));

      if (relevantPatterns.length === 0) {
        return [];
      }

      const predictions: PredictionResult[] = [];

      for (const pattern of relevantPatterns) {
        const prediction = await this.generatePredictionFromPattern(pattern, currentTime);
        if (prediction) predictions.push(prediction);
      }

      return predictions;
    } catch (error) {
      this.logger.error(`Failed to predict using patterns for ${serviceId}`, error);
      return [];
    }
  }

  async getOptimalScalingSchedule(serviceId: string): Promise<Array<{
    time: Date;
    recommendedReplicas: number;
    confidence: number;
    pattern: string;
  }>> {
    try {
      const patterns = Array.from(this.patterns.values())
        .filter(pattern => pattern.patternId.startsWith(`${serviceId}-`));

      const schedule: Array<{
        time: Date;
        recommendedReplicas: number;
        confidence: number;
        pattern: string;
      }> = [];

      const now = new Date();

      // Generate schedule for next 24 hours
      for (let hour = 0; hour < 24; hour++) {
        const futureTime = new Date(now.getTime() + hour * 60 * 60 * 1000);

        for (const pattern of patterns) {
          const prediction = await this.generatePredictionFromPattern(pattern, futureTime);
          if (prediction) {
            // Calculate recommended replicas based on predicted load
            const recommendedReplicas = Math.max(1, Math.ceil(prediction.predictedValue * 10)); // Scale based on load

            schedule.push({
              time: futureTime,
              recommendedReplicas,
              confidence: prediction.confidence,
              pattern: pattern.name
            });
          }
        }
      }

      // Sort by time and remove duplicates (keep highest confidence)
      const uniqueSchedule = schedule
        .sort((a, b) => a.time.getTime() - b.time.getTime())
        .filter((item, index, arr) => {
          if (index === 0) return true;
          const prev = arr[index - 1];
          return item.time.getTime() !== prev.time.getTime() ||
                 item.confidence > prev.confidence;
        });

      return uniqueSchedule;
    } catch (error) {
      this.logger.error(`Failed to get optimal scaling schedule for ${serviceId}`, error);
      return [];
    }
  }

  private async analyzeDailyPattern(metrics: CloudMetrics[], serviceId: string): Promise<WorkloadPattern | null> {
    try {
      // Group metrics by hour of day
      const hourlyStats: Record<number, { loads: number[]; cpu: number[]; memory: number[] }> = {};

      metrics.forEach(metric => {
        const hour = metric.timestamp.getHours();
        if (!hourlyStats[hour]) {
          hourlyStats[hour] = { loads: [], cpu: [], memory: [] };
        }

        // Calculate load as combination of CPU and memory
        const load = (metric.cpuUtilization + metric.memoryUtilization) / 200; // Normalize to 0-1
        hourlyStats[hour].loads.push(load);
        hourlyStats[hour].cpu.push(metric.cpuUtilization);
        hourlyStats[hour].memory.push(metric.memoryUtilization);
      });

      // Calculate averages and variances
      const hourlyAverages: Record<number, { avgLoad: number; variance: number }> = {};

      Object.entries(hourlyStats).forEach(([hour, stats]) => {
        const avgLoad = stats.loads.reduce((a, b) => a + b, 0) / stats.loads.length;
        const variance = this.calculateVariance(stats.loads, avgLoad);
        hourlyAverages[parseInt(hour)] = { avgLoad, variance };
      });

      // Check if there's a clear daily pattern (significant variance)
      const variances = Object.values(hourlyAverages).map(h => h.variance);
      const avgVariance = variances.reduce((a, b) => a + b, 0) / variances.length;

      if (avgVariance < 0.01) { // Low variance = no clear pattern
        return null;
      }

      const loads = Object.values(hourlyAverages).map(h => h.avgLoad);
      const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
      const peakLoad = Math.max(...loads);
      const minLoad = Math.min(...loads);

      return {
        patternId: `${serviceId}-daily`,
        name: 'Daily Traffic Pattern',
        description: 'Recurring daily pattern in resource utilization',
        timeRange: {
          start: metrics[0]?.timestamp || new Date(),
          end: metrics[metrics.length - 1]?.timestamp || new Date()
        },
        metrics: {
          avgLoad,
          peakLoad,
          minLoad,
          loadVariance: avgVariance
        },
        predictions: [], // Will be populated when used for prediction
        confidence: Math.min(0.9, avgVariance * 10) // Higher variance = higher confidence
      };
    } catch (error) {
      this.logger.error('Failed to analyze daily pattern', error);
      return null;
    }
  }

  private async analyzeWeeklyPattern(metrics: CloudMetrics[], serviceId: string): Promise<WorkloadPattern | null> {
    try {
      // Group metrics by day of week
      const weeklyStats: Record<number, { loads: number[] }> = {};

      metrics.forEach(metric => {
        const dayOfWeek = metric.timestamp.getDay(); // 0 = Sunday, 6 = Saturday
        if (!weeklyStats[dayOfWeek]) {
          weeklyStats[dayOfWeek] = { loads: [] };
        }

        const load = (metric.cpuUtilization + metric.memoryUtilization) / 200;
        weeklyStats[dayOfWeek].loads.push(load);
      });

      // Calculate weekly averages
      const weeklyAverages: Record<number, number> = {};
      Object.entries(weeklyStats).forEach(([day, stats]) => {
        weeklyAverages[parseInt(day)] = stats.loads.reduce((a, b) => a + b, 0) / stats.loads.length;
      });

      // Check for weekend vs weekday patterns
      const weekdayLoads = [1, 2, 3, 4, 5].map(day => weeklyAverages[day]).filter(Boolean);
      const weekendLoads = [0, 6].map(day => weeklyAverages[day]).filter(Boolean);

      if (weekdayLoads.length === 0 || weekendLoads.length === 0) {
        return null;
      }

      const avgWeekdayLoad = weekdayLoads.reduce((a, b) => a + b, 0) / weekdayLoads.length;
      const avgWeekendLoad = weekendLoads.reduce((a, b) => a + b, 0) / weekendLoads.length;

      const difference = Math.abs(avgWeekdayLoad - avgWeekendLoad);
      if (difference < 0.1) { // No significant weekly pattern
        return null;
      }

      return {
        patternId: `${serviceId}-weekly`,
        name: 'Weekly Traffic Pattern',
        description: `Different load patterns between weekdays (${avgWeekdayLoad.toFixed(2)}) and weekends (${avgWeekendLoad.toFixed(2)})`,
        timeRange: {
          start: metrics[0]?.timestamp || new Date(),
          end: metrics[metrics.length - 1]?.timestamp || new Date()
        },
        metrics: {
          avgLoad: (avgWeekdayLoad + avgWeekendLoad) / 2,
          peakLoad: Math.max(avgWeekdayLoad, avgWeekendLoad),
          minLoad: Math.min(avgWeekdayLoad, avgWeekendLoad),
          loadVariance: difference
        },
        predictions: [],
        confidence: Math.min(0.85, difference * 5)
      };
    } catch (error) {
      this.logger.error('Failed to analyze weekly pattern', error);
      return null;
    }
  }

  private async analyzeSeasonalPatterns(metrics: CloudMetrics[], serviceId: string): Promise<WorkloadPattern[]> {
    // This would implement more sophisticated seasonal analysis
    // For now, return empty array
    return [];
  }

  private async analyzeSpikePatterns(metrics: CloudMetrics[], serviceId: string): Promise<WorkloadPattern | null> {
    try {
      // Detect sudden spikes in load
      const loads = metrics.map(m => (m.cpuUtilization + m.memoryUtilization) / 200);
      const spikes: { index: number; load: number }[] = [];

      for (let i = 1; i < loads.length - 1; i++) {
        const current = loads[i];
        const prev = loads[i - 1];
        const next = loads[i + 1];

        // Spike detection: current load significantly higher than neighbors
        if (current > prev * 1.5 && current > next * 1.5 && current > 0.7) {
          spikes.push({ index: i, load: current });
        }
      }

      if (spikes.length < 3) { // Need at least 3 spikes to establish a pattern
        return null;
      }

      const avgSpikeLoad = spikes.reduce((sum, spike) => sum + spike.load, 0) / spikes.length;

      return {
        patternId: `${serviceId}-spikes`,
        name: 'Traffic Spike Pattern',
        description: `Recurring sudden spikes in load (avg: ${(avgSpikeLoad * 100).toFixed(1)}%)`,
        timeRange: {
          start: metrics[0]?.timestamp || new Date(),
          end: metrics[metrics.length - 1]?.timestamp || new Date()
        },
        metrics: {
          avgLoad: loads.reduce((a, b) => a + b, 0) / loads.length,
          peakLoad: Math.max(...loads),
          minLoad: Math.min(...loads),
          loadVariance: this.calculateVariance(loads, loads.reduce((a, b) => a + b, 0) / loads.length)
        },
        predictions: [],
        confidence: Math.min(0.8, spikes.length / 10) // More spikes = higher confidence
      };
    } catch (error) {
      this.logger.error('Failed to analyze spike patterns', error);
      return null;
    }
  }

  private async generatePredictionFromPattern(pattern: WorkloadPattern, targetTime: Date): Promise<PredictionResult | null> {
    try {
      if (pattern.patternId.includes('daily')) {
        return this.predictFromDailyPattern(pattern, targetTime);
      } else if (pattern.patternId.includes('weekly')) {
        return this.predictFromWeeklyPattern(pattern, targetTime);
      } else if (pattern.patternId.includes('spikes')) {
        return this.predictFromSpikePattern(pattern, targetTime);
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to generate prediction from pattern', error);
      return null;
    }
  }

  private predictFromDailyPattern(pattern: WorkloadPattern, targetTime: Date): PredictionResult {
    const targetHour = targetTime.getHours();
    // Simple sinusoidal prediction based on daily pattern
    const hourOfDay = (targetHour / 24) * 2 * Math.PI;
    const predictedLoad = pattern.metrics.avgLoad + (pattern.metrics.peakLoad - pattern.metrics.avgLoad) * Math.sin(hourOfDay);

    return {
      predictedValue: Math.max(0, Math.min(1, predictedLoad)),
      confidence: pattern.confidence,
      upperBound: Math.min(1, predictedLoad * 1.2),
      lowerBound: Math.max(0, predictedLoad * 0.8),
      timestamp: targetTime,
      modelVersion: 'pattern-based-v1.0'
    };
  }

  private predictFromWeeklyPattern(pattern: WorkloadPattern, targetTime: Date): PredictionResult {
    const dayOfWeek = targetTime.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const predictedLoad = isWeekend ? pattern.metrics.minLoad : pattern.metrics.peakLoad;

    return {
      predictedValue: predictedLoad,
      confidence: pattern.confidence,
      upperBound: Math.min(1, predictedLoad * 1.1),
      lowerBound: Math.max(0, predictedLoad * 0.9),
      timestamp: targetTime,
      modelVersion: 'pattern-based-v1.0'
    };
  }

  private predictFromSpikePattern(pattern: WorkloadPattern, targetTime: Date): PredictionResult {
    // For spikes, predict normal load unless we detect spike conditions
    return {
      predictedValue: pattern.metrics.avgLoad,
      confidence: pattern.confidence * 0.7, // Lower confidence for spike predictions
      upperBound: pattern.metrics.peakLoad,
      lowerBound: pattern.metrics.minLoad,
      timestamp: targetTime,
      modelVersion: 'pattern-based-v1.0'
    };
  }

  private calculateVariance(values: number[], mean: number): number {
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private trimHistory(): void {
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
    }
  }

  getPatterns(serviceId?: string): WorkloadPattern[] {
    if (serviceId) {
      return Array.from(this.patterns.values())
        .filter(pattern => pattern.patternId.startsWith(`${serviceId}-`));
    }
    return Array.from(this.patterns.values());
  }

  clearPatterns(serviceId?: string): void {
    if (serviceId) {
      const toDelete = Array.from(this.patterns.keys())
        .filter(key => key.startsWith(`${serviceId}-`));
      toDelete.forEach(key => this.patterns.delete(key));
    } else {
      this.patterns.clear();
    }
  }
}