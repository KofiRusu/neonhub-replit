"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelValidation = void 0;
class ModelValidation {
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Validates a model update for basic sanity checks
     */
    validateModelUpdate(modelUpdate) {
        try {
            // Check if model version is valid
            if (!modelUpdate.modelVersion || modelUpdate.modelVersion.trim() === '') {
                return { isValid: false, reason: 'Invalid model version' };
            }
            // Check if weights exist
            if (!modelUpdate.weights || Object.keys(modelUpdate.weights).length === 0) {
                return { isValid: false, reason: 'No model weights provided' };
            }
            // Check weight dimensions and values
            for (const [layerId, weights] of Object.entries(modelUpdate.weights)) {
                if (!Array.isArray(weights) || weights.length === 0) {
                    return { isValid: false, reason: `Invalid weights for layer ${layerId}` };
                }
                // Check for NaN or infinite values
                for (const row of weights) {
                    if (!Array.isArray(row)) {
                        return { isValid: false, reason: `Invalid weight matrix for layer ${layerId}` };
                    }
                    for (const weight of row) {
                        if (typeof weight !== 'number' || isNaN(weight) || !isFinite(weight)) {
                            return { isValid: false, reason: `Invalid weight value in layer ${layerId}` };
                        }
                    }
                }
            }
            // Check metadata
            if (!modelUpdate.metadata) {
                return { isValid: false, reason: 'Missing model metadata' };
            }
            return { isValid: true };
        }
        catch (error) {
            this.logger.error('Error validating model update', error);
            return { isValid: false, reason: 'Validation error occurred' };
        }
    }
    /**
     * Detects potential model poisoning using statistical analysis
     */
    detectPoisoning(modelUpdates, globalModel) {
        const results = [];
        if (modelUpdates.length < 2) {
            this.logger.warn('Need at least 2 model updates for poisoning detection');
            return results;
        }
        // Calculate statistical measures for each layer
        const layerStats = this.calculateLayerStatistics(modelUpdates);
        for (const update of modelUpdates) {
            const detectionResult = this.analyzeModelForPoisoning(update, layerStats, globalModel);
            results.push(detectionResult);
        }
        return results;
    }
    /**
     * Calculates statistical measures for model layers
     */
    calculateLayerStatistics(modelUpdates) {
        const layerStats = {};
        // Get all layer IDs
        const layerIds = new Set();
        for (const update of modelUpdates) {
            Object.keys(update.weights).forEach(id => layerIds.add(id));
        }
        // Calculate statistics for each layer
        layerIds.forEach(layerId => {
            const layerValues = [];
            for (const update of modelUpdates) {
                const weights = update.weights[layerId];
                if (weights) {
                    // Flatten weights and collect all values
                    for (const row of weights) {
                        layerValues.push(...row);
                    }
                }
            }
            if (layerValues.length > 0) {
                const mean = layerValues.reduce((sum, val) => sum + val, 0) / layerValues.length;
                const variance = layerValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / layerValues.length;
                const std = Math.sqrt(variance);
                const sorted = layerValues.sort((a, b) => a - b);
                const median = sorted[Math.floor(sorted.length / 2)];
                layerStats[layerId] = { mean, std, median };
            }
        });
        return layerStats;
    }
    /**
     * Analyzes a single model for poisoning indicators
     */
    analyzeModelForPoisoning(modelUpdate, layerStats, globalModel) {
        let totalAnomalyScore = 0;
        let layerCount = 0;
        // Analyze each layer for anomalies
        for (const [layerId, weights] of Object.entries(modelUpdate.weights)) {
            const stats = layerStats[layerId];
            if (!stats)
                continue;
            // Flatten weights for analysis
            const flatWeights = [];
            for (const row of weights) {
                flatWeights.push(...row);
            }
            // Calculate z-scores for weight values
            const zScores = flatWeights.map(weight => Math.abs((weight - stats.mean) / stats.std));
            const avgZScore = zScores.reduce((sum, z) => sum + z, 0) / zScores.length;
            // Calculate deviation from median
            const medianDeviations = flatWeights.map(weight => Math.abs(weight - stats.median));
            const avgMedianDeviation = medianDeviations.reduce((sum, d) => sum + d, 0) / medianDeviations.length;
            // Simple anomaly score (higher = more suspicious)
            const anomalyScore = (avgZScore * 0.7) + (avgMedianDeviation * 0.3);
            totalAnomalyScore += anomalyScore;
            layerCount++;
        }
        const averageAnomalyScore = layerCount > 0 ? totalAnomalyScore / layerCount : 0;
        // Determine if model is poisoned based on threshold
        const isPoisoned = averageAnomalyScore > 3.0; // Configurable threshold
        const confidence = Math.min(averageAnomalyScore / 5.0, 1.0); // Normalize to 0-1
        return {
            nodeId: 'unknown', // Would be set by caller
            isPoisoned,
            confidence,
            detectionMethod: 'statistical_anomaly_detection',
            timestamp: Date.now()
        };
    }
    /**
     * Compares model updates for consistency
     */
    compareModelConsistency(modelA, modelB) {
        let totalDifference = 0;
        let layerCount = 0;
        const allLayerIds = new Set([...Object.keys(modelA.weights), ...Object.keys(modelB.weights)]);
        allLayerIds.forEach(layerId => {
            const weightsA = modelA.weights[layerId];
            const weightsB = modelB.weights[layerId];
            if (weightsA && weightsB && weightsA.length === weightsB.length) {
                let layerDifference = 0;
                let valueCount = 0;
                for (let i = 0; i < weightsA.length; i++) {
                    if (weightsA[i].length === weightsB[i].length) {
                        for (let j = 0; j < weightsA[i].length; j++) {
                            layerDifference += Math.abs(weightsA[i][j] - weightsB[i][j]);
                            valueCount++;
                        }
                    }
                }
                if (valueCount > 0) {
                    totalDifference += layerDifference / valueCount;
                    layerCount++;
                }
            }
        });
        return layerCount > 0 ? totalDifference / layerCount : 1.0;
    }
}
exports.ModelValidation = ModelValidation;
//# sourceMappingURL=ModelValidation.js.map