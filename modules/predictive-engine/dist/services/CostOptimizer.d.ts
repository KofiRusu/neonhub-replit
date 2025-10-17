import { CloudProvider, CostOptimization, GlobalScalingDecision } from '../types';
import { AWSIntegration } from './AWSIntegration';
import { GCPIntegration } from './GCPIntegration';
import { AzureIntegration } from './AzureIntegration';
export declare class CostOptimizer {
    private logger;
    private awsIntegration?;
    private gcpIntegration?;
    private azureIntegration?;
    private costHistory;
    private spotInstanceCache;
    constructor(awsIntegration?: AWSIntegration, gcpIntegration?: GCPIntegration, azureIntegration?: AzureIntegration);
    optimizeScalingDecision(decision: GlobalScalingDecision): Promise<GlobalScalingDecision>;
    getSpotPrices(provider: CloudProvider, region: string): Promise<CostOptimization[]>;
    optimizeReplicaCount(decision: GlobalScalingDecision): Promise<number>;
    monitorAndAdjustCosts(): Promise<void>;
    getCostBreakdown(provider: CloudProvider, region: string, startDate: Date, endDate: Date): Promise<any>;
    recommendInstanceTypes(provider: CloudProvider, workload: 'cpu' | 'memory' | 'balanced'): Promise<string[]>;
    private getCurrentCosts;
    private getCostThreshold;
    private getAllProviderCosts;
    private detectCostAnomalies;
    private handleCostAnomaly;
    private updateCostHistory;
    private isCacheValid;
    private updateCacheTimestamp;
}
//# sourceMappingURL=CostOptimizer.d.ts.map