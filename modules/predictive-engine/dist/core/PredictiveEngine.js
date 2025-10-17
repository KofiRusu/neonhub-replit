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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictiveEngine = void 0;
const baselineLoader_1 = require("../utils/baselineLoader");
const winston = __importStar(require("winston"));
class PredictiveEngine {
    constructor(thresholds) {
        this.historicalData = [];
        this.thresholds = thresholds;
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'predictive-engine.log' })
            ]
        });
    }
    async initialize() {
        try {
            this.baselineMetrics = await baselineLoader_1.BaselineLoader.loadV31Baseline();
            this.logger.info('Predictive engine initialized with v3.1 baseline metrics');
        }
        catch (error) {
            this.logger.error('Failed to load baseline metrics', error);
            throw error;
        }
    }
    async predictTrafficLoad(currentMetrics) {
        // Simple time-series prediction using moving averages
        const recentTraffic = this.historicalData.slice(-7).map(m => m.traffic.totalPageViews);
        const avgTraffic = recentTraffic.reduce((a, b) => a + b, 0) / recentTraffic.length;
        // Calculate trend
        const trend = recentTraffic.length > 1 ?
            (recentTraffic[recentTraffic.length - 1] - recentTraffic[0]) / recentTraffic.length : 0;
        const predictedValue = avgTraffic + trend;
        const confidence = Math.min(0.95, Math.max(0.5, 1 - Math.abs(trend) / avgTraffic));
        return {
            predictedValue,
            confidence,
            upperBound: predictedValue * 1.2,
            lowerBound: predictedValue * 0.8,
            timestamp: new Date(),
            modelVersion: 'v3.2.0'
        };
    }
    async predictLatency(currentMetrics) {
        const recentLatency = this.historicalData.slice(-7).map(m => m.latency.apiResponseTimeAvg);
        const avgLatency = recentLatency.reduce((a, b) => a + b, 0) / recentLatency.length;
        // Predict based on traffic correlation
        const trafficCorrelation = this.calculateTrafficLatencyCorrelation();
        const predictedTraffic = await this.predictTrafficLoad(currentMetrics);
        const predictedLatency = avgLatency * (1 + trafficCorrelation * (predictedTraffic.predictedValue / currentMetrics.traffic.totalPageViews - 1));
        return {
            predictedValue: predictedLatency,
            confidence: 0.85,
            upperBound: predictedLatency * 1.15,
            lowerBound: predictedLatency * 0.9,
            timestamp: new Date(),
            modelVersion: 'v3.2.0'
        };
    }
    async predictErrorRate(currentMetrics) {
        const recentErrors = this.historicalData.slice(-7).map(m => m.errors.apiErrorRate);
        const avgErrorRate = recentErrors.reduce((a, b) => a + b, 0) / recentErrors.length;
        // Error rates tend to be stable unless there's a degradation
        const predictedValue = avgErrorRate * (1 + (currentMetrics.errors.apiErrorRate > this.thresholds.errorRateThreshold ? 0.1 : 0));
        return {
            predictedValue,
            confidence: 0.9,
            upperBound: predictedValue * 1.5,
            lowerBound: Math.max(0, predictedValue * 0.5),
            timestamp: new Date(),
            modelVersion: 'v3.2.0'
        };
    }
    async makeScalingDecision(currentMetrics) {
        const trafficPrediction = await this.predictTrafficLoad(currentMetrics);
        const latencyPrediction = await this.predictLatency(currentMetrics);
        const errorPrediction = await this.predictErrorRate(currentMetrics);
        // Calculate scaling score based on multiple factors
        const trafficScore = trafficPrediction.predictedValue / this.baselineMetrics.traffic.totalPageViews;
        const latencyScore = latencyPrediction.predictedValue / this.baselineMetrics.latency.apiResponseTimeAvg;
        const errorScore = errorPrediction.predictedValue / this.baselineMetrics.errors.apiErrorRate;
        const overallScore = (trafficScore * 0.4) + (latencyScore * 0.4) + (errorScore * 0.2);
        let action = 'no_action';
        let targetReplicas = 1; // Current assumption
        let reason = '';
        if (overallScore > 1.3) {
            action = 'scale_up';
            targetReplicas = Math.ceil(overallScore);
            reason = 'Predicted high load based on traffic, latency, and error trends';
        }
        else if (overallScore < 0.7) {
            action = 'scale_down';
            targetReplicas = Math.max(1, Math.floor(overallScore));
            reason = 'Predicted low load allowing for resource optimization';
        }
        else {
            reason = 'Load within acceptable thresholds';
        }
        const confidence = Math.min(trafficPrediction.confidence, latencyPrediction.confidence, errorPrediction.confidence);
        return {
            action,
            targetReplicas,
            reason,
            confidence,
            predictedLoad: overallScore
        };
    }
    updateHistoricalData(metrics) {
        this.historicalData.push(metrics);
        // Keep only last 30 days of data
        if (this.historicalData.length > 30) {
            this.historicalData = this.historicalData.slice(-30);
        }
    }
    calculateTrafficLatencyCorrelation() {
        if (this.historicalData.length < 2)
            return 0;
        const traffic = this.historicalData.map(m => m.traffic.totalPageViews);
        const latency = this.historicalData.map(m => m.latency.apiResponseTimeAvg);
        // Simple correlation coefficient
        const n = traffic.length;
        const sumTraffic = traffic.reduce((a, b) => a + b, 0);
        const sumLatency = latency.reduce((a, b) => a + b, 0);
        const sumTrafficLatency = traffic.reduce((sum, t, i) => sum + t * latency[i], 0);
        const sumTrafficSq = traffic.reduce((sum, t) => sum + t * t, 0);
        const sumLatencySq = latency.reduce((sum, l) => sum + l * l, 0);
        const numerator = n * sumTrafficLatency - sumTraffic * sumLatency;
        const denominator = Math.sqrt((n * sumTrafficSq - sumTraffic * sumTraffic) * (n * sumLatencySq - sumLatency * sumLatency));
        return denominator === 0 ? 0 : numerator / denominator;
    }
    getBaselineMetrics() {
        return this.baselineMetrics;
    }
    getHistoricalData() {
        return [...this.historicalData];
    }
}
exports.PredictiveEngine = PredictiveEngine;
//# sourceMappingURL=PredictiveEngine.js.map