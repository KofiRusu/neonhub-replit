import { PricingModel, MarketData, EconomicMetrics } from '../types';
export declare class DynamicPricingEngine {
    private pricingModels;
    private marketData;
    private economicMetrics;
    private priceUpdates;
    constructor();
    private initializeDefaultPricingModels;
    updateMarketData(tokenId: string, data: Partial<MarketData>): void;
    updateEconomicMetrics(metrics: EconomicMetrics): void;
    private adjustPricing;
    private calculateDynamicPrice;
    private adjustAllPricing;
    getCurrentPrice(tokenId: string): number;
    getPricingModel(tokenId: string): PricingModel | undefined;
    createPricingModel(modelData: Omit<PricingModel, 'id' | 'lastAdjustment'>): PricingModel;
    updatePricingModel(modelId: string, updates: Partial<PricingModel>): boolean;
    getMarketData(tokenId: string): MarketData | undefined;
    getAllPricingModels(): PricingModel[];
    getPriceUpdateObservable(): import("rxjs").Observable<Map<string, number>>;
    calculatePriceImpact(tokenId: string, tradeSize: number, isBuy: boolean): number;
    getPricePrediction(tokenId: string, timeHorizon: number): number[];
    getPricingAnalytics(tokenId: string): any;
}
//# sourceMappingURL=DynamicPricingEngine.d.ts.map