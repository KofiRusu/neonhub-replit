"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelCompression = void 0;
const types_1 = require("../types");
const Logger_1 = require("../utils/Logger");
class ModelCompression {
    constructor(logger) {
        this.logger = logger || new Logger_1.ConsoleLogger();
    }
    /**
     * Compress model weights using quantization
     */
    quantizeWeights(weights, bits = 8) {
        const quantized = {};
        for (const [layerName, layerWeights] of Object.entries(weights)) {
            quantized[layerName] = layerWeights.map(row => row.map(value => this.quantizeValue(value, bits)));
        }
        this.logger.info(`Quantized model weights to ${bits} bits`);
        return quantized;
    }
    /**
     * Apply pruning to model weights
     */
    pruneWeights(weights, threshold = 0.01) {
        const pruned = {};
        for (const [layerName, layerWeights] of Object.entries(weights)) {
            pruned[layerName] = layerWeights.map(row => row.map(value => Math.abs(value) < threshold ? 0 : value));
        }
        this.logger.info(`Pruned model weights with threshold ${threshold}`);
        return pruned;
    }
    /**
     * Compress model using sparse coding
     */
    sparseEncode(weights, sparsityRatio = 0.1) {
        const encoded = {};
        const mask = {};
        for (const [layerName, layerWeights] of Object.entries(weights)) {
            const layerMask = [];
            const layerEncoded = [];
            for (const row of layerWeights) {
                const rowMask = [];
                const rowEncoded = [];
                // Keep only top (1-sparsityRatio) percentage of values
                const threshold = this.getSparseThreshold(row, sparsityRatio);
                for (const value of row) {
                    if (Math.abs(value) >= threshold) {
                        rowEncoded.push(value);
                        rowMask.push(true);
                    }
                    else {
                        rowMask.push(false);
                    }
                }
                layerEncoded.push(rowEncoded);
                layerMask.push(rowMask);
            }
            encoded[layerName] = layerEncoded;
            mask[layerName] = layerMask;
        }
        this.logger.info(`Sparse encoded model with ${sparsityRatio * 100}% sparsity`);
        return { encoded, mask };
    }
    /**
     * Decompress sparse encoded model
     */
    sparseDecode(encoded, mask) {
        const decoded = {};
        for (const [layerName, layerEncoded] of Object.entries(encoded)) {
            const layerMask = mask[layerName];
            const layerDecoded = [];
            for (let i = 0; i < layerEncoded.length; i++) {
                const rowEncoded = layerEncoded[i];
                const rowMask = layerMask[i];
                const rowDecoded = [];
                let encodedIndex = 0;
                for (const isKept of rowMask) {
                    if (isKept) {
                        rowDecoded.push(rowEncoded[encodedIndex]);
                        encodedIndex++;
                    }
                    else {
                        rowDecoded.push(0);
                    }
                }
                layerDecoded.push(rowDecoded);
            }
            decoded[layerName] = layerDecoded;
        }
        this.logger.info('Sparse decoded model');
        return decoded;
    }
    /**
     * Apply low-rank approximation
     */
    lowRankApproximation(weights, rank) {
        const approximated = {};
        for (const [layerName, layerWeights] of Object.entries(weights)) {
            approximated[layerName] = this.svdApproximation(layerWeights, rank);
        }
        this.logger.info(`Applied low-rank approximation with rank ${rank}`);
        return approximated;
    }
    /**
     * Compress model data based on configuration
     */
    async compress(modelData, config) {
        let compressedData = { ...modelData };
        switch (config.algorithm) {
            case types_1.CompressionAlgorithm.QUANTIZATION:
                if (config.quantizationBits && modelData.weights) {
                    compressedData.weights = this.quantizeWeights(modelData.weights, config.quantizationBits);
                }
                break;
            case types_1.CompressionAlgorithm.PRUNING:
                if (modelData.weights) {
                    compressedData.weights = this.pruneWeights(modelData.weights, config.pruningRatio || 0.01);
                }
                break;
            case types_1.CompressionAlgorithm.SPARSE_CODING:
                if (modelData.weights) {
                    const { encoded, mask } = this.sparseEncode(modelData.weights, config.pruningRatio || 0.1);
                    compressedData.weights = encoded;
                    compressedData.sparseMask = mask;
                }
                break;
            case types_1.CompressionAlgorithm.LOW_RANK_APPROXIMATION:
                if (modelData.weights) {
                    compressedData.weights = this.lowRankApproximation(modelData.weights, config.quantizationBits || 10);
                }
                break;
        }
        compressedData.compressionConfig = config;
        compressedData.compressed = true;
        compressedData.originalSize = this.calculateSize(modelData);
        this.logger.info(`Compressed model using ${config.algorithm}`);
        return compressedData;
    }
    /**
     * Decompress model data
     */
    async decompress(compressedData) {
        if (!compressedData.compressed) {
            return compressedData;
        }
        let decompressedData = { ...compressedData };
        switch (compressedData.compressionConfig.algorithm) {
            case types_1.CompressionAlgorithm.SPARSE_CODING:
                if (decompressedData.weights && decompressedData.sparseMask) {
                    decompressedData.weights = this.sparseDecode(decompressedData.weights, decompressedData.sparseMask);
                    delete decompressedData.sparseMask;
                }
                break;
        }
        delete decompressedData.compressionConfig;
        delete decompressedData.compressed;
        delete decompressedData.originalSize;
        this.logger.info('Decompressed model data');
        return decompressedData;
    }
    /**
     * Calculate compression ratio
     */
    calculateCompressionRatio(original, compressed) {
        const originalSize = this.calculateSize(original);
        const compressedSize = this.calculateSize(compressed);
        return originalSize / compressedSize;
    }
    quantizeValue(value, bits) {
        const maxValue = Math.pow(2, bits - 1) - 1;
        const scale = maxValue / Math.max(Math.abs(Math.max(...[value])), 1);
        return Math.round(value * scale) / scale;
    }
    getSparseThreshold(values, sparsityRatio) {
        const sortedValues = values.map(Math.abs).sort((a, b) => b - a);
        const keepCount = Math.floor(values.length * (1 - sparsityRatio));
        return sortedValues[keepCount] || 0;
    }
    svdApproximation(matrix, rank) {
        // Simplified SVD approximation for 2D matrices
        // In practice, would use a proper SVD library
        const rows = matrix.length;
        const cols = matrix[0]?.length || 0;
        if (rows === 0 || cols === 0 || rank >= Math.min(rows, cols)) {
            return matrix;
        }
        // Placeholder implementation - would need proper SVD
        return matrix.slice(0, rank).map(row => row.slice(0, rank));
    }
    calculateSize(data) {
        return JSON.stringify(data).length;
    }
}
exports.ModelCompression = ModelCompression;
//# sourceMappingURL=ModelCompression.js.map