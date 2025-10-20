"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicPricingEngine = void 0;
const rxjs_1 = require("rxjs");
class DynamicPricingEngine {
    constructor() {
        this.pricingModels = new Map();
        this.marketData = new Map();
        this.economicMetrics = null;
        this.priceUpdates = new rxjs_1.BehaviorSubject(new Map());
        this.initializeDefaultPricingModels();
    }
    initializeDefaultPricingModels() {
        // NEON token pricing model
        const neonPricing = {
            id: 'neon-pricing',
            tokenId: 'neon-token',
            modelType: 'dynamic',
            basePrice: 1.0,
            currentPrice: 1.0,
            minPrice: 0.1,
            maxPrice: 10.0,
            adjustmentFactor: 0.05,
            lastAdjustment: new Date(),
            parameters: {
                demandElasticity: 0.8,
                supplyElasticity: 0.6,
                volatilityThreshold: 0.1,
                adjustmentCooldown: 300000 // 5 minutes
            }
        };
        this.pricingModels.set(neonPricing.id, neonPricing);
    }
    updateMarketData(tokenId, data) {
        const existing = this.marketData.get(tokenId) || {
            tokenId,
            price: 0,
            volume24h: 0,
            marketCap: 0,
            priceChange24h: 0,
            priceChange7d: 0,
            liquidity: 0,
            timestamp: new Date()
        };
        const updated = {
            ...existing,
            ...data,
            timestamp: new Date()
        };
        this.marketData.set(tokenId, updated);
        this.adjustPricing(tokenId);
    }
    updateEconomicMetrics(metrics) {
        this.economicMetrics = metrics;
        this.adjustAllPricing();
    }
    adjustPricing(tokenId) {
        const model = Array.from(this.pricingModels.values())
            .find(m => m.tokenId === tokenId);
        if (!model)
            return;
        const marketData = this.marketData.get(tokenId);
        if (!marketData)
            return;
        // Check cooldown period
        const timeSinceLastAdjustment = Date.now() - model.lastAdjustment.getTime();
        if (timeSinceLastAdjustment < (model.parameters.adjustmentCooldown || 300000)) {
            return;
        }
        const newPrice = this.calculateDynamicPrice(model, marketData);
        const clampedPrice = Math.max(model.minPrice, Math.min(model.maxPrice, newPrice));
        if (Math.abs(clampedPrice - model.currentPrice) / model.currentPrice > model.parameters.volatilityThreshold) {
            model.currentPrice = clampedPrice;
            model.lastAdjustment = new Date();
            // Emit price update
            const updates = this.priceUpdates.value;
            updates.set(tokenId, clampedPrice);
            this.priceUpdates.next(new Map(updates));
        }
    }
    calculateDynamicPrice(model, marketData) {
        let price = model.currentPrice;
        // Volume-based adjustment
        const volumeFactor = Math.log(marketData.volume24h + 1) / Math.log(1000000); // Normalize volume
        price *= (1 + volumeFactor * model.adjustmentFactor);
        // Price change momentum
        const momentumFactor = marketData.priceChange24h / 100; // Convert percentage to decimal
        price *= (1 + momentumFactor * model.adjustmentFactor * 0.5);
        // Economic metrics influence
        if (this.economicMetrics) {
            const efficiencyFactor = this.economicMetrics.marketEfficiency - 0.5;
            price *= (1 + efficiencyFactor * model.adjustmentFactor * 0.3);
            // Transaction volume influence
            const volumeEfficiency = Math.min(this.economicMetrics.transactionVolume24h / 1000000, 1);
            price *= (1 + volumeEfficiency * model.adjustmentFactor * 0.2);
        }
        // Demand elasticity
        const demandElasticity = model.parameters.demandElasticity || 0.8;
        const supplyElasticity = model.parameters.supplyElasticity || 0.6;
        // Apply elasticity factors
        price *= (1 + demandElasticity * 0.1);
        price *= (1 - supplyElasticity * 0.05);
        return price;
    }
    adjustAllPricing() {
        for (const model of this.pricingModels.values()) {
            this.adjustPricing(model.tokenId);
        }
    }
    getCurrentPrice(tokenId) {
        const model = Array.from(this.pricingModels.values())
            .find(m => m.tokenId === tokenId);
        return model ? model.currentPrice : 0;
    }
    getPricingModel(tokenId) {
        return Array.from(this.pricingModels.values())
            .find(m => m.tokenId === tokenId);
    }
    createPricingModel(modelData) {
        const model = {
            ...modelData,
            id: `pricing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            lastAdjustment: new Date()
        };
        this.pricingModels.set(model.id, model);
        return model;
    }
    updatePricingModel(modelId, updates) {
        const model = this.pricingModels.get(modelId);
        if (!model)
            return false;
        Object.assign(model, updates);
        return true;
    }
    getMarketData(tokenId) {
        return this.marketData.get(tokenId);
    }
    getAllPricingModels() {
        return Array.from(this.pricingModels.values());
    }
    getPriceUpdateObservable() {
        return this.priceUpdates.asObservable();
    }
    calculatePriceImpact(tokenId, tradeSize, isBuy) {
        const model = Array.from(this.pricingModels.values())
            .find(m => m.tokenId === tokenId);
        if (!model)
            return 0;
        const marketData = this.marketData.get(tokenId);
        if (!marketData)
            return 0;
        // Calculate price impact based on trade size relative to liquidity
        const liquidityRatio = tradeSize / marketData.liquidity;
        const impact = liquidityRatio * model.adjustmentFactor;
        return isBuy ? impact : -impact;
    }
    getPricePrediction(tokenId, timeHorizon) {
        const model = Array.from(this.pricingModels.values())
            .find(m => m.tokenId === tokenId);
        if (!model)
            return [];
        const predictions = [];
        let currentPrice = model.currentPrice;
        // Simple trend-based prediction
        const marketData = this.marketData.get(tokenId);
        const trend = marketData ? marketData.priceChange24h / 100 : 0;
        for (let i = 0; i < timeHorizon; i++) {
            currentPrice *= (1 + trend * 0.1); // Dampened trend
            currentPrice = Math.max(model.minPrice, Math.min(model.maxPrice, currentPrice));
            predictions.push(currentPrice);
        }
        return predictions;
    }
    getPricingAnalytics(tokenId) {
        const model = Array.from(this.pricingModels.values())
            .find(m => m.tokenId === tokenId);
        const marketData = this.marketData.get(tokenId);
        if (!model || !marketData)
            return null;
        const volatility = Math.abs(marketData.priceChange24h) / 100;
        const liquidityRatio = marketData.liquidity / marketData.volume24h;
        return {
            tokenId,
            currentPrice: model.currentPrice,
            priceRange: `${model.minPrice} - ${model.maxPrice}`,
            volatility,
            liquidityRatio,
            adjustmentFrequency: Date.now() - model.lastAdjustment.getTime(),
            marketEfficiency: this.economicMetrics?.marketEfficiency || 0,
            pricePredictions: this.getPricePrediction(tokenId, 5)
        };
    }
}
exports.DynamicPricingEngine = DynamicPricingEngine;
//# sourceMappingURL=DynamicPricingEngine.js.map