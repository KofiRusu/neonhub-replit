import { FederationCoordination, CloudMetrics, GlobalScalingDecision } from '../types';
import { GlobalRegionManager } from './GlobalRegionManager';
export declare class FederationIntegration {
    private logger;
    private globalRegionManager;
    private federationConfig?;
    private isConnected;
    constructor(globalRegionManager: GlobalRegionManager);
    connectToFederation(config: FederationCoordination): Promise<void>;
    shareMetrics(metrics: CloudMetrics[]): Promise<void>;
    requestFederationAssistance(region: string, requiredCapacity: number, reason: string): Promise<GlobalScalingDecision[]>;
    coordinateGlobalScaling(decisions: GlobalScalingDecision[]): Promise<void>;
    shareWorkloadPatterns(patterns: any[]): Promise<void>;
    getFederationInsights(): Promise<{
        totalNodes: number;
        activeRegions: string[];
        sharedCapacity: number;
        consensusHealth: number;
    }>;
    handleFederationFailure(failedNode: string): Promise<void>;
    optimizeFederationPerformance(): Promise<void>;
    private registerWithCoordinator;
    private startFederationSync;
    private syncWithFederation;
    private broadcastToFederation;
    private requiresConsensus;
    private achieveConsensus;
    private coordinateExecution;
    private getNodeId;
    private extractProviderFromNodeId;
    private getNodeHealth;
    private getRecentMetrics;
    private redistributeResponsibilities;
    private updateFederationTopology;
    private triggerRecoveryProcedures;
    private analyzeFederationPerformance;
    private optimizeCommunication;
    private rebalanceFederationLoad;
    private adjustConsensusThresholds;
    isConnectedToFederation(): boolean;
    getFederationConfig(): FederationCoordination | undefined;
}
//# sourceMappingURL=FederationIntegration.d.ts.map