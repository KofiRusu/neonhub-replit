"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIEconomy = exports.TransactionProcessor = exports.DynamicPricingEngine = exports.TokenManager = void 0;
var TokenManager_1 = require("./tokens/TokenManager");
Object.defineProperty(exports, "TokenManager", { enumerable: true, get: function () { return TokenManager_1.TokenManager; } });
var DynamicPricingEngine_1 = require("./pricing/DynamicPricingEngine");
Object.defineProperty(exports, "DynamicPricingEngine", { enumerable: true, get: function () { return DynamicPricingEngine_1.DynamicPricingEngine; } });
var TransactionProcessor_1 = require("./transactions/TransactionProcessor");
Object.defineProperty(exports, "TransactionProcessor", { enumerable: true, get: function () { return TransactionProcessor_1.TransactionProcessor; } });
// Types
__exportStar(require("./types"), exports);
// AI Economy Manager - Main orchestrator
const TokenManager_2 = require("./tokens/TokenManager");
const DynamicPricingEngine_2 = require("./pricing/DynamicPricingEngine");
const TransactionProcessor_2 = require("./transactions/TransactionProcessor");
class AIEconomy {
    constructor(config) {
        this.isActive = false;
        this.config = config;
        this.tokenManager = new TokenManager_2.TokenManager(config);
        this.pricingEngine = new DynamicPricingEngine_2.DynamicPricingEngine();
        this.transactionProcessor = new TransactionProcessor_2.TransactionProcessor(this.tokenManager, this.pricingEngine);
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
exports.AIEconomy = AIEconomy;
//# sourceMappingURL=index.js.map