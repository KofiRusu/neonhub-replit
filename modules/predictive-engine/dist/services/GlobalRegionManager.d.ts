import { CloudRegion, CloudService, CloudMetrics, GlobalScalingDecision, FederationCoordination, GeoDistributionConfig } from '../types';
export declare class GlobalRegionManager {
    private logger;
    private awsIntegration?;
    private gcpIntegration?;
    private azureIntegration?;
    private regions;
    private federationCoordination?;
    private geoConfig?;
    constructor();
    initializeCloudProviders(awsConfig?: any, gcpConfig?: any, azureConfig?: any): Promise<void>;
    discoverServices(): Promise<CloudService[]>;
    getGlobalMetrics(startTime: Date, endTime: Date): Promise<CloudMetrics[]>;
    executeGlobalScaling(decision: GlobalScalingDecision): Promise<void>;
    handleFailover(primaryRegion: string, decision: GlobalScalingDecision): Promise<void>;
    optimizeGeoDistribution(config: GeoDistributionConfig): Promise<void>;
    integrateWithFederation(federationConfig: FederationCoordination): Promise<void>;
    private calculateOptimalDistribution;
    private updateGeoDistribution;
    getAvailableRegions(): CloudRegion[];
    getFederationStatus(): FederationCoordination | undefined;
    getGeoConfig(): GeoDistributionConfig | undefined;
}
//# sourceMappingURL=GlobalRegionManager.d.ts.map