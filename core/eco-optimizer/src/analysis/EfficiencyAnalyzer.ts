import {
  EfficiencyMetrics,
  EfficiencyBenchmark,
  EfficiencyAnalysis,
  EnergyMetrics,
  Logger,
  DataCollectionError
} from '../types';

/**
 * EfficiencyAnalyzer - Analyzes efficiency metrics and compares against benchmarks
 * Provides insights into operational efficiency and areas for improvement
 */
export class EfficiencyAnalyzer {
  private logger: Logger;
  private metricsHistory: EfficiencyMetrics[] = [];

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Calculate efficiency metrics
   */
  async calculateEfficiencyMetrics(energyMetrics: EnergyMetrics[]): Promise<EfficiencyMetrics> {
    try {
      this.logger.info('Calculating efficiency metrics');

      // Calculate average PUE (Power Usage Effectiveness)
      const pue = energyMetrics.length > 0
        ? energyMetrics.reduce((sum, m) => sum + m.efficiency, 0) / energyMetrics.length
        : 1.5;

      // Calculate CUE (Carbon Usage Effectiveness) - kg CO2e per kWh
      const cue = 0.5; // Simplified calculation

      // Calculate WUE (Water Usage Effectiveness) - Liters per kWh
      const wue = 1.8; // Industry average

      // Overall efficiency (0-100%, higher is better)
      const overallEfficiency = Math.max(0, 100 - ((pue - 1) * 50));

      // Energy efficiency
      const energyEfficiency = Math.max(0, 100 - ((pue - 1.1) * 100));

      // Cost efficiency (based on resource utilization)
      const costEfficiency = 75; // Placeholder

      // Carbon efficiency
      const carbonEfficiency = 70; // Placeholder

      const metrics: EfficiencyMetrics = {
        overallEfficiency,
        energyEfficiency,
        costEfficiency,
        carbonEfficiency,
        pue,
        cue,
        wue
      };

      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > 30) {
        this.metricsHistory.shift();
      }

      this.logger.info(`Overall efficiency: ${overallEfficiency.toFixed(1)}%`);
      return metrics;
    } catch (error) {
      this.logger.error('Error calculating efficiency metrics', error);
      throw new DataCollectionError('Failed to calculate efficiency metrics', error);
    }
  }

  /**
   * Generate efficiency benchmarks
   */
  generateBenchmarks(metrics: EfficiencyMetrics): EfficiencyBenchmark[] {
    const benchmarks: EfficiencyBenchmark[] = [
      {
        category: 'Power Usage',
        metric: 'PUE',
        currentValue: metrics.pue,
        industryAverage: 1.58,
        bestInClass: 1.10,
        percentile: this.calculatePercentile(metrics.pue, 1.10, 2.0, true),
        status: this.getStatus(metrics.pue, 1.2, 1.5, 1.8, true)
      },
      {
        category: 'Carbon Usage',
        metric: 'CUE',
        currentValue: metrics.cue,
        industryAverage: 0.6,
        bestInClass: 0.2,
        percentile: this.calculatePercentile(metrics.cue, 0.2, 1.0, true),
        status: this.getStatus(metrics.cue, 0.3, 0.6, 0.8, true)
      },
      {
        category: 'Water Usage',
        metric: 'WUE',
        currentValue: metrics.wue,
        industryAverage: 1.8,
        bestInClass: 0.5,
        percentile: this.calculatePercentile(metrics.wue, 0.5, 3.0, true),
        status: this.getStatus(metrics.wue, 1.0, 1.8, 2.5, true)
      },
      {
        category: 'Overall',
        metric: 'Energy Efficiency',
        currentValue: metrics.energyEfficiency,
        industryAverage: 70,
        bestInClass: 90,
        percentile: this.calculatePercentile(metrics.energyEfficiency, 90, 50, false),
        status: this.getStatus(metrics.energyEfficiency, 85, 70, 60, false)
      },
      {
        category: 'Overall',
        metric: 'Cost Efficiency',
        currentValue: metrics.costEfficiency,
        industryAverage: 65,
        bestInClass: 85,
        percentile: this.calculatePercentile(metrics.costEfficiency, 85, 50, false),
        status: this.getStatus(metrics.costEfficiency, 80, 65, 55, false)
      }
    ];

    return benchmarks;
  }

  /**
   * Analyze efficiency and generate full analysis
   */
  async analyzeEfficiency(energyMetrics: EnergyMetrics[]): Promise<EfficiencyAnalysis> {
    try {
      const metrics = await this.calculateEfficiencyMetrics(energyMetrics);
      const benchmarks = this.generateBenchmarks(metrics);
      const trends = this.calculateTrends();
      const alerts = this.generateAlerts(metrics, benchmarks);

      const analysis: EfficiencyAnalysis = {
        timestamp: new Date(),
        metrics,
        benchmarks,
        trends,
        alerts
      };

      this.logger.info('Efficiency analysis completed');
      return analysis;
    } catch (error) {
      this.logger.error('Error analyzing efficiency', error);
      throw new DataCollectionError('Failed to analyze efficiency', error);
    }
  }

  /**
   * Calculate efficiency trends
   */
  private calculateTrends(): {
    metric: string;
    change: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  }[] {
    if (this.metricsHistory.length < 2) {
      return [];
    }

    const current = this.metricsHistory[this.metricsHistory.length - 1];
    const previous = this.metricsHistory[this.metricsHistory.length - 2];

    const trends = [
      {
        metric: 'Overall Efficiency',
        change: ((current.overallEfficiency - previous.overallEfficiency) / previous.overallEfficiency) * 100,
        trend: 'STABLE' as 'IMPROVING' | 'STABLE' | 'DECLINING'
      },
      {
        metric: 'Energy Efficiency',
        change: ((current.energyEfficiency - previous.energyEfficiency) / previous.energyEfficiency) * 100,
        trend: 'STABLE' as 'IMPROVING' | 'STABLE' | 'DECLINING'
      },
      {
        metric: 'PUE',
        change: ((current.pue - previous.pue) / previous.pue) * 100,
        trend: 'STABLE' as 'IMPROVING' | 'STABLE' | 'DECLINING'
      }
    ];

    // Determine trend direction
    trends.forEach(t => {
      if (t.metric === 'PUE') {
        // Lower PUE is better
        if (t.change < -2) t.trend = 'IMPROVING';
        else if (t.change > 2) t.trend = 'DECLINING';
      } else {
        // Higher is better for other metrics
        if (t.change > 2) t.trend = 'IMPROVING';
        else if (t.change < -2) t.trend = 'DECLINING';
      }
    });

    return trends;
  }

  /**
   * Generate efficiency alerts
   */
  private generateAlerts(
    metrics: EfficiencyMetrics,
    benchmarks: EfficiencyBenchmark[]
  ): {
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    message: string;
    metric: string;
  }[] {
    const alerts: {
      severity: 'CRITICAL' | 'WARNING' | 'INFO';
      message: string;
      metric: string;
    }[] = [];

    // Check PUE
    if (metrics.pue > 1.8) {
      alerts.push({
        severity: 'CRITICAL',
        message: `PUE of ${metrics.pue.toFixed(2)} is significantly above industry average. Immediate optimization recommended.`,
        metric: 'PUE'
      });
    } else if (metrics.pue > 1.5) {
      alerts.push({
        severity: 'WARNING',
        message: `PUE of ${metrics.pue.toFixed(2)} exceeds industry average. Consider optimization measures.`,
        metric: 'PUE'
      });
    }

    // Check overall efficiency
    if (metrics.overallEfficiency < 60) {
      alerts.push({
        severity: 'CRITICAL',
        message: `Overall efficiency at ${metrics.overallEfficiency.toFixed(1)}% is below acceptable levels.`,
        metric: 'Overall Efficiency'
      });
    } else if (metrics.overallEfficiency < 75) {
      alerts.push({
        severity: 'WARNING',
        message: `Overall efficiency at ${metrics.overallEfficiency.toFixed(1)}% has room for improvement.`,
        metric: 'Overall Efficiency'
      });
    }

    // Check benchmarks
    benchmarks.forEach(benchmark => {
      if (benchmark.status === 'POOR') {
        alerts.push({
          severity: 'WARNING',
          message: `${benchmark.metric} performance is below industry standards.`,
          metric: benchmark.metric
        });
      } else if (benchmark.status === 'EXCELLENT') {
        alerts.push({
          severity: 'INFO',
          message: `${benchmark.metric} performance exceeds industry best practices.`,
          metric: benchmark.metric
        });
      }
    });

    return alerts;
  }

  /**
   * Calculate percentile ranking
   */
  private calculatePercentile(
    current: number,
    bestInClass: number,
    worst: number,
    lowerIsBetter: boolean
  ): number {
    if (lowerIsBetter) {
      const range = worst - bestInClass;
      const position = worst - current;
      return Math.max(0, Math.min(100, (position / range) * 100));
    } else {
      const range = bestInClass - worst;
      const position = current - worst;
      return Math.max(0, Math.min(100, (position / range) * 100));
    }
  }

  /**
   * Get efficiency status
   */
  private getStatus(
    value: number,
    excellent: number,
    good: number,
    average: number,
    lowerIsBetter: boolean
  ): 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'BELOW_AVERAGE' | 'POOR' {
    if (lowerIsBetter) {
      if (value <= excellent) return 'EXCELLENT';
      if (value <= good) return 'GOOD';
      if (value <= average) return 'AVERAGE';
      if (value <= average * 1.2) return 'BELOW_AVERAGE';
      return 'POOR';
    } else {
      if (value >= excellent) return 'EXCELLENT';
      if (value >= good) return 'GOOD';
      if (value >= average) return 'AVERAGE';
      if (value >= average * 0.8) return 'BELOW_AVERAGE';
      return 'POOR';
    }
  }

  /**
   * Get efficiency score (0-100)
   */
  getEfficiencyScore(metrics: EfficiencyMetrics): number {
    return metrics.overallEfficiency;
  }

  /**
   * Compare efficiency over time
   */
  compareEfficiency(
    current: EfficiencyMetrics,
    previous: EfficiencyMetrics
  ): {
    improved: boolean;
    change: number;
    details: Record<string, number>;
  } {
    const change = current.overallEfficiency - previous.overallEfficiency;

    return {
      improved: change > 0,
      change,
      details: {
        overall: change,
        energy: current.energyEfficiency - previous.energyEfficiency,
        cost: current.costEfficiency - previous.costEfficiency,
        carbon: current.carbonEfficiency - previous.carbonEfficiency
      }
    };
  }
}