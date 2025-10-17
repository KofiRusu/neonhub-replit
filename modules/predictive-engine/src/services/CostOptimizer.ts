import {
  CloudProvider,
  CostOptimization,
  GlobalScalingDecision,
  ScalingDecision
} from '../types';
import { AWSIntegration } from './AWSIntegration';
import { GCPIntegration } from './GCPIntegration';
import { AzureIntegration } from './AzureIntegration';
import * as winston from 'winston';

export class CostOptimizer {
  private logger: winston.Logger;
  private awsIntegration?: AWSIntegration;
  private gcpIntegration?: GCPIntegration;
  private azureIntegration?: AzureIntegration;
  private costHistory: Map<string, number[]> = new Map();
  private spotInstanceCache: Map<string, CostOptimization[]> = new Map();

  constructor(
    awsIntegration?: AWSIntegration,
    gcpIntegration?: GCPIntegration,
    azureIntegration?: AzureIntegration
  ) {
    this.awsIntegration = awsIntegration;
    this.gcpIntegration = gcpIntegration;
    this.azureIntegration = azureIntegration;

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'cost-optimizer.log' })
      ]
    });
  }

  async optimizeScalingDecision(decision: GlobalScalingDecision): Promise<GlobalScalingDecision> {
    try {
      const costOptimizedDecision = { ...decision };

      // Get spot instance pricing for the target region
      const spotPrices = await this.getSpotPrices(decision.provider, decision.region);

      if (spotPrices.length > 0) {
        // Calculate cost savings potential
        const bestSpotOption = spotPrices.reduce((best, current) =>
          current.savingsPercentage > best.savingsPercentage ? current : best
        );

        // If savings are significant (>20%), consider using spot instances
        if (bestSpotOption.savingsPercentage > 20) {
          costOptimizedDecision.costOptimized = true;
          this.logger.info(`Cost optimization opportunity: ${bestSpotOption.savingsPercentage.toFixed(1)}% savings with ${bestSpotOption.instanceType}`);
        }
      }

      // Adjust target replicas based on cost constraints
      costOptimizedDecision.targetReplicas = await this.optimizeReplicaCount(decision);

      return costOptimizedDecision;
    } catch (error) {
      this.logger.error('Failed to optimize scaling decision', error);
      return decision; // Return original decision if optimization fails
    }
  }

  async getSpotPrices(provider: CloudProvider, region: string): Promise<CostOptimization[]> {
    const cacheKey = `${provider}-${region}`;

    // Check cache first (cache for 1 hour)
    const cached = this.spotInstanceCache.get(cacheKey);
    if (cached && this.isCacheValid(cacheKey)) {
      return cached;
    }

    try {
      let spotPrices: CostOptimization[] = [];

      switch (provider) {
        case 'aws':
          if (this.awsIntegration) {
            const instanceTypes = ['t3.medium', 't3.large', 'm5.large', 'c5.large'];
            spotPrices = await this.awsIntegration.getSpotInstancePrices(instanceTypes);
          }
          break;

        case 'gcp':
          if (this.gcpIntegration) {
            const instanceTypes = ['n1-standard-1', 'n1-standard-2', 'n1-highmem-2'];
            spotPrices = await this.gcpIntegration.getSpotInstancePrices(instanceTypes);
          }
          break;

        case 'azure':
          if (this.azureIntegration) {
            const vmSizes = ['Standard_DS1_v2', 'Standard_DS2_v2', 'Standard_F2s_v2'];
            spotPrices = await this.azureIntegration.getSpotInstancePrices(vmSizes);
          }
          break;
      }

      // Cache the results
      this.spotInstanceCache.set(cacheKey, spotPrices);
      this.updateCacheTimestamp(cacheKey);

      return spotPrices;
    } catch (error) {
      this.logger.error(`Failed to get spot prices for ${provider}/${region}`, error);
      return [];
    }
  }

  async optimizeReplicaCount(decision: GlobalScalingDecision): Promise<number> {
    try {
      // Get current cost trends
      const currentCosts = await this.getCurrentCosts(decision.provider, decision.region);

      // Calculate cost per replica
      const costPerReplica = currentCosts / Math.max(decision.targetReplicas, 1);

      // If costs are high, consider reducing replicas slightly
      if (costPerReplica > this.getCostThreshold(decision.provider) && decision.targetReplicas > 1) {
        const optimizedReplicas = Math.max(1, decision.targetReplicas - 1);
        this.logger.info(`Cost optimization: Reducing replicas from ${decision.targetReplicas} to ${optimizedReplicas} due to high costs`);
        return optimizedReplicas;
      }

      // If costs are low and we have spot instances available, consider increasing
      const spotPrices = await this.getSpotPrices(decision.provider, decision.region);
      const goodSpotDeals = spotPrices.filter(spot => spot.savingsPercentage > 30);

      if (goodSpotDeals.length > 0 && decision.targetReplicas < 10) {
        const optimizedReplicas = decision.targetReplicas + 1;
        this.logger.info(`Cost optimization: Increasing replicas to ${optimizedReplicas} due to spot instance availability`);
        return optimizedReplicas;
      }

      return decision.targetReplicas;
    } catch (error) {
      this.logger.error('Failed to optimize replica count', error);
      return decision.targetReplicas;
    }
  }

  async monitorAndAdjustCosts(): Promise<void> {
    try {
      // Get costs across all providers and regions
      const allCosts = await this.getAllProviderCosts();

      // Identify cost anomalies
      const anomalies = this.detectCostAnomalies(allCosts);

      if (anomalies.length > 0) {
        this.logger.warn('Cost anomalies detected', { anomalies });

        // Take corrective actions
        for (const anomaly of anomalies) {
          await this.handleCostAnomaly(anomaly);
        }
      }

      // Update cost history
      this.updateCostHistory(allCosts);

    } catch (error) {
      this.logger.error('Failed to monitor and adjust costs', error);
    }
  }

  async getCostBreakdown(provider: CloudProvider, region: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      // This would integrate with each provider's cost management APIs
      // For now, return mock data structure
      return {
        provider,
        region,
        period: { start: startDate, end: endDate },
        breakdown: {
          compute: 0,
          storage: 0,
          network: 0,
          other: 0
        },
        total: 0,
        trend: 'stable'
      };
    } catch (error) {
      this.logger.error('Failed to get cost breakdown', error);
      throw error;
    }
  }

  async recommendInstanceTypes(provider: CloudProvider, workload: 'cpu' | 'memory' | 'balanced'): Promise<string[]> {
    try {
      const recommendations: Record<CloudProvider, Record<string, string[]>> = {
        aws: {
          cpu: ['c5.large', 'c5.xlarge'],
          memory: ['r5.large', 'r5.xlarge'],
          balanced: ['m5.large', 'm5.xlarge']
        },
        gcp: {
          cpu: ['n1-highcpu-2', 'n1-highcpu-4'],
          memory: ['n1-highmem-2', 'n1-highmem-4'],
          balanced: ['n1-standard-1', 'n1-standard-2']
        },
        azure: {
          cpu: ['Standard_F2s_v2', 'Standard_F4s_v2'],
          memory: ['Standard_E2s_v3', 'Standard_E4s_v3'],
          balanced: ['Standard_DS2_v2', 'Standard_DS3_v2']
        }
      };

      return recommendations[provider]?.[workload] || [];
    } catch (error) {
      this.logger.error('Failed to recommend instance types', error);
      return [];
    }
  }

  private async getCurrentCosts(provider: CloudProvider, region: string): Promise<number> {
    // Mock implementation - would integrate with actual cost APIs
    const baseCosts: Record<string, number> = {
      'aws-us-east-1': 150,
      'gcp-us-central1': 120,
      'azure-eastus': 140
    };

    return baseCosts[`${provider}-${region}`] || 100;
  }

  private getCostThreshold(provider: CloudProvider): number {
    const thresholds: Record<CloudProvider, number> = {
      aws: 200,
      gcp: 180,
      azure: 190
    };
    return thresholds[provider] || 150;
  }

  private async getAllProviderCosts(): Promise<Array<{ provider: CloudProvider; region: string; cost: number }>> {
    const costs: Array<{ provider: CloudProvider; region: string; cost: number }> = [];

    if (this.awsIntegration) {
      costs.push({ provider: 'aws' as CloudProvider, region: 'us-east-1', cost: await this.getCurrentCosts('aws', 'us-east-1') });
    }
    if (this.gcpIntegration) {
      costs.push({ provider: 'gcp' as CloudProvider, region: 'us-central1', cost: await this.getCurrentCosts('gcp', 'us-central1') });
    }
    if (this.azureIntegration) {
      costs.push({ provider: 'azure' as CloudProvider, region: 'eastus', cost: await this.getCurrentCosts('azure', 'eastus') });
    }

    return costs;
  }

  private detectCostAnomalies(costs: Array<{ provider: CloudProvider; region: string; cost: number }>): any[] {
    const anomalies = [];

    for (const cost of costs) {
      const history = this.costHistory.get(`${cost.provider}-${cost.region}`) || [];
      if (history.length > 5) {
        const avgCost = history.reduce((a, b) => a + b, 0) / history.length;
        const threshold = avgCost * 1.5; // 50% increase threshold

        if (cost.cost > threshold) {
          anomalies.push({
            provider: cost.provider,
            region: cost.region,
            currentCost: cost.cost,
            averageCost: avgCost,
            deviation: ((cost.cost - avgCost) / avgCost) * 100
          });
        }
      }
    }

    return anomalies;
  }

  private async handleCostAnomaly(anomaly: any): Promise<void> {
    // Implement cost anomaly handling logic
    // This could involve scaling down, switching to spot instances, etc.
    this.logger.info('Handling cost anomaly', anomaly);

    // Example: If costs are too high, recommend switching to spot instances
    if (anomaly.deviation > 50) {
      const spotPrices = await this.getSpotPrices(anomaly.provider, anomaly.region);
      if (spotPrices.some(spot => spot.savingsPercentage > 30)) {
        this.logger.info(`Recommending spot instances for ${anomaly.provider}/${anomaly.region} due to high costs`);
      }
    }
  }

  private updateCostHistory(costs: Array<{ provider: CloudProvider; region: string; cost: number }>): void {
    for (const cost of costs) {
      const key = `${cost.provider}-${cost.region}`;
      const history = this.costHistory.get(key) || [];
      history.push(cost.cost);

      // Keep only last 24 hours of data (assuming hourly updates)
      if (history.length > 24) {
        history.shift();
      }

      this.costHistory.set(key, history);
    }
  }

  private isCacheValid(cacheKey: string): boolean {
    // Simple cache validity check - would need proper timestamp tracking
    return this.spotInstanceCache.has(cacheKey);
  }

  private updateCacheTimestamp(cacheKey: string): void {
    // In a real implementation, store timestamps for cache invalidation
  }
}