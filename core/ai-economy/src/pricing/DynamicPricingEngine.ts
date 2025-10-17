import { PricingModel, MarketData, EconomicMetrics } from '../types';
import { BehaviorSubject } from 'rxjs';

export class DynamicPricingEngine {
  private pricingModels: Map<string, PricingModel> = new Map();
  private marketData: Map<string, MarketData> = new Map();
  private economicMetrics: EconomicMetrics | null = null;
  private priceUpdates = new BehaviorSubject<Map<string, number>>(new Map());

  constructor() {
    this.initializeDefaultPricingModels();
  }

  private initializeDefaultPricingModels(): void {
    // NEON token pricing model
    const neonPricing: PricingModel = {
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

  public updateMarketData(tokenId: string, data: Partial<MarketData>): void {
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

    const updated: MarketData = {
      ...existing,
      ...data,
      timestamp: new Date()
    };

    this.marketData.set(tokenId, updated);
    this.adjustPricing(tokenId);
  }

  public updateEconomicMetrics(metrics: EconomicMetrics): void {
    this.economicMetrics = metrics;
    this.adjustAllPricing();
  }

  private adjustPricing(tokenId: string): void {
    const model = Array.from(this.pricingModels.values())
      .find(m => m.tokenId === tokenId);

    if (!model) return;

    const marketData = this.marketData.get(tokenId);
    if (!marketData) return;

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

  private calculateDynamicPrice(model: PricingModel, marketData: MarketData): number {
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

  private adjustAllPricing(): void {
    for (const model of this.pricingModels.values()) {
      this.adjustPricing(model.tokenId);
    }
  }

  public getCurrentPrice(tokenId: string): number {
    const model = Array.from(this.pricingModels.values())
      .find(m => m.tokenId === tokenId);

    return model ? model.currentPrice : 0;
  }

  public getPricingModel(tokenId: string): PricingModel | undefined {
    return Array.from(this.pricingModels.values())
      .find(m => m.tokenId === tokenId);
  }

  public createPricingModel(modelData: Omit<PricingModel, 'id' | 'lastAdjustment'>): PricingModel {
    const model: PricingModel = {
      ...modelData,
      id: `pricing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lastAdjustment: new Date()
    };

    this.pricingModels.set(model.id, model);
    return model;
  }

  public updatePricingModel(modelId: string, updates: Partial<PricingModel>): boolean {
    const model = this.pricingModels.get(modelId);
    if (!model) return false;

    Object.assign(model, updates);
    return true;
  }

  public getMarketData(tokenId: string): MarketData | undefined {
    return this.marketData.get(tokenId);
  }

  public getAllPricingModels(): PricingModel[] {
    return Array.from(this.pricingModels.values());
  }

  public getPriceUpdateObservable() {
    return this.priceUpdates.asObservable();
  }

  public calculatePriceImpact(tokenId: string, tradeSize: number, isBuy: boolean): number {
    const model = Array.from(this.pricingModels.values())
      .find(m => m.tokenId === tokenId);

    if (!model) return 0;

    const marketData = this.marketData.get(tokenId);
    if (!marketData) return 0;

    // Calculate price impact based on trade size relative to liquidity
    const liquidityRatio = tradeSize / marketData.liquidity;
    const impact = liquidityRatio * model.adjustmentFactor;

    return isBuy ? impact : -impact;
  }

  public getPricePrediction(tokenId: string, timeHorizon: number): number[] {
    const model = Array.from(this.pricingModels.values())
      .find(m => m.tokenId === tokenId);

    if (!model) return [];

    const predictions: number[] = [];
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

  public getPricingAnalytics(tokenId: string): any {
    const model = Array.from(this.pricingModels.values())
      .find(m => m.tokenId === tokenId);

    const marketData = this.marketData.get(tokenId);

    if (!model || !marketData) return null;

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