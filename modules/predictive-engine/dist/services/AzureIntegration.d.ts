import { CloudRegion, CloudInstance, CloudService, CloudMetrics, ScalingPolicy, CostOptimization } from '../types';
export declare class AzureIntegration {
    private logger;
    private subscriptionId;
    private tenantId;
    private clientId;
    private clientSecret;
    private region;
    private baseUrl;
    private accessToken;
    constructor(subscriptionId: string, tenantId: string, clientId: string, clientSecret: string, region?: string);
    authenticate(): Promise<void>;
    getLocations(): Promise<CloudRegion[]>;
    getVMInstances(resourceGroup?: string): Promise<CloudInstance[]>;
    scaleVMScaleSet(resourceGroup: string, scaleSetName: string, capacity: number): Promise<void>;
    getAKSClusters(resourceGroup?: string): Promise<CloudService[]>;
    scaleAKSNodePool(resourceGroup: string, clusterName: string, nodePoolName: string, count: number): Promise<void>;
    getFunctions(resourceGroup?: string): Promise<CloudService[]>;
    getAzureMonitorMetrics(resourceId: string, metricNames: string[], startTime: Date, endTime: Date): Promise<CloudMetrics[]>;
    getSpotInstancePrices(vmSizes: string[]): Promise<CostOptimization[]>;
    createVMScaleSet(resourceGroup: string, config: ScalingPolicy): Promise<void>;
    private createAutoScaleSettings;
    private ensureAuthenticated;
    private makeAzureCall;
    private getContinentFromLocation;
}
//# sourceMappingURL=AzureIntegration.d.ts.map