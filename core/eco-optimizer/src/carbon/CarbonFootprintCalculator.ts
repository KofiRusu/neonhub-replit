import {
  CloudProvider,
  ResourceType,
  CarbonEmissionFactor,
  CarbonFootprint,
  CarbonReport,
  EnergyUsageData,
  Logger,
  DataCollectionError
} from '../types';

/**
 * CarbonFootprintCalculator - Calculates carbon emissions based on energy usage
 * Provides accurate CO2e calculations using region-specific emission factors
 */
export class CarbonFootprintCalculator {
  private logger: Logger;
  private emissionFactors: Map<string, CarbonEmissionFactor> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
    this.initializeEmissionFactors();
  }

  /**
   * Initialize emission factors for different regions
   */
  private initializeEmissionFactors(): void {
    // AWS Regions - Based on actual grid carbon intensity data
    const awsFactors: CarbonEmissionFactor[] = [
      { provider: CloudProvider.AWS, region: 'us-east-1', gCO2ePerKWh: 415, source: 'EPA', lastUpdated: new Date() },
      { provider: CloudProvider.AWS, region: 'us-west-2', gCO2ePerKWh: 285, source: 'EPA', lastUpdated: new Date() },
      { provider: CloudProvider.AWS, region: 'eu-west-1', gCO2ePerKWh: 295, source: 'EEA', lastUpdated: new Date() },
      { provider: CloudProvider.AWS, region: 'ap-southeast-1', gCO2ePerKWh: 705, source: 'IEA', lastUpdated: new Date() }
    ];

    // Azure Regions
    const azureFactors: CarbonEmissionFactor[] = [
      { provider: CloudProvider.AZURE, region: 'eastus', gCO2ePerKWh: 415, source: 'EPA', lastUpdated: new Date() },
      { provider: CloudProvider.AZURE, region: 'westeurope', gCO2ePerKWh: 275, source: 'EEA', lastUpdated: new Date() },
      { provider: CloudProvider.AZURE, region: 'southeastasia', gCO2ePerKWh: 705, source: 'IEA', lastUpdated: new Date() }
    ];

    // GCP Regions
    const gcpFactors: CarbonEmissionFactor[] = [
      { provider: CloudProvider.GCP, region: 'us-central1', gCO2ePerKWh: 450, source: 'EPA', lastUpdated: new Date() },
      { provider: CloudProvider.GCP, region: 'europe-west1', gCO2ePerKWh: 180, source: 'EEA', lastUpdated: new Date() },
      { provider: CloudProvider.GCP, region: 'asia-east1', gCO2ePerKWh: 554, source: 'IEA', lastUpdated: new Date() }
    ];

    // Store all factors in map
    [...awsFactors, ...azureFactors, ...gcpFactors].forEach(factor => {
      const key = `${factor.provider}-${factor.region}`;
      this.emissionFactors.set(key, factor);
    });

    this.logger.info(`Initialized ${this.emissionFactors.size} emission factors`);
  }

  /**
   * Calculate carbon footprint from energy usage
   */
  async calculateFootprint(energyUsage: EnergyUsageData): Promise<CarbonFootprint> {
    try {
      this.logger.info('Calculating carbon footprint');

      const emissionsByProvider: Record<CloudProvider, number> = {
        [CloudProvider.AWS]: 0,
        [CloudProvider.AZURE]: 0,
        [CloudProvider.GCP]: 0,
        [CloudProvider.HYBRID]: 0
      };

      const emissionsByResourceType: Record<ResourceType, number> = {
        [ResourceType.COMPUTE]: 0,
        [ResourceType.STORAGE]: 0,
        [ResourceType.NETWORK]: 0,
        [ResourceType.DATABASE]: 0,
        [ResourceType.ML_TRAINING]: 0,
        [ResourceType.ML_INFERENCE]: 0
      };

      const emissionsByRegion: Record<string, number> = {};

      let totalEmissions = 0;

      // Calculate emissions by region
      for (const [region, energyKWh] of Object.entries(energyUsage.byRegion)) {
        // Try to find emission factor for this region
        let emissionFactor: CarbonEmissionFactor | undefined;

        for (const provider of [CloudProvider.AWS, CloudProvider.AZURE, CloudProvider.GCP]) {
          const key = `${provider}-${region}`;
          emissionFactor = this.emissionFactors.get(key);
          if (emissionFactor) break;
        }

        // Use default if not found
        if (!emissionFactor) {
          emissionFactor = {
            provider: CloudProvider.AWS,
            region,
            gCO2ePerKWh: 475, // Global average
            source: 'IEA Global Average',
            lastUpdated: new Date()
          };
        }

        const emissions = (energyKWh * emissionFactor.gCO2ePerKWh) / 1000; // Convert to kg CO2e
        emissionsByRegion[region] = emissions;
        totalEmissions += emissions;
      }

      // Distribute emissions by provider proportionally
      for (const provider of Object.keys(energyUsage.byProvider) as CloudProvider[]) {
        const providerEnergy = energyUsage.byProvider[provider];
        const providerShare = energyUsage.total > 0 ? providerEnergy / energyUsage.total : 0;
        emissionsByProvider[provider] = totalEmissions * providerShare;
      }

      // Distribute emissions by resource type proportionally
      for (const resourceType of Object.keys(energyUsage.byResourceType) as ResourceType[]) {
        const resourceEnergy = energyUsage.byResourceType[resourceType];
        const resourceShare = energyUsage.total > 0 ? resourceEnergy / energyUsage.total : 0;
        emissionsByResourceType[resourceType] = totalEmissions * resourceShare;
      }

      const footprint: CarbonFootprint = {
        totalEmissions,
        emissionsByProvider,
        emissionsByResourceType,
        emissionsByRegion,
        offset: 0, // Will be calculated separately
        netEmissions: totalEmissions
      };

      this.logger.info(`Total carbon emissions: ${totalEmissions.toFixed(2)} kg CO2e`);
      return footprint;
    } catch (error) {
      this.logger.error('Error calculating carbon footprint', error);
      throw new DataCollectionError('Failed to calculate carbon footprint', error);
    }
  }

  /**
   * Generate carbon report with trends and recommendations
   */
  async generateReport(
    currentFootprint: CarbonFootprint,
    previousFootprint?: CarbonFootprint,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<CarbonReport> {
    try {
      const start = periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = periodEnd || new Date();

      // Calculate trends
      let change = 0;
      if (previousFootprint) {
        change = ((currentFootprint.totalEmissions - previousFootprint.totalEmissions) / 
                  previousFootprint.totalEmissions) * 100;
      }

      // Project next period emissions
      const projection = currentFootprint.totalEmissions * (1 + (change / 100));

      // Generate recommendations
      const recommendations = this.generateRecommendations(currentFootprint);

      const report: CarbonReport = {
        period: { start, end },
        footprint: currentFootprint,
        trends: {
          change,
          projection
        },
        recommendations
      };

      this.logger.info(`Generated carbon report: ${change.toFixed(1)}% change`);
      return report;
    } catch (error) {
      this.logger.error('Error generating carbon report', error);
      throw new DataCollectionError('Failed to generate carbon report', error);
    }
  }

  /**
   * Generate recommendations to reduce carbon footprint
   */
  private generateRecommendations(footprint: CarbonFootprint): string[] {
    const recommendations: string[] = [];

    // Identify highest emitting provider
    const providers = Object.entries(footprint.emissionsByProvider)
      .sort(([, a], [, b]) => b - a);
    
    if (providers[0][1] > footprint.totalEmissions * 0.5) {
      recommendations.push(
        `${providers[0][0]} accounts for ${((providers[0][1] / footprint.totalEmissions) * 100).toFixed(1)}% ` +
        `of emissions. Consider migrating workloads to regions with lower carbon intensity.`
      );
    }

    // Identify highest emitting resource type
    const resources = Object.entries(footprint.emissionsByResourceType)
      .sort(([, a], [, b]) => b - a);
    
    if (resources[0][1] > footprint.totalEmissions * 0.4) {
      recommendations.push(
        `${resources[0][0]} workloads generate ${((resources[0][1] / footprint.totalEmissions) * 100).toFixed(1)}% ` +
        `of emissions. Optimize ${resources[0][0].toLowerCase()} resource usage for better efficiency.`
      );
    }

    // Identify high-emission regions
    const regions = Object.entries(footprint.emissionsByRegion)
      .sort(([, a], [, b]) => b - a);
    
    if (regions.length > 0 && regions[0][1] > footprint.totalEmissions * 0.3) {
      recommendations.push(
        `Region ${regions[0][0]} has high carbon intensity. Consider moving workloads to ` +
        `regions powered by renewable energy.`
      );
    }

    // General recommendations
    recommendations.push(
      'Implement auto-scaling to reduce idle resources and associated emissions.',
      'Schedule non-urgent workloads during off-peak hours when grid carbon intensity is lower.',
      'Consider purchasing carbon offsets to achieve carbon neutrality.'
    );

    return recommendations;
  }

  /**
   * Calculate carbon offset required for neutrality
   */
  calculateRequiredOffset(footprint: CarbonFootprint): number {
    return footprint.netEmissions;
  }

  /**
   * Apply carbon offset to footprint
   */
  applyOffset(footprint: CarbonFootprint, offsetKgCO2e: number): CarbonFootprint {
    return {
      ...footprint,
      offset: offsetKgCO2e,
      netEmissions: Math.max(0, footprint.totalEmissions - offsetKgCO2e)
    };
  }

  /**
   * Get emission factor for a specific region
   */
  getEmissionFactor(provider: CloudProvider, region: string): CarbonEmissionFactor | undefined {
    const key = `${provider}-${region}`;
    return this.emissionFactors.get(key);
  }

  /**
   * Update emission factor
   */
  updateEmissionFactor(factor: CarbonEmissionFactor): void {
    const key = `${factor.provider}-${factor.region}`;
    this.emissionFactors.set(key, factor);
    this.logger.info(`Updated emission factor for ${key}`);
  }

  /**
   * Compare carbon footprints
   */
  compareFootprints(current: CarbonFootprint, previous: CarbonFootprint): {
    absoluteChange: number;
    percentageChange: number;
    improved: boolean;
  } {
    const absoluteChange = current.totalEmissions - previous.totalEmissions;
    const percentageChange = (absoluteChange / previous.totalEmissions) * 100;
    const improved = absoluteChange < 0;

    return {
      absoluteChange,
      percentageChange,
      improved
    };
  }
}