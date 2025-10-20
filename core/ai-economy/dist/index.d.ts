export { TokenManager } from './tokens/TokenManager';
export { DynamicPricingEngine } from './pricing/DynamicPricingEngine';
export { TransactionProcessor } from './transactions/TransactionProcessor';
export * from './types';
import { EconomicConfig, EconomicMetrics, EconomicAgent } from './types';
export declare class AIEconomy {
    private tokenManager;
    private pricingEngine;
    private transactionProcessor;
    private config;
    private isActive;
    constructor(config: EconomicConfig);
    private setupEventHandlers;
    startEconomy(): Promise<void>;
    stopEconomy(): Promise<void>;
    private initializeEconomicAgents;
    private startEconomicCycles;
    processTransaction(type: 'transfer' | 'mint' | 'burn' | 'stake' | 'unstake' | 'reward', fromAddress: string, toAddress: string, tokenId: string, amount: number, metadata?: Record<string, any>): Promise<any>;
    private calculateTransactionFee;
    getTokenBalance(tokenId: string, holderId: string): number;
    getTokenPrice(tokenId: string): number;
    getEconomicMetrics(): EconomicMetrics | null;
    getTransactionHistory(address?: string, limit?: number): any[];
    registerEconomicAgent(agent: EconomicAgent): void;
    getAgentReputation(agentId: string): number;
    getTokenStats(tokenId: string): any;
    getPricingAnalytics(tokenId: string): any;
    getSystemHealth(): 'healthy' | 'unstable' | 'critical';
    rewardAgent(agentId: string, amount: number, reason: string): Promise<void>;
    penalizeAgent(agentId: string, amount: number, reason: string): Promise<void>;
    getAllTokens(): any[];
    getPendingTransactions(): any[];
}
//# sourceMappingURL=index.d.ts.map