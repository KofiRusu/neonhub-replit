import {
  ResourceUtilization,
  OptimizationRecommendation,
  OptimizationResult,
  CloudProvider,
  ResourceType,
  Logger,
  OptimizationError
} from '../types';

/**
 * ResourceOptimizer - Analyzes resource utilization and generates optimization recommendations
 * Provides actionable insights to reduce energy consumption and costs
 */
export class ResourceOptimizer {
  private logger: Logger;
  private utilizationData: Map<string, ResourceUtilization[]> = new Map();
  private readonly UNDERUTILIZED_THRESHOLD = 30; // %
  private readonly IDLE_THRESHOLD = 10; // %

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Analyze resource utilization and generate recommendations
   */
  async analyzeAndOptimize(
    resources: ResourceUtilization[],
    optimizationThreshold: number = 50
  ): Promise<OptimizationResult> {
    try {
      this.logger.info(`Analyzing ${resources.length} resources for optimization`);

      // Store utilization data
      const key = new Date().toISOString();
      this.utilizationData.set(key, resources);

      const recommendations: OptimizationRecommendation[] = [];

      // Identify underutilized resources
      const underutilized = this.identifyUnderutilizedResources(resources);
      recommendations.push(...this.generateRightsizingRecommendations(underutilized));

      // Identify idle resources
      const idle = this.identifyIdleResources(resources);
      recommendations.push(...this.generateShutdownRecommendations(idle));

      // Identify consolidation opportunities
      const consolidation = this.identifyConsolidationOpportunities(resources);
      recommendations.push(...consolidation);

      // Identify migration opportunities (to greener regions)
      const migration = this.identifyMigrationOpportunities(resources);
      recommendations.push(...migration);

      // Identify scheduling opportunities
      const scheduling = this.identifySchedulingOpportunities(resources);
      recommendations.push(...scheduling);

      // Filter by threshold
      const filteredRecommendations = recommendations.filter(rec => {
        const totalSavings = rec.estimatedSavings.energy + 
                           (rec.estimatedSavings.cost * 0.1) + 
                           (rec.estimatedSavings.carbon * 0.01);
        return totalSavings >= optimizationThreshold;
      });

      // Sort by priority and savings
      filteredRecommendations.sort((a, b) => {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.estimatedSavings.energy - a.estimatedSavings.energy;
      });

      // Calculate total potential savings
      const totalSavings = this.calculateTotalSavings(filteredRecommendations);

      // Create implementation roadmap
      const roadmap = this.createImplementationRoadmap(filteredRecommendations);

      const result: OptimizationResult = {
        recommendations: filteredRecommendations,
        totalPotentialSavings: totalSavings,
        implementationRoadmap: roadmap
      };

      this.logger.info(`Generated ${filteredRecommendations.length} optimization recommendations`);
      this.logger.info(`Total potential savings: ${totalSavings.energy.toFixed(2)} kWh, ` +
                      `$${totalSavings.cost.toFixed(2)}, ${totalSavings.carbon.toFixed(2)} kg CO2e`);

      return result;
    } catch (error) {
      this.logger.error('Error during optimization analysis', error);
      throw new OptimizationError('Failed to analyze and optimize resources', error);
    }
  }

  /**
   * Identify underutilized resources
   */
  private identifyUnderutilizedResources(resources: ResourceUtilization[]): ResourceUtilization[] {
    return resources.filter(r => 
      r.averageUtilization < this.UNDERUTILIZED_THRESHOLD &&
      r.averageUtilization >= this.IDLE_THRESHOLD
    );
  }

  /**
   * Identify idle resources
   */
  private identifyIdleResources(resources: ResourceUtilization[]): ResourceUtilization[] {
    return resources.filter(r => r.averageUtilization < this.IDLE_THRESHOLD);
  }

  /**
   * Generate rightsizing recommendations
   */
  private generateRightsizingRecommendations(
    underutilized: ResourceUtilization[]
  ): OptimizationRecommendation[] {
    return underutilized.map(resource => {
      const utilizationRatio = resource.averageUtilization / 100;
      const energySavings = (1 - utilizationRatio) * 50; // Estimated kWh savings
      const costSavings = (1 - utilizationRatio) * resource.cost * 0.3;
      const carbonSavings = energySavings * 0.5; // Rough CO2e estimate

      return {
        id: `rightsize-${resource.resourceId}`,
        priority: resource.averageUtilization < 20 ? 'HIGH' : 'MEDIUM',
        category: 'RIGHTSIZING',
        resourceId: resource.resourceId,
        currentState: `${resource.resourceType} with ${resource.averageUtilization.toFixed(1)}% utilization`,
        recommendedState: `Downsize to match ${(resource.averageUtilization * 1.2).toFixed(1)}% target capacity`,
        estimatedSavings: {
          energy: energySavings,
          cost: costSavings,
          carbon: carbonSavings
        },
        implementationEffort: 'MEDIUM',
        description: `Resource is underutilized at ${resource.averageUtilization.toFixed(1)}%. ` +
                    `Rightsizing can reduce energy consumption and costs while maintaining performance.`,
        actionItems: [
          'Analyze workload patterns over extended period',
          'Test performance with smaller instance size',
          'Create snapshot/backup before resizing',
          'Schedule resize during maintenance window',
          'Monitor performance after resize'
        ]
      };
    });
  }

  /**
   * Generate shutdown recommendations for idle resources
   */
  private generateShutdownRecommendations(
    idle: ResourceUtilization[]
  ): OptimizationRecommendation[] {
    return idle.map(resource => {
      const energySavings = 100; // Full resource energy savings
      const costSavings = resource.cost * 0.9; // Save 90% of cost
      const carbonSavings = energySavings * 0.5;

      return {
        id: `shutdown-${resource.resourceId}`,
        priority: 'HIGH',
        category: 'SHUTDOWN',
        resourceId: resource.resourceId,
        currentState: `${resource.resourceType} running with ${resource.averageUtilization.toFixed(1)}% utilization`,
        recommendedState: 'Terminate or stop resource',
        estimatedSavings: {
          energy: energySavings,
          cost: costSavings,
          carbon: carbonSavings
        },
        implementationEffort: 'LOW',
        description: `Resource is idle (${resource.averageUtilization.toFixed(1)}% utilization). ` +
                    `Consider terminating if not needed or implementing auto-shutdown.`,
        actionItems: [
          'Verify resource is not needed',
          'Check for dependencies',
          'Create final backup if needed',
          'Terminate or stop resource',
          'Set up auto-shutdown policy for similar resources'
        ]
      };
    });
  }

  /**
   * Identify consolidation opportunities
   */
  private identifyConsolidationOpportunities(
    resources: ResourceUtilization[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Group resources by provider and region
    const groups = new Map<string, ResourceUtilization[]>();
    
    resources.forEach(resource => {
      const key = `${resource.provider}-${resource.region}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(resource);
    });

    // Look for consolidation opportunities within each group
    groups.forEach((groupResources, key) => {
      if (groupResources.length >= 3) {
        const totalUtilization = groupResources.reduce((sum, r) => sum + r.averageUtilization, 0);
        const avgUtilization = totalUtilization / groupResources.length;

        if (avgUtilization < 40) {
          recommendations.push({
            id: `consolidate-${key}`,
            priority: 'MEDIUM',
            category: 'CONSOLIDATION',
            resourceId: groupResources.map(r => r.resourceId).join(','),
            currentState: `${groupResources.length} resources in ${key}`,
            recommendedState: `Consolidate into ${Math.ceil(groupResources.length * 0.6)} resources`,
            estimatedSavings: {
              energy: groupResources.length * 30,
              cost: groupResources.reduce((sum, r) => sum + r.cost, 0) * 0.25,
              carbon: groupResources.length * 15
            },
            implementationEffort: 'HIGH',
            description: `Multiple underutilized resources in ${key} can be consolidated ` +
                        `to reduce energy consumption and improve efficiency.`,
            actionItems: [
              'Analyze workload compatibility',
              'Plan migration strategy',
              'Test consolidated setup',
              'Migrate workloads during low-traffic period',
              'Monitor performance and adjust as needed'
            ]
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Identify migration opportunities to greener regions
   */
  private identifyMigrationOpportunities(
    resources: ResourceUtilization[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    // High carbon intensity regions (simplified)
    const highCarbonRegions = ['ap-southeast-1', 'southeastasia', 'us-east-1'];
    
    resources.forEach(resource => {
      if (highCarbonRegions.includes(resource.region)) {
        recommendations.push({
          id: `migrate-${resource.resourceId}`,
          priority: 'LOW',
          category: 'MIGRATION',
          resourceId: resource.resourceId,
          currentState: `Running in ${resource.region} (high carbon intensity)`,
          recommendedState: 'Migrate to region with renewable energy',
          estimatedSavings: {
            energy: 0,
            cost: 0,
            carbon: 50 // Significant carbon savings
          },
          implementationEffort: 'HIGH',
          description: `Resource is running in a region with high carbon intensity. ` +
                      `Migrating to a greener region can significantly reduce carbon footprint.`,
          actionItems: [
            'Identify suitable green regions',
            'Assess data residency requirements',
            'Plan migration strategy',
            'Test application in target region',
            'Execute migration during maintenance window'
          ]
        });
      }
    });

    return recommendations;
  }

  /**
   * Identify scheduling opportunities
   */
  private identifySchedulingOpportunities(
    resources: ResourceUtilization[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Identify batch/ML training resources that could be scheduled
    const schedulableResources = resources.filter(r => 
      (r.resourceType === ResourceType.ML_TRAINING || 
       r.resourceType === ResourceType.COMPUTE) &&
      r.idleTime > 12 // More than 12 hours idle
    );

    schedulableResources.forEach(resource => {
      recommendations.push({
        id: `schedule-${resource.resourceId}`,
        priority: 'MEDIUM',
        category: 'SCHEDULING',
        resourceId: resource.resourceId,
        currentState: 'Running continuously',
        recommendedState: 'Schedule during off-peak hours with low carbon intensity',
        estimatedSavings: {
          energy: 0,
          cost: resource.cost * 0.2, // 20% cost savings from off-peak pricing
          carbon: 30 // Carbon savings from running during greener hours
        },
        implementationEffort: 'LOW',
        description: `Resource has significant idle time and could be scheduled to run ` +
                    `during off-peak hours when grid carbon intensity is lower.`,
        actionItems: [
          'Identify optimal scheduling windows',
          'Implement scheduling automation',
          'Configure auto-start/stop policies',
          'Monitor carbon intensity trends',
          'Adjust schedule based on performance'
        ]
      });
    });

    return recommendations;
  }

  /**
   * Calculate total potential savings
   */
  private calculateTotalSavings(
    recommendations: OptimizationRecommendation[]
  ): { energy: number; cost: number; carbon: number } {
    return recommendations.reduce(
      (total, rec) => ({
        energy: total.energy + rec.estimatedSavings.energy,
        cost: total.cost + rec.estimatedSavings.cost,
        carbon: total.carbon + rec.estimatedSavings.carbon
      }),
      { energy: 0, cost: 0, carbon: 0 }
    );
  }

  /**
   * Create implementation roadmap
   */
  private createImplementationRoadmap(
    recommendations: OptimizationRecommendation[]
  ): { phase: string; recommendations: string[]; estimatedDuration: string }[] {
    const phases = [
      {
        phase: 'Quick Wins (Week 1-2)',
        recommendations: recommendations
          .filter(r => r.implementationEffort === 'LOW' && r.priority === 'HIGH')
          .map(r => r.id),
        estimatedDuration: '1-2 weeks'
      },
      {
        phase: 'Medium Priority (Week 3-6)',
        recommendations: recommendations
          .filter(r => r.implementationEffort === 'MEDIUM' || 
                      (r.implementationEffort === 'LOW' && r.priority !== 'HIGH'))
          .map(r => r.id),
        estimatedDuration: '3-6 weeks'
      },
      {
        phase: 'Strategic Initiatives (Month 2-3)',
        recommendations: recommendations
          .filter(r => r.implementationEffort === 'HIGH')
          .map(r => r.id),
        estimatedDuration: '2-3 months'
      }
    ];

    return phases.filter(p => p.recommendations.length > 0);
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(result: OptimizationResult): {
    totalRecommendations: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    result.recommendations.forEach(rec => {
      byCategory[rec.category] = (byCategory[rec.category] || 0) + 1;
      byPriority[rec.priority] = (byPriority[rec.priority] || 0) + 1;
    });

    return {
      totalRecommendations: result.recommendations.length,
      byCategory,
      byPriority
    };
  }
}