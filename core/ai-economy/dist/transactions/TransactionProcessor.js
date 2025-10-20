"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionProcessor = void 0;
const rxjs_1 = require("rxjs");
class TransactionProcessor {
    constructor(tokenManager, pricingEngine) {
        this.pendingTransactions = new Map();
        this.confirmedTransactions = [];
        this.economicAgents = new Map();
        this.transactionMetrics = new rxjs_1.BehaviorSubject(null);
        this.tokenManager = tokenManager;
        this.pricingEngine = pricingEngine;
    }
    async processTransaction(transaction) {
        // Validate transaction
        await this.validateTransaction(transaction);
        // Create full transaction object
        const fullTransaction = {
            ...transaction,
            id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending',
            timestamp: new Date()
        };
        // Add to pending transactions
        this.pendingTransactions.set(fullTransaction.id, fullTransaction);
        try {
            // Execute transaction
            await this.executeTransaction(fullTransaction);
            // Confirm transaction
            fullTransaction.status = 'confirmed';
            this.confirmedTransactions.push(fullTransaction);
            // Update economic metrics
            this.updateEconomicMetrics();
            // Update agent reputation
            this.updateAgentReputation(fullTransaction.fromAddress, 'positive');
            this.updateAgentReputation(fullTransaction.toAddress, 'positive');
            // Remove from pending
            this.pendingTransactions.delete(fullTransaction.id);
            return fullTransaction;
        }
        catch (error) {
            fullTransaction.status = 'failed';
            this.pendingTransactions.delete(fullTransaction.id);
            // Update agent reputation for failed transaction
            this.updateAgentReputation(fullTransaction.fromAddress, 'negative');
            throw error;
        }
    }
    async validateTransaction(transaction) {
        // Validate token exists
        const token = this.tokenManager.getToken(transaction.tokenId);
        if (!token) {
            throw new Error(`Invalid token: ${transaction.tokenId}`);
        }
        // Validate addresses
        if (!this.isValidAddress(transaction.fromAddress) || !this.isValidAddress(transaction.toAddress)) {
            throw new Error('Invalid transaction addresses');
        }
        // Validate amount
        if (transaction.amount <= 0) {
            throw new Error('Transaction amount must be positive');
        }
        // Validate balance for transfers
        if (transaction.type === 'transfer') {
            const balance = this.tokenManager.getBalance(transaction.tokenId, transaction.fromAddress);
            const totalCost = transaction.amount + transaction.fee;
            if (balance < totalCost) {
                throw new Error(`Insufficient balance: ${balance} < ${totalCost}`);
            }
        }
        // Validate agent permissions
        await this.validateAgentPermissions(transaction);
    }
    isValidAddress(address) {
        // Basic address validation - in production, this would be more sophisticated
        return address.length > 0 && address !== 'system';
    }
    async validateAgentPermissions(transaction) {
        const fromAgent = this.economicAgents.get(transaction.fromAddress);
        const toAgent = this.economicAgents.get(transaction.toAddress);
        // Check if agents are active
        if (fromAgent && fromAgent.status !== 'active') {
            throw new Error(`Sender agent is not active: ${transaction.fromAddress}`);
        }
        if (toAgent && toAgent.status !== 'active') {
            throw new Error(`Recipient agent is not active: ${transaction.toAddress}`);
        }
        // Additional permission checks based on transaction type
        switch (transaction.type) {
            case 'mint':
                if (fromAgent?.type !== 'service') {
                    throw new Error('Only service agents can mint tokens');
                }
                break;
            case 'burn':
                // Any agent can burn their own tokens
                break;
            case 'stake':
                if (!fromAgent || fromAgent.reputation < 0.5) {
                    throw new Error('Insufficient reputation for staking');
                }
                break;
        }
    }
    async executeTransaction(transaction) {
        switch (transaction.type) {
            case 'transfer':
                this.tokenManager.transferTokens(transaction.tokenId, transaction.fromAddress, transaction.toAddress, transaction.amount);
                break;
            case 'mint':
                this.tokenManager.mintTokens(transaction.tokenId, transaction.amount, transaction.toAddress);
                break;
            case 'burn':
                this.tokenManager.burnTokens(transaction.tokenId, transaction.amount, transaction.fromAddress);
                break;
            case 'stake':
                if (!this.tokenManager.lockTokens(transaction.tokenId, transaction.fromAddress, transaction.amount)) {
                    throw new Error('Failed to stake tokens');
                }
                break;
            case 'unstake':
                if (!this.tokenManager.unlockTokens(transaction.tokenId, transaction.fromAddress, transaction.amount)) {
                    throw new Error('Failed to unstake tokens');
                }
                break;
            case 'reward':
                this.tokenManager.mintTokens(transaction.tokenId, transaction.amount, transaction.toAddress);
                break;
            default:
                throw new Error(`Unsupported transaction type: ${transaction.type}`);
        }
        // Update market data for pricing engine
        this.updateMarketData(transaction);
    }
    updateMarketData(transaction) {
        // Calculate new market metrics
        const volume24h = this.calculateVolume24h(transaction.tokenId);
        const price = this.pricingEngine.getCurrentPrice(transaction.tokenId);
        const marketCap = this.calculateMarketCap(transaction.tokenId, price);
        this.pricingEngine.updateMarketData(transaction.tokenId, {
            price,
            volume24h,
            marketCap,
            priceChange24h: this.calculatePriceChange24h(transaction.tokenId),
            priceChange7d: this.calculatePriceChange7d(transaction.tokenId),
            liquidity: this.calculateLiquidity(transaction.tokenId),
            timestamp: new Date()
        });
    }
    calculateVolume24h(tokenId) {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return this.confirmedTransactions
            .filter(tx => tx.tokenId === tokenId && tx.timestamp > oneDayAgo)
            .reduce((sum, tx) => sum + tx.amount, 0);
    }
    calculateMarketCap(tokenId, price) {
        const token = this.tokenManager.getToken(tokenId);
        return token ? token.circulatingSupply * price : 0;
    }
    calculatePriceChange24h(tokenId) {
        // Simplified calculation - in production, this would use historical data
        return Math.random() * 20 - 10; // Random change between -10% and +10%
    }
    calculatePriceChange7d(tokenId) {
        // Simplified calculation
        return Math.random() * 50 - 25; // Random change between -25% and +25%
    }
    calculateLiquidity(tokenId) {
        // Estimate liquidity based on recent transactions
        const recentTxs = this.confirmedTransactions
            .filter(tx => tx.tokenId === tokenId)
            .slice(-100); // Last 100 transactions
        return recentTxs.reduce((sum, tx) => sum + tx.amount, 0) / 100;
    }
    updateEconomicMetrics() {
        const totalValueLocked = this.calculateTotalValueLocked();
        const totalTransactions = this.confirmedTransactions.length;
        const activeUsers = this.getActiveUsersCount();
        const transactionVolume24h = this.calculateTransactionVolume24h();
        const averageTransactionFee = this.calculateAverageTransactionFee();
        const marketEfficiency = this.calculateMarketEfficiency();
        const inflationRate = 0.02; // 2% annual inflation
        const metrics = {
            totalValueLocked,
            totalTransactions,
            activeUsers,
            transactionVolume24h,
            averageTransactionFee,
            marketEfficiency,
            inflationRate,
            timestamp: new Date()
        };
        this.transactionMetrics.next(metrics);
        this.pricingEngine.updateEconomicMetrics(metrics);
    }
    calculateTotalValueLocked() {
        let total = 0;
        for (const token of this.tokenManager.getAllTokens()) {
            const price = this.pricingEngine.getCurrentPrice(token.id);
            total += token.circulatingSupply * price;
        }
        return total;
    }
    getActiveUsersCount() {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const activeAddresses = new Set(this.confirmedTransactions
            .filter(tx => tx.timestamp > oneDayAgo)
            .flatMap(tx => [tx.fromAddress, tx.toAddress]));
        return activeAddresses.size;
    }
    calculateTransactionVolume24h() {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return this.confirmedTransactions
            .filter(tx => tx.timestamp > oneDayAgo)
            .reduce((sum, tx) => sum + tx.amount, 0);
    }
    calculateAverageTransactionFee() {
        if (this.confirmedTransactions.length === 0)
            return 0;
        const totalFees = this.confirmedTransactions.reduce((sum, tx) => sum + tx.fee, 0);
        return totalFees / this.confirmedTransactions.length;
    }
    calculateMarketEfficiency() {
        // Simplified market efficiency calculation
        const recentTransactions = this.confirmedTransactions.slice(-1000);
        if (recentTransactions.length < 10)
            return 0.5;
        const priceVolatility = this.calculatePriceVolatility();
        const volumeStability = this.calculateVolumeStability();
        return (priceVolatility + volumeStability) / 2;
    }
    calculatePriceVolatility() {
        // Simplified volatility calculation
        const prices = this.confirmedTransactions
            .slice(-100)
            .map(tx => this.pricingEngine.getCurrentPrice(tx.tokenId));
        if (prices.length < 2)
            return 0.5;
        const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
        const volatility = Math.sqrt(variance) / mean;
        return Math.max(0, 1 - volatility); // Higher volatility = lower efficiency
    }
    calculateVolumeStability() {
        // Simplified volume stability calculation
        const volumes = this.confirmedTransactions
            .slice(-100)
            .map(tx => tx.amount);
        if (volumes.length < 2)
            return 0.5;
        const mean = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
        const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - mean, 2), 0) / volumes.length;
        const cv = Math.sqrt(variance) / mean; // Coefficient of variation
        return Math.max(0, 1 - cv); // Lower CV = higher stability
    }
    updateAgentReputation(agentId, change) {
        const agent = this.economicAgents.get(agentId);
        if (!agent)
            return;
        const reputationChange = change === 'positive' ? 0.01 : -0.05;
        agent.reputation = Math.max(0, Math.min(1, agent.reputation + reputationChange));
        agent.lastActivity = new Date();
    }
    registerEconomicAgent(agent) {
        this.economicAgents.set(agent.id, agent);
    }
    getTransactionHistory(address, limit = 100) {
        let transactions = this.confirmedTransactions;
        if (address) {
            transactions = transactions.filter(tx => tx.fromAddress === address || tx.toAddress === address);
        }
        return transactions.slice(-limit).reverse();
    }
    getPendingTransactions() {
        return Array.from(this.pendingTransactions.values());
    }
    getEconomicMetrics() {
        return this.transactionMetrics.value;
    }
    getTransactionMetricsObservable() {
        return this.transactionMetrics.asObservable();
    }
    getAgentReputation(agentId) {
        const agent = this.economicAgents.get(agentId);
        return agent ? agent.reputation : 0;
    }
}
exports.TransactionProcessor = TransactionProcessor;
//# sourceMappingURL=TransactionProcessor.js.map