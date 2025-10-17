import { PredictiveEngine } from './core/PredictiveEngine';
import { KubernetesAutoscaler } from './services/KubernetesAutoscaler';
import { AdaptiveAgent } from './models/AdaptiveAgent';
import { BaselineLoader } from './utils/baselineLoader';
import { AWSIntegration } from './services/AWSIntegration';
import { GCPIntegration } from './services/GCPIntegration';
import { AzureIntegration } from './services/AzureIntegration';
import { GlobalRegionManager } from './services/GlobalRegionManager';
import { CostOptimizer } from './services/CostOptimizer';
import { UnifiedScalingAPI } from './services/UnifiedScalingAPI';
import { WorkloadPatternAnalyzer } from './services/WorkloadPatternAnalyzer';
import { GeoDistributionManager } from './services/GeoDistributionManager';
import { FederationIntegration } from './services/FederationIntegration';
import { PerformanceMetrics, PredictiveThresholds, ScalingDecision, CloudProvider, GlobalScalingDecision, FederationCoordination, GeoDistributionConfig } from './types';
export declare class NeonHubPredictiveEngine {
    private predictiveEngine;
    private kubernetesAutoscaler;
    private adaptiveAgent;
    private globalRegionManager;
    private costOptimizer;
    private unifiedScalingAPI;
    private workloadPatternAnalyzer;
    private geoDistributionManager;
    private federationIntegration;
    private isInitialized;
    constructor();
    initialize(): Promise<void>;
    processMetrics(currentMetrics: PerformanceMetrics): Promise<ScalingDecision>;
    executeScaling(decision: ScalingDecision, namespace?: string, deploymentName?: string): Promise<void>;
    getSystemHealth(): Promise<{
        predictiveEngine: boolean;
        kubernetesAutoscaler: boolean;
        adaptiveAgent: boolean;
        overall: boolean;
    }>;
    getAdaptiveAgentStats(): {
        statesLearned: number;
        explorationRate: number;
        averageQValue: number;
    };
    getBaselineMetrics(): PerformanceMetrics;
    configureCloudProviders(awsConfig?: any, gcpConfig?: any, azureConfig?: any): Promise<void>;
    setupGeoDistribution(config: GeoDistributionConfig): Promise<void>;
    connectToFederation(config: FederationCoordination): Promise<void>;
    scaleAcrossProviders(provider: CloudProvider, region: string, serviceId: string, targetReplicas: number, options?: any): Promise<GlobalScalingDecision>;
    getGlobalHealthStatus(): Promise<{
        providers: Record<CloudProvider, boolean>;
        regions: Record<string, boolean>;
        services: Record<string, boolean>;
        overall: boolean;
    }>;
    static loadBaselineMetrics(): Promise<PerformanceMetrics>;
    static validateMetrics(metrics: PerformanceMetrics): Promise<boolean>;
    private getAWSConfig;
    private getGCPConfig;
    private getAzureConfig;
}
export { PredictiveEngine, KubernetesAutoscaler, AdaptiveAgent, BaselineLoader, AWSIntegration, GCPIntegration, AzureIntegration, GlobalRegionManager, CostOptimizer, UnifiedScalingAPI, WorkloadPatternAnalyzer, GeoDistributionManager, FederationIntegration };
export type { PerformanceMetrics, PredictiveThresholds, ScalingDecision, CloudProvider, GlobalScalingDecision, FederationCoordination, GeoDistributionConfig };
export default NeonHubPredictiveEngine;
//# sourceMappingURL=index.d.ts.map