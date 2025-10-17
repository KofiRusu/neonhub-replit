import { CloudRegion, CloudInstance, CloudService, CloudMetrics, ScalingPolicy, CostOptimization } from '../types';
export declare class AWSIntegration {
    private logger;
    private accessKeyId;
    private secretAccessKey;
    private region;
    private baseUrl;
    constructor(accessKeyId: string, secretAccessKey: string, region?: string);
    getRegions(): Promise<CloudRegion[]>;
    getEC2Instances(filters?: Record<string, string>): Promise<CloudInstance[]>;
    scaleEC2Instances(instanceIds: string[], targetCount: number): Promise<void>;
    getECSClusters(): Promise<CloudService[]>;
    scaleECSService(clusterName: string, serviceName: string, desiredCount: number): Promise<void>;
    getLambdaFunctions(): Promise<CloudService[]>;
    getCloudWatchMetrics(namespace: string, metricName: string, dimensions: any[], startTime: Date, endTime: Date): Promise<CloudMetrics[]>;
    getSpotInstancePrices(instanceTypes: string[]): Promise<CostOptimization[]>;
    createAutoScalingGroup(config: ScalingPolicy): Promise<void>;
    private launchEC2Instances;
    private terminateEC2Instances;
    private getOnDemandPrice;
    private makeAWSCall;
    private makeECSCall;
    private makeLambdaCall;
    private makeCloudWatchCall;
    private getContinentFromRegion;
    private getRegionCoordinates;
}
//# sourceMappingURL=AWSIntegration.d.ts.map