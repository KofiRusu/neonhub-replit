import { GeoDistributionConfig } from '../types';
import { GlobalRegionManager } from './GlobalRegionManager';
export declare class GeoDistributionManager {
    private logger;
    private globalRegionManager;
    private geoConfig?;
    private latencyMatrix;
    private trafficDistribution;
    constructor(globalRegionManager: GlobalRegionManager);
    configureGeoDistribution(config: GeoDistributionConfig): Promise<void>;
    optimizeTrafficDistribution(userLocation?: {
        lat: number;
        lng: number;
    }): Promise<Map<string, number>>;
    handleRegionalFailure(failedRegion: string): Promise<void>;
    getOptimalRegionForUser(userLocation: {
        lat: number;
        lng: number;
    }): Promise<string>;
    monitorAndAdjustDistribution(): Promise<void>;
    predictAndPreScale(): Promise<void>;
    private buildLatencyMatrix;
    private calculateLatency;
    private toRadians;
    private calculateLatencyBasedDistribution;
    private calculateLoadBasedDistribution;
    private applyHealthChecks;
    private checkRegionHealth;
    private analyzeRegionalPerformance;
    private adjustDistributionForPerformance;
    private shouldUpdateDistribution;
    private predictRegionalLoad;
    private calculateTrend;
    private preScaleRegion;
    private triggerFailoverScaling;
    getCurrentDistribution(): Map<string, number>;
    getGeoConfig(): GeoDistributionConfig | undefined;
}
//# sourceMappingURL=GeoDistributionManager.d.ts.map