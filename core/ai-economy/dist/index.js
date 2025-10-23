export { TokenManager } from './tokens/TokenManager';
export { DynamicPricingEngine } from './pricing/DynamicPricingEngine';
export { TransactionProcessor } from './transactions/TransactionProcessor';
// Types
export * from './types';
// AI Economy Manager - Main orchestrator
import { TokenManager } from './tokens/TokenManager';
import { DynamicPricingEngine } from './pricing/DynamicPricingEngine';
import { TransactionProcessor } from './transactions/TransactionProcessor';
export class AIEconomy {
    constructor(config) {
        this.isActive = false;
        this.config = config;
        this.tokenManager = new TokenManager(config);
        this.pricingEngine = new DynamicPricingEngine();
        this.transactionProcessor = new TransactionProcessor(this.tokenManager, this.pricingEngine);
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        // Subscribe to price updates
        this.pricingEngine.getPriceUpdateObservable().subscribe(updates => {
            console.log('Price updates:', updates);
        });
        // Subscribe to transaction metrics
        this.transactionProcessor.getTransactionMetricsObservable().subscribe(metrics => {
            if (metrics) {
                console.log('Economic metrics updated:', metrics);
            }
        });
    }
    async startEconomy() {
        this.isActive = true;
        console.log('AI Economy started');
        // Initialize economic agents
        await this.initializeEconomicAgents();
        // Start periodic economic activities
        this.startEconomicCycles();
    }
    async stopEconomy() {
        this.isActive = false;
        console.log('AI Economy stopped');
    }
    async initializeEconomicAgents() {
        // Create default economic agents
        const agents = [
            {
                id: 'system-agent',
                type: 'service',
                reputation: 1.0,
                stake: 1000000,
                rewards: 0,
                penalties: 0,
                lastActivity: new Date(),
                status: 'active'
            },
            {
                id: 'federation-agent',
                type: 'federation_node',
                reputation: 0.9,
                stake: 500000,
                rewards: 0,
                penalties: 0,
                lastActivity: new Date(),
                status: 'active'
            }
        ];
        for (const agent of agents) {
            this.transactionProcessor.registerEconomicAgent(agent);
            // Mint initial tokens for agents
            await this.transactionProcessor.processTransaction({
                type: 'mint',
                fromAddress: 'system',
                toAddress: agent.id,
                tokenId: 'neon-token',
                amount: agent.stake,
                fee: 0,
                metadata: { reason: 'initial_stake' }
            });
        }
    }
    startEconomicCycles() {
        // Periodic token redistribution
        setInterval(() => {
            if (this.isActive) {
                this.tokenManager.redistributeTokens();
            }
        }, 24 * 60 * 60 * 1000); // Daily
        // Economic metrics updates
        setInterval(() => {
            if (this.isActive) {
                const metrics = this.transactionProcessor.getEconomicMetrics();
                if (metrics) {
                    this.pricingEngine.updateEconomicMetrics(metrics);
                }
            }
        }, 60 * 1000); // Every minute
    }
    async processTransaction(type, fromAddress, toAddress, tokenId, amount, metadata = {}) {
        if (!this.isActive) {
            throw new Error('AI Economy is not active');
        }
        return await this.transactionProcessor.processTransaction({
            type,
            fromAddress,
            toAddress,
            tokenId,
            amount,
            fee: this.calculateTransactionFee(amount),
            metadata
        });
    }
    calculateTransactionFee(amount) {
        return amount * this.config.transactionFeeRate;
    }
    getTokenBalance(tokenId, holderId) {
        return this.tokenManager.getBalance(tokenId, holderId);
    }
    getTokenPrice(tokenId) {
        return this.pricingEngine.getCurrentPrice(tokenId);
    }
    getEconomicMetrics() {
        return this.transactionProcessor.getEconomicMetrics();
    }
    getTransactionHistory(address, limit = 100) {
        return this.transactionProcessor.getTransactionHistory(address, limit);
    }
    registerEconomicAgent(agent) {
        this.transactionProcessor.registerEconomicAgent(agent);
    }
    getAgentReputation(agentId) {
        return this.transactionProcessor.getAgentReputation(agentId);
    }
    getTokenStats(tokenId) {
        return this.tokenManager.getTokenStats(tokenId);
    }
    getPricingAnalytics(tokenId) {
        return this.pricingEngine.getPricingAnalytics(tokenId);
    }
    getSystemHealth() {
        const metrics = this.getEconomicMetrics();
        if (!metrics)
            return 'critical';
        const efficiency = metrics.marketEfficiency;
        const volume = metrics.transactionVolume24h;
        if (efficiency > 0.8 && volume > 10000) {
            return 'healthy';
        }
        else if (efficiency > 0.5 || volume > 1000) {
            return 'unstable';
        }
        else {
            return 'critical';
        }
    }
    async rewardAgent(agentId, amount, reason) {
        await this.processTransaction('reward', 'system', agentId, 'neon-token', amount, { reason, type: 'agent_reward' });
    }
    async penalizeAgent(agentId, amount, reason) {
        await this.processTransaction('burn', agentId, 'system', 'neon-token', amount, { reason, type: 'agent_penalty' });
    }
    getAllTokens() {
        return this.tokenManager.getAllTokens();
    }
    getPendingTransactions() {
        return this.transactionProcessor.getPendingTransactions();
    }
}
//# sourceMappingURL=index.js.map