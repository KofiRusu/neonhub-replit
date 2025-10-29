import { Transaction, EconomicAgent, EconomicMetrics } from '../types';
import { TokenManager } from '../tokens/TokenManager';
import { DynamicPricingEngine } from '../pricing/DynamicPricingEngine';
export declare class TransactionProcessor {
    private tokenManager;
    private pricingEngine;
    private pendingTransactions;
    private confirmedTransactions;
    private economicAgents;
    private transactionMetrics;
    constructor(tokenManager: TokenManager, pricingEngine: DynamicPricingEngine);
    processTransaction(transaction: Omit<Transaction, 'id' | 'status' | 'timestamp'>): Promise<Transaction>;
    private validateTransaction;
    private isValidAddress;
    private validateAgentPermissions;
    private executeTransaction;
    private updateMarketData;
    private calculateVolume24h;
    private calculateMarketCap;
    private calculatePriceChange24h;
    private calculatePriceChange7d;
    private calculateLiquidity;
    private updateEconomicMetrics;
    private calculateTotalValueLocked;
    private getActiveUsersCount;
    private calculateTransactionVolume24h;
    private calculateAverageTransactionFee;
    private calculateMarketEfficiency;
    private calculatePriceVolatility;
    private calculateVolumeStability;
    private updateAgentReputation;
    registerEconomicAgent(agent: EconomicAgent): void;
    getTransactionHistory(address?: string, limit?: number): Transaction[];
    getPendingTransactions(): Transaction[];
    getEconomicMetrics(): EconomicMetrics | null;
    getTransactionMetricsObservable(): import("rxjs").Observable<EconomicMetrics | null>;
    getAgentReputation(agentId: string): number;
}
//# sourceMappingURL=TransactionProcessor.d.ts.map