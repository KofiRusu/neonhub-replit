"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureAggregation = void 0;
class SecureAggregation {
    constructor(logger, he) {
        this.logger = logger;
        this.he = he;
    }
    /**
     * Performs FedAvg aggregation
     */
    async fedAvg(modelUpdates, weights) {
        this.logger.info(`Performing FedAvg aggregation with ${modelUpdates.length} updates`);
        if (modelUpdates.length === 0) {
            throw new Error('No model updates to aggregate');
        }
        // Normalize weights
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        const normalizedWeights = weights.map(w => w / totalWeight);
        // Aggregate weights for each layer
        const aggregatedWeights = {};
        for (const layerId of Object.keys(modelUpdates[0].weights)) {
            const layerWeights = modelUpdates
                .map(update => update.weights[layerId])
                .filter(weights => weights !== undefined);
            if (layerWeights.length > 0) {
                aggregatedWeights[layerId] = this.averageWeights(layerWeights, normalizedWeights);
            }
        }
        // Aggregate metadata
        const avgAccuracy = modelUpdates.reduce((sum, update) => sum + (update.metadata.accuracy || 0), 0) / modelUpdates.length;
        const avgLoss = modelUpdates.reduce((sum, update) => sum + (update.metadata.loss || 0), 0) / modelUpdates.length;
        const totalDatasetSize = modelUpdates.reduce((sum, update) => sum + (update.metadata.datasetSize || 0), 0);
        const aggregatedModel = {
            modelVersion: `fedavg_${Date.now()}`,
            weights: aggregatedWeights,
            metadata: {
                accuracy: avgAccuracy,
                loss: avgLoss,
                epoch: Math.max(...modelUpdates.map(u => u.metadata.epoch || 0)),
                datasetSize: totalDatasetSize
            }
        };
        this.logger.info(`FedAvg aggregation completed for model ${aggregatedModel.modelVersion}`);
        return aggregatedModel;
    }
    /**
     * Performs FedProx aggregation with proximal regularization
     */
    async fedProx(modelUpdates, weights, mu = 0.01) {
        this.logger.info(`Performing FedProx aggregation with μ=${mu}`);
        // Start with FedAvg
        const fedAvgModel = await this.fedAvg(modelUpdates, weights);
        // Apply proximal regularization (simplified)
        // In practice, this would regularize towards the global model
        for (const layerId of Object.keys(fedAvgModel.weights)) {
            const layerWeights = fedAvgModel.weights[layerId];
            // Apply small regularization term
            fedAvgModel.weights[layerId] = layerWeights.map(row => row.map(weight => weight * (1 - mu)));
        }
        fedAvgModel.modelVersion = `fedprox_${Date.now()}`;
        this.logger.info(`FedProx aggregation completed for model ${fedAvgModel.modelVersion}`);
        return fedAvgModel;
    }
    /**
     * Performs secure aggregation using homomorphic encryption
     */
    async secureAggregation(encryptedUpdates, weights, publicKey) {
        this.logger.info(`Performing secure aggregation with ${encryptedUpdates.length} encrypted updates`);
        // Aggregate encrypted updates homomorphically
        const aggregatedEncrypted = this.he.aggregateEncryptedUpdates(encryptedUpdates, weights, publicKey);
        // In practice, the coordinator would not decrypt - this would be done by a trusted third party
        // or using secure multi-party computation. For demo purposes, we'll simulate decryption
        const decryptedWeights = this.simulateDecryption(aggregatedEncrypted);
        const aggregatedModel = {
            modelVersion: `secure_${Date.now()}`,
            weights: { 'layer1': decryptedWeights },
            metadata: {
                accuracy: 0.85,
                loss: 0.3,
                epoch: 100,
                datasetSize: 10000
            },
            encrypted: false
        };
        this.logger.info(`Secure aggregation completed for model ${aggregatedModel.modelVersion}`);
        return aggregatedModel;
    }
    /**
     * Aggregates gradients securely
     */
    async aggregateGradients(gradientUpdates, weights) {
        this.logger.info(`Aggregating gradients from ${gradientUpdates.length} updates`);
        if (gradientUpdates.length === 0) {
            throw new Error('No gradient updates to aggregate');
        }
        // For simplicity, assume all updates have the same structure
        const firstUpdate = gradientUpdates[0];
        const numLayers = firstUpdate.gradients.length;
        // Aggregate gradients layer by layer
        const aggregatedGradients = [];
        for (let layerIdx = 0; layerIdx < numLayers; layerIdx++) {
            const layerGradients = gradientUpdates.map(update => update.gradients[layerIdx]);
            aggregatedGradients.push(this.averageGradients([layerGradients], weights)[0]);
        }
        const result = {
            layerId: 'aggregated',
            gradients: aggregatedGradients,
            timestamp: Date.now()
        };
        this.logger.info('Gradient aggregation completed');
        return result;
    }
    /**
     * Averages weight matrices
     */
    averageWeights(weightMatrices, weights) {
        if (weightMatrices.length === 0)
            return [];
        const rows = weightMatrices[0].length;
        const cols = weightMatrices[0][0]?.length || 0;
        const result = [];
        for (let i = 0; i < rows; i++) {
            result[i] = [];
            for (let j = 0; j < cols; j++) {
                let sum = 0;
                for (let k = 0; k < weightMatrices.length; k++) {
                    sum += weightMatrices[k][i][j] * weights[k];
                }
                result[i][j] = sum;
            }
        }
        return result;
    }
    /**
     * Averages gradient matrices
     */
    averageGradients(gradientMatrices, weights) {
        return this.averageWeights(gradientMatrices, weights);
    }
    /**
     * Simulates decryption of homomorphically encrypted data
     */
    simulateDecryption(encryptedData) {
        // In practice, this would use proper HE decryption
        // For demo purposes, return mock data
        return [
            [0.1, 0.2, 0.3],
            [0.4, 0.5, 0.6],
            [0.7, 0.8, 0.9]
        ];
    }
}
exports.SecureAggregation = SecureAggregation;
//# sourceMappingURL=SecureAggregation.js.map