import {
  CloudProvider,
  GlobalScalingDecision,
  ScalingDecision,
  PerformanceMetrics,
  WorkloadPattern,
  GeoDistributionConfig
} from '../types';
import { GlobalRegionManager } from './GlobalRegionManager';
import { CostOptimizer } from './CostOptimizer';
import { PredictiveEngine } from '../core/PredictiveEngine';
import * as winston from 'winston';

export class UnifiedScalingAPI {
  private logger: winston.Logger;
  private globalRegionManager: GlobalRegionManager;
  private costOptimizer: CostOptimizer;
  private predictiveEngine: PredictiveEngine;
  private workloadPatterns: Map<string, WorkloadPattern> = new Map();

  constructor(
    globalRegionManager: GlobalRegionManager,
    costOptimizer: CostOptimizer,
    predictiveEngine: PredictiveEngine
  ) {
    this.globalRegionManager = globalRegionManager;
    this.costOptimizer = costOptimizer;
    this.predictiveEngine = predictiveEngine;

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'unified-scaling-api.log' })
      ]
    });
  }

  async scaleAcrossProviders(
    provider: CloudProvider,
    region: string,
    serviceId: string,
    targetReplicas: number,
    options?: {
      costOptimized?: boolean;
      geoDistributed?: boolean;
      failoverRegions?: string[];
    }
  ): Promise<GlobalScalingDecision> {
    try {
      // Create base scaling decision
      const baseDecision: GlobalScalingDecision = {
        action: targetReplicas > 1 ? 'scale_up' : targetReplicas < 1 ? 'scale_down' : 'no_action',
        targetReplicas: Math.max(0, targetReplicas),
        reason: `Manual scaling request for ${serviceId}`,
        confidence: 0.9,
        predictedLoad: 0.5,
        provider,
        region,
        serviceId,
        costOptimized: options?.costOptimized || false,
        geoDistributed: options?.geoDistributed || false,
        failoverRegions: options?.failoverRegions
      };

      // Apply cost optimization
      const costOptimizedDecision = await this.costOptimizer.optimizeScalingDecision(baseDecision);

      // Execute the scaling
      await this.globalRegionManager.executeGlobalScaling(costOptimizedDecision);

      this.logger.info(`Unified scaling executed: ${provider}/${region}/${serviceId} -> ${costOptimizedDecision.targetReplicas} replicas`);

      return costOptimizedDecision;
    } catch (error) {
      this.logger.error('Failed to execute unified scaling', error);
      throw error;
    }
  }

  async predictiveScaleAcrossProviders(currentMetrics: PerformanceMetrics): Promise<GlobalScalingDecision[]> {
    try {
      const decisions: GlobalScalingDecision[] = [];

      // Get available services across all providers
      const services = await this.globalRegionManager.discoverServices();

      for (const service of services) {
        // Get predictive scaling decision for this service
        const predictiveDecision = await this.predictiveEngine.makeScalingDecision(currentMetrics);

        // Apply workload pattern analysis
        const patternAdjustedDecision = await this.applyWorkloadPatterns(service.id, predictiveDecision);

        // Create global scaling decision
        const globalDecision: GlobalScalingDecision = {
          ...patternAdjustedDecision,
          provider: this.extractProviderFromServiceId(service.id),
          region: service.region,
          serviceId: service.id,
          costOptimized: true, // Enable cost optimization by default
          geoDistributed: false // Can be enabled based on configuration
        };

        // Apply cost optimization
        const costOptimizedDecision = await this.costOptimizer.optimizeScalingDecision(globalDecision);

        decisions.push(costOptimizedDecision);
      }

      // Execute all decisions
      for (const decision of decisions) {
        try {
          await this.globalRegionManager.executeGlobalScaling(decision);
        } catch (error) {
          this.logger.error(`Failed to execute scaling for ${decision.serviceId}`, error);
        }
      }

      this.logger.info(`Predictive scaling executed for ${decisions.length} services`);
      return decisions;
    } catch (error) {
      this.logger.error('Failed to execute predictive scaling across providers', error);
      throw error;
    }
  }

  async setupGeoDistribution(config: GeoDistributionConfig): Promise<void> {
    try {
      await this.globalRegionManager.optimizeGeoDistribution(config);
      this.logger.info('Geo-distribution configured', { regions: config.regions.length });
    } catch (error) {
      this.logger.error('Failed to setup geo-distribution', error);
      throw error;
    }
  }

  async addWorkloadPattern(pattern: WorkloadPattern): Promise<void> {
    try {
      this.workloadPatterns.set(pattern.patternId, pattern);
      this.logger.info(`Workload pattern added: ${pattern.name}`);
    } catch (error) {
      this.logger.error('Failed to add workload pattern', error);
      throw error;
    }
  }

  async getScalingRecommendations(
    provider?: CloudProvider,
    region?: string
  ): Promise<GlobalScalingDecision[]> {
    try {
      const recommendations: GlobalScalingDecision[] = [];

      // Get current metrics
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

      const metrics = await this.globalRegionManager.getGlobalMetrics(startTime, endTime);

      // Analyze metrics and generate recommendations
      const services = await this.globalRegionManager.discoverServices();
      const filteredServices = services.filter(service => {
        if (provider && this.extractProviderFromServiceId(service.id) !== provider) return false;
        if (region && service.region !== region) return false;
        return true;
      });

      for (const service of filteredServices) {
        const serviceMetrics = metrics.filter(m => m.serviceId === service.id);

        if (serviceMetrics.length > 0) {
          // Calculate average utilization
          const avgCPU = serviceMetrics.reduce((sum, m) => sum + m.cpuUtilization, 0) / serviceMetrics.length;
          const avgMemory = serviceMetrics.reduce((sum, m) => sum + m.memoryUtilization, 0) / serviceMetrics.length;

          // Generate recommendation based on utilization
          let recommendation: GlobalScalingDecision | null = null;

          if (avgCPU > 80 || avgMemory > 85) {
            recommendation = {
              action: 'scale_up',
              targetReplicas: service.replicas ? service.replicas + 1 : 2,
              reason: `High utilization detected: CPU ${avgCPU.toFixed(1)}%, Memory ${avgMemory.toFixed(1)}%`,
              confidence: 0.8,
              predictedLoad: Math.max(avgCPU, avgMemory) / 100,
              provider: this.extractProviderFromServiceId(service.id),
              region: service.region,
              serviceId: service.id,
              costOptimized: true,
              geoDistributed: false
            };
          } else if (avgCPU < 30 && avgMemory < 40 && (service.replicas || 0) > 1) {
            recommendation = {
              action: 'scale_down',
              targetReplicas: Math.max(1, (service.replicas || 1) - 1),
              reason: `Low utilization detected: CPU ${avgCPU.toFixed(1)}%, Memory ${avgMemory.toFixed(1)}%`,
              confidence: 0.7,
              predictedLoad: Math.max(avgCPU, avgMemory) / 100,
              provider: this.extractProviderFromServiceId(service.id),
              region: service.region,
              serviceId: service.id,
              costOptimized: true,
              geoDistributed: false
            };
          }

          if (recommendation) {
            recommendations.push(recommendation);
          }
        }
      }

      this.logger.info(`Generated ${recommendations.length} scaling recommendations`);
      return recommendations;
    } catch (error) {
      this.logger.error('Failed to get scaling recommendations', error);
      throw error;
    }
  }

  async executeFailover(primaryRegion: string, serviceId: string): Promise<void> {
    try {
      // Create a mock decision for failover (scale down primary, scale up secondary)
      const mockDecision: GlobalScalingDecision = {
        action: 'scale_up',
        targetReplicas: 1,
        reason: `Failover from ${primaryRegion}`,
        confidence: 0.9,
        predictedLoad: 0.8,
        provider: this.extractProviderFromServiceId(serviceId),
        region: primaryRegion,
        serviceId,
        costOptimized: false,
        geoDistributed: false,
        failoverRegions: ['us-west-2', 'eu-west-1'] // Default failover regions
      };

      await this.globalRegionManager.handleFailover(primaryRegion, mockDecision);
      this.logger.info(`Failover executed for ${serviceId} from ${primaryRegion}`);
    } catch (error) {
      this.logger.error('Failed to execute failover', error);
      throw error;
    }
  }

  async getGlobalHealthStatus(): Promise<{
    providers: Record<CloudProvider, boolean>;
    regions: Record<string, boolean>;
    services: Record<string, boolean>;
    overall: boolean;
  }> {
    try {
      const services = await this.globalRegionManager.discoverServices();
      const regions = this.globalRegionManager.getAvailableRegions();

      const status = {
        providers: {
          aws: services.some(s => this.extractProviderFromServiceId(s.id) === 'aws'),
          gcp: services.some(s => this.extractProviderFromServiceId(s.id) === 'gcp'),
          azure: services.some(s => this.extractProviderFromServiceId(s.id) === 'azure')
        },
        regions: regions.reduce((acc, region) => {
          acc[region.name] = true; // Assume healthy if discovered
          return acc;
        }, {} as Record<string, boolean>),
        services: services.reduce((acc, service) => {
          acc[service.id] = service.status === 'running';
          return acc;
        }, {} as Record<string, boolean>),
        overall: services.length > 0 && regions.length > 0
      };

      return status;
    } catch (error) {
      this.logger.error('Failed to get global health status', error);
      return {
        providers: { aws: false, gcp: false, azure: false },
        regions: {},
        services: {},
        overall: false
      };
    }
  }

  private async applyWorkloadPatterns(serviceId: string, decision: ScalingDecision): Promise<ScalingDecision> {
    const pattern = this.workloadPatterns.get(serviceId);
    if (!pattern) return decision;

    // Adjust decision based on workload pattern
    const now = new Date();
    const currentHour = now.getHours();

    // Simple pattern matching - in reality this would be more sophisticated
    if (pattern.name.includes('peak-hours') && (currentHour >= 9 && currentHour <= 17)) {
      // Business hours - increase scaling
      return {
        ...decision,
        targetReplicas: Math.ceil(decision.targetReplicas * 1.5),
        reason: `${decision.reason} (adjusted for peak hours pattern)`
      };
    }

    return decision;
  }

  private extractProviderFromServiceId(serviceId: string): CloudProvider {
    if (serviceId.startsWith('aws-') || serviceId.includes('amazonaws.com')) return 'aws';
    if (serviceId.startsWith('gcp-') || serviceId.includes('googleapis.com')) return 'gcp';
    if (serviceId.startsWith('azure-') || serviceId.includes('azure.com')) return 'azure';
    return 'aws'; // Default fallback
  }
}