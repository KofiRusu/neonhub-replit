import { CloudRegion, CloudInstance, CloudService, CloudMetrics, ScalingPolicy, CostOptimization } from '../types';
export declare class GCPIntegration {
    private logger;
    private projectId;
    private serviceAccountKey;
    private region;
    private baseUrl;
    constructor(projectId: string, serviceAccountKey: string, region?: string);
    getRegions(): Promise<CloudRegion[]>;
    getComputeInstances(zone?: string): Promise<CloudInstance[]>;
    scaleComputeInstances(instanceGroupName: string, zone: string, targetSize: number): Promise<void>;
    getCloudRunServices(): Promise<CloudService[]>;
    scaleCloudRunService(serviceName: string, minInstances: number, maxInstances: number): Promise<void>;
    getCloudFunctions(): Promise<CloudService[]>;
    getCloudMonitoringMetrics(filter: string, startTime: Date, endTime: Date): Promise<CloudMetrics[]>;
    getSpotInstancePrices(instanceTypes: string[]): Promise<CostOptimization[]>;
    createInstanceGroup(config: ScalingPolicy): Promise<void>;
    createCloudRunAutoscaling(serviceName: string, config: ScalingPolicy): Promise<void>;
    private getOnDemandPrice;
    private extractMetricValue;
    private makeGCPCall;
    private makeMonitoringCall;
    private getAccessToken;
    private getContinentFromRegion;
}
//# sourceMappingURL=GCPIntegration.d.ts.map