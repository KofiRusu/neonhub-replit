import {
  GeoDistributionConfig,
  CloudRegion,
  CloudMetrics,
  GlobalScalingDecision
} from '../types';
import { GlobalRegionManager } from './GlobalRegionManager';
import * as winston from 'winston';

export class GeoDistributionManager {
  private logger: winston.Logger;
  private globalRegionManager: GlobalRegionManager;
  private geoConfig?: GeoDistributionConfig;
  private latencyMatrix: Map<string, Map<string, number>> = new Map();
  private trafficDistribution: Map<string, number> = new Map();

  constructor(globalRegionManager: GlobalRegionManager) {
    this.globalRegionManager = globalRegionManager;

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'geo-distribution-manager.log' })
      ]
    });
  }

  async configureGeoDistribution(config: GeoDistributionConfig): Promise<void> {
    try {
      this.geoConfig = config;

      // Initialize latency matrix
      await this.buildLatencyMatrix(config.regions);

      // Set initial traffic distribution
      this.trafficDistribution = new Map(
        Object.entries(config.trafficDistribution)
      );

      this.logger.info('Geo-distribution configured', {
        regions: config.regions.length,
        strategy: config.failoverStrategy
      });
    } catch (error) {
      this.logger.error('Failed to configure geo-distribution', error);
      throw error;
    }
  }

  async optimizeTrafficDistribution(userLocation?: { lat: number; lng: number }): Promise<Map<string, number>> {
    try {
      if (!this.geoConfig) {
        throw new Error('Geo-distribution not configured');
      }

      let optimizedDistribution: Map<string, number>;

      if (userLocation) {
        // Latency-based routing
        optimizedDistribution = await this.calculateLatencyBasedDistribution(userLocation);
      } else {
        // Load-based balancing
        optimizedDistribution = await this.calculateLoadBasedDistribution();
      }

      // Apply health checks
      const healthyDistribution = await this.applyHealthChecks(optimizedDistribution);

      // Update traffic distribution
      this.trafficDistribution = healthyDistribution;

      this.logger.info('Traffic distribution optimized', Object.fromEntries(healthyDistribution));
      return healthyDistribution;
    } catch (error) {
      this.logger.error('Failed to optimize traffic distribution', error);
      return this.trafficDistribution;
    }
  }

  async handleRegionalFailure(failedRegion: string): Promise<void> {
    try {
      if (!this.geoConfig) {
        throw new Error('Geo-distribution not configured');
      }

      this.logger.warn(`Handling regional failure: ${failedRegion}`);

      // Redistribute traffic from failed region
      const currentDistribution = new Map(this.trafficDistribution);
      const failedTraffic = currentDistribution.get(failedRegion) || 0;

      if (failedTraffic > 0) {
        // Remove failed region from distribution
        currentDistribution.delete(failedRegion);

        // Redistribute traffic to remaining regions proportionally
        const remainingRegions = Array.from(currentDistribution.keys());
        const totalRemainingTraffic = Array.from(currentDistribution.values()).reduce((a, b) => a + b, 0);

        if (totalRemainingTraffic > 0) {
          const redistributionRatio = failedTraffic / totalRemainingTraffic;

          for (const region of remainingRegions) {
            const currentTraffic = currentDistribution.get(region) || 0;
            const additionalTraffic = currentTraffic * redistributionRatio;
            currentDistribution.set(region, currentTraffic + additionalTraffic);
          }
        }

        // Update distribution
        this.trafficDistribution = currentDistribution;

        // Trigger failover scaling if configured
        if (this.geoConfig.failoverStrategy !== 'active-passive') {
          await this.triggerFailoverScaling(failedRegion);
        }
      }

      this.logger.info(`Regional failure handled for ${failedRegion}`);
    } catch (error) {
      this.logger.error(`Failed to handle regional failure for ${failedRegion}`, error);
      throw error;
    }
  }

  async getOptimalRegionForUser(userLocation: { lat: number; lng: number }): Promise<string> {
    try {
      if (!this.geoConfig) {
        throw new Error('Geo-distribution not configured');
      }

      let optimalRegion = '';
      let lowestLatency = Infinity;

      for (const region of this.geoConfig.regions) {
        const latency = this.calculateLatency(userLocation, {
          lat: region.latitude,
          lng: region.longitude
        });

        if (latency < lowestLatency) {
          lowestLatency = latency;
          optimalRegion = region.name;
        }
      }

      return optimalRegion;
    } catch (error) {
      this.logger.error('Failed to get optimal region for user', error);
      return this.geoConfig?.regions[0]?.name || '';
    }
  }

  async monitorAndAdjustDistribution(): Promise<void> {
    try {
      if (!this.geoConfig) return;

      // Get current metrics for all regions
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 5 * 60 * 1000); // Last 5 minutes
      const metrics = await this.globalRegionManager.getGlobalMetrics(startTime, endTime);

      // Analyze regional performance
      const regionalPerformance = this.analyzeRegionalPerformance(metrics);

      // Adjust distribution based on performance
      const adjustedDistribution = await this.adjustDistributionForPerformance(regionalPerformance);

      // Update if significant changes needed
      if (this.shouldUpdateDistribution(adjustedDistribution)) {
        this.trafficDistribution = adjustedDistribution;
        this.logger.info('Distribution adjusted based on performance', Object.fromEntries(adjustedDistribution));
      }
    } catch (error) {
      this.logger.error('Failed to monitor and adjust distribution', error);
    }
  }

  async predictAndPreScale(): Promise<void> {
    try {
      if (!this.geoConfig) return;

      // Predict future load for each region
      const predictions = await this.predictRegionalLoad();

      // Pre-scale regions expecting high load
      for (const [region, predictedLoad] of predictions.entries()) {
        if (predictedLoad > 0.8) { // High load predicted
          await this.preScaleRegion(region, predictedLoad);
        }
      }
    } catch (error) {
      this.logger.error('Failed to predict and pre-scale', error);
    }
  }

  private async buildLatencyMatrix(regions: CloudRegion[]): Promise<void> {
    for (const fromRegion of regions) {
      const fromLatencies = new Map<string, number>();

      for (const toRegion of regions) {
        if (fromRegion.name !== toRegion.name) {
          const latency = this.calculateLatency(
            { lat: fromRegion.latitude, lng: fromRegion.longitude },
            { lat: toRegion.latitude, lng: toRegion.longitude }
          );
          fromLatencies.set(toRegion.name, latency);
        }
      }

      this.latencyMatrix.set(fromRegion.name, fromLatencies);
    }
  }

  private calculateLatency(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
    // Simplified latency calculation based on geographical distance
    // In reality, this would use actual network latency measurements
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(to.lat - from.lat);
    const dLng = this.toRadians(to.lng - from.lng);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(from.lat)) * Math.cos(this.toRadians(to.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Rough latency estimation: ~1ms per 100km
    return Math.max(10, distance / 100); // Minimum 10ms latency
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private async calculateLatencyBasedDistribution(userLocation: { lat: number; lng: number }): Promise<Map<string, number>> {
    if (!this.geoConfig) return new Map();

    const distribution = new Map<string, number>();
    const latencies: Array<{ region: string; latency: number }> = [];

    for (const region of this.geoConfig.regions) {
      const latency = this.calculateLatency(userLocation, {
        lat: region.latitude,
        lng: region.longitude
      });
      latencies.push({ region: region.name, latency });
    }

    // Sort by latency
    latencies.sort((a, b) => a.latency - b.latency);

    // Distribute traffic based on latency (inverse relationship)
    const totalInverseLatency = latencies.reduce((sum, item) => sum + (1 / item.latency), 0);

    for (const item of latencies) {
      const weight = (1 / item.latency) / totalInverseLatency;
      distribution.set(item.region, weight);
    }

    return distribution;
  }

  private async calculateLoadBasedDistribution(): Promise<Map<string, number>> {
    if (!this.geoConfig) return new Map();

    const distribution = new Map<string, number>();

    // Get current load for each region
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 10 * 60 * 1000); // Last 10 minutes
    const metrics = await this.globalRegionManager.getGlobalMetrics(startTime, endTime);

    const regionalLoad = new Map<string, number>();

    for (const region of this.geoConfig.regions) {
      const regionMetrics = metrics.filter(m => m.region === region.name);
      if (regionMetrics.length > 0) {
        const avgLoad = regionMetrics.reduce((sum, m) => sum + m.cpuUtilization, 0) / regionMetrics.length;
        regionalLoad.set(region.name, avgLoad);
      } else {
        regionalLoad.set(region.name, 0);
      }
    }

    // Distribute traffic inversely to load (lower load = more traffic)
    const loads = Array.from(regionalLoad.values());
    const totalInverseLoad = loads.reduce((sum, load) => sum + Math.max(0.1, 1 - load), 0);

    for (const region of this.geoConfig.regions) {
      const load = regionalLoad.get(region.name) || 0;
      const inverseLoad = Math.max(0.1, 1 - load);
      const weight = inverseLoad / totalInverseLoad;
      distribution.set(region.name, weight);
    }

    return distribution;
  }

  private async applyHealthChecks(distribution: Map<string, number>): Promise<Map<string, number>> {
    if (!this.geoConfig) return distribution;

    const healthyDistribution = new Map<string, number>();

    for (const [region, weight] of distribution.entries()) {
      // Simple health check - in reality would check actual service health
      const isHealthy = await this.checkRegionHealth(region);
      if (isHealthy) {
        healthyDistribution.set(region, weight);
      }
    }

    // Renormalize if some regions are unhealthy
    const totalWeight = Array.from(healthyDistribution.values()).reduce((a, b) => a + b, 0);
    if (totalWeight > 0) {
      for (const [region, weight] of healthyDistribution.entries()) {
        healthyDistribution.set(region, weight / totalWeight);
      }
    }

    return healthyDistribution;
  }

  private async checkRegionHealth(region: string): Promise<boolean> {
    try {
      // Get recent metrics for the region
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 5 * 60 * 1000);
      const metrics = await this.globalRegionManager.getGlobalMetrics(startTime, endTime);

      const regionMetrics = metrics.filter(m => m.region === region);
      if (regionMetrics.length === 0) return false;

      // Check if region has acceptable error rates and latency
      const avgErrorRate = regionMetrics.reduce((sum, m) => sum + m.errorRate, 0) / regionMetrics.length;
      const avgLatency = regionMetrics.reduce((sum, m) => sum + m.latency, 0) / regionMetrics.length;

      return avgErrorRate < 0.05 && avgLatency < 1000; // Less than 5% errors and 1000ms latency
    } catch (error) {
      this.logger.error(`Failed to check health for region ${region}`, error);
      return false;
    }
  }

  private analyzeRegionalPerformance(metrics: CloudMetrics[]): Map<string, { load: number; latency: number; errors: number }> {
    const performance = new Map<string, { load: number; latency: number; errors: number }>();

    const regionGroups = new Map<string, CloudMetrics[]>();
    metrics.forEach(metric => {
      if (!regionGroups.has(metric.region)) {
        regionGroups.set(metric.region, []);
      }
      regionGroups.get(metric.region)!.push(metric);
    });

    for (const [region, regionMetrics] of regionGroups.entries()) {
      const avgLoad = regionMetrics.reduce((sum, m) => sum + m.cpuUtilization, 0) / regionMetrics.length;
      const avgLatency = regionMetrics.reduce((sum, m) => sum + m.latency, 0) / regionMetrics.length;
      const avgErrors = regionMetrics.reduce((sum, m) => sum + m.errorRate, 0) / regionMetrics.length;

      performance.set(region, {
        load: avgLoad,
        latency: avgLatency,
        errors: avgErrors
      });
    }

    return performance;
  }

  private async adjustDistributionForPerformance(regionalPerformance: Map<string, { load: number; latency: number; errors: number }>): Promise<Map<string, number>> {
    const adjustedDistribution = new Map(this.trafficDistribution);

    for (const [region, performance] of regionalPerformance.entries()) {
      let adjustmentFactor = 1;

      // Reduce traffic if high load, latency, or errors
      if (performance.load > 0.8) adjustmentFactor *= 0.8;
      if (performance.latency > 500) adjustmentFactor *= 0.9;
      if (performance.errors > 0.03) adjustmentFactor *= 0.7;

      // Increase traffic if performing well
      if (performance.load < 0.3 && performance.latency < 200 && performance.errors < 0.01) {
        adjustmentFactor *= 1.2;
      }

      const currentWeight = adjustedDistribution.get(region) || 0;
      adjustedDistribution.set(region, Math.max(0, currentWeight * adjustmentFactor));
    }

    // Renormalize
    const totalWeight = Array.from(adjustedDistribution.values()).reduce((a, b) => a + b, 0);
    if (totalWeight > 0) {
      for (const [region, weight] of adjustedDistribution.entries()) {
        adjustedDistribution.set(region, weight / totalWeight);
      }
    }

    return adjustedDistribution;
  }

  private shouldUpdateDistribution(newDistribution: Map<string, number>): boolean {
    const threshold = 0.1; // 10% change threshold

    for (const [region, newWeight] of newDistribution.entries()) {
      const currentWeight = this.trafficDistribution.get(region) || 0;
      const change = Math.abs(newWeight - currentWeight);

      if (change > threshold) {
        return true;
      }
    }

    return false;
  }

  private async predictRegionalLoad(): Promise<Map<string, number>> {
    // Simple prediction based on current trends
    // In reality, this would use more sophisticated ML models
    const predictions = new Map<string, number>();

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // Last hour
    const metrics = await this.globalRegionManager.getGlobalMetrics(startTime, endTime);

    const regionGroups = new Map<string, CloudMetrics[]>();
    metrics.forEach(metric => {
      if (!regionGroups.has(metric.region)) {
        regionGroups.set(metric.region, []);
      }
      regionGroups.get(metric.region)!.push(metric);
    });

    for (const [region, regionMetrics] of regionGroups.entries()) {
      if (regionMetrics.length >= 2) {
        // Simple linear trend prediction
        const recent = regionMetrics.slice(-10); // Last 10 metrics
        const trend = this.calculateTrend(recent.map(m => m.cpuUtilization));
        const currentAvg = recent.reduce((sum, m) => sum + m.cpuUtilization, 0) / recent.length;
        const predicted = Math.max(0, Math.min(1, currentAvg + trend));

        predictions.set(region, predicted);
      }
    }

    return predictions;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private async preScaleRegion(region: string, predictedLoad: number): Promise<void> {
    try {
      // Calculate required replicas based on predicted load
      const requiredReplicas = Math.max(1, Math.ceil(predictedLoad * 10));

      this.logger.info(`Pre-scaling region ${region} to ${requiredReplicas} replicas for predicted load ${predictedLoad}`);

      // This would trigger actual scaling through the unified API
      // For now, just log the intent
    } catch (error) {
      this.logger.error(`Failed to pre-scale region ${region}`, error);
    }
  }

  private async triggerFailoverScaling(failedRegion: string): Promise<void> {
    // This would integrate with the GlobalRegionManager to trigger failover
    this.logger.info(`Triggering failover scaling away from ${failedRegion}`);
  }

  getCurrentDistribution(): Map<string, number> {
    return new Map(this.trafficDistribution);
  }

  getGeoConfig(): GeoDistributionConfig | undefined {
    return this.geoConfig;
  }
}