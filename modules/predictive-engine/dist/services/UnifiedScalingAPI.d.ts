import { CloudProvider, GlobalScalingDecision, PerformanceMetrics, WorkloadPattern, GeoDistributionConfig } from '../types';
import { GlobalRegionManager } from './GlobalRegionManager';
import { CostOptimizer } from './CostOptimizer';
import { PredictiveEngine } from '../core/PredictiveEngine';
export declare class UnifiedScalingAPI {
    private logger;
    private globalRegionManager;
    private costOptimizer;
    private predictiveEngine;
    private workloadPatterns;
    constructor(globalRegionManager: GlobalRegionManager, costOptimizer: CostOptimizer, predictiveEngine: PredictiveEngine);
    scaleAcrossProviders(provider: CloudProvider, region: string, serviceId: string, targetReplicas: number, options?: {
        costOptimized?: boolean;
        geoDistributed?: boolean;
        failoverRegions?: string[];
    }): Promise<GlobalScalingDecision>;
    predictiveScaleAcrossProviders(currentMetrics: PerformanceMetrics): Promise<GlobalScalingDecision[]>;
    setupGeoDistribution(config: GeoDistributionConfig): Promise<void>;
    addWorkloadPattern(pattern: WorkloadPattern): Promise<void>;
    getScalingRecommendations(provider?: CloudProvider, region?: string): Promise<GlobalScalingDecision[]>;
    executeFailover(primaryRegion: string, serviceId: string): Promise<void>;
    getGlobalHealthStatus(): Promise<{
        providers: Record<CloudProvider, boolean>;
        regions: Record<string, boolean>;
        services: Record<string, boolean>;
        overall: boolean;
    }>;
    private applyWorkloadPatterns;
    private extractProviderFromServiceId;
}
//# sourceMappingURL=UnifiedScalingAPI.d.ts.map