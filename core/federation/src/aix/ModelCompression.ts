import { CompressionConfig, CompressionAlgorithm } from '../types';
import { Logger } from '../utils/Logger';
import { ConsoleLogger } from '../utils/Logger';

export class ModelCompression {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new ConsoleLogger();
  }

  /**
   * Compress model weights using quantization
   */
  quantizeWeights(
    weights: Record<string, number[][]>,
    bits: number = 8
  ): Record<string, number[][]> {
    const quantized: Record<string, number[][]> = {};

    for (const [layerName, layerWeights] of Object.entries(weights)) {
      quantized[layerName] = layerWeights.map(row =>
        row.map(value => this.quantizeValue(value, bits))
      );
    }

    this.logger.info(`Quantized model weights to ${bits} bits`);
    return quantized;
  }

  /**
   * Apply pruning to model weights
   */
  pruneWeights(
    weights: Record<string, number[][]>,
    threshold: number = 0.01
  ): Record<string, number[][]> {
    const pruned: Record<string, number[][]> = {};

    for (const [layerName, layerWeights] of Object.entries(weights)) {
      pruned[layerName] = layerWeights.map(row =>
        row.map(value => Math.abs(value) < threshold ? 0 : value)
      );
    }

    this.logger.info(`Pruned model weights with threshold ${threshold}`);
    return pruned;
  }

  /**
   * Compress model using sparse coding
   */
  sparseEncode(
    weights: Record<string, number[][]>,
    sparsityRatio: number = 0.1
  ): { encoded: Record<string, number[][]>; mask: Record<string, boolean[][]> } {
    const encoded: Record<string, number[][]> = {};
    const mask: Record<string, boolean[][]> = {};

    for (const [layerName, layerWeights] of Object.entries(weights)) {
      const layerMask: boolean[][] = [];
      const layerEncoded: number[][] = [];

      for (const row of layerWeights) {
        const rowMask: boolean[] = [];
        const rowEncoded: number[] = [];

        // Keep only top (1-sparsityRatio) percentage of values
        const threshold = this.getSparseThreshold(row, sparsityRatio);

        for (const value of row) {
          if (Math.abs(value) >= threshold) {
            rowEncoded.push(value);
            rowMask.push(true);
          } else {
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
  sparseDecode(
    encoded: Record<string, number[][]>,
    mask: Record<string, boolean[][]>
  ): Record<string, number[][]> {
    const decoded: Record<string, number[][]> = {};

    for (const [layerName, layerEncoded] of Object.entries(encoded)) {
      const layerMask = mask[layerName];
      const layerDecoded: number[][] = [];

      for (let i = 0; i < layerEncoded.length; i++) {
        const rowEncoded = layerEncoded[i];
        const rowMask = layerMask[i];
        const rowDecoded: number[] = [];
        let encodedIndex = 0;

        for (const isKept of rowMask) {
          if (isKept) {
            rowDecoded.push(rowEncoded[encodedIndex]);
            encodedIndex++;
          } else {
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
  lowRankApproximation(
    weights: Record<string, number[][]>,
    rank: number
  ): Record<string, number[][]> {
    const approximated: Record<string, number[][]> = {};

    for (const [layerName, layerWeights] of Object.entries(weights)) {
      approximated[layerName] = this.svdApproximation(layerWeights, rank);
    }

    this.logger.info(`Applied low-rank approximation with rank ${rank}`);
    return approximated;
  }

  /**
   * Compress model data based on configuration
   */
  async compress(
    modelData: any,
    config: CompressionConfig
  ): Promise<any> {
    let compressedData = { ...modelData };

    switch (config.algorithm) {
      case CompressionAlgorithm.QUANTIZATION:
        if (config.quantizationBits && modelData.weights) {
          compressedData.weights = this.quantizeWeights(modelData.weights, config.quantizationBits);
        }
        break;

      case CompressionAlgorithm.PRUNING:
        if (modelData.weights) {
          compressedData.weights = this.pruneWeights(modelData.weights, config.pruningRatio || 0.01);
        }
        break;

      case CompressionAlgorithm.SPARSE_CODING:
        if (modelData.weights) {
          const { encoded, mask } = this.sparseEncode(modelData.weights, config.pruningRatio || 0.1);
          compressedData.weights = encoded;
          compressedData.sparseMask = mask;
        }
        break;

      case CompressionAlgorithm.LOW_RANK_APPROXIMATION:
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
  async decompress(compressedData: any): Promise<any> {
    if (!compressedData.compressed) {
      return compressedData;
    }

    let decompressedData = { ...compressedData };

    switch (compressedData.compressionConfig.algorithm) {
      case CompressionAlgorithm.SPARSE_CODING:
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
  calculateCompressionRatio(original: any, compressed: any): number {
    const originalSize = this.calculateSize(original);
    const compressedSize = this.calculateSize(compressed);
    return originalSize / compressedSize;
  }

  private quantizeValue(value: number, bits: number): number {
    const maxValue = Math.pow(2, bits - 1) - 1;
    const scale = maxValue / Math.max(Math.abs(Math.max(...[value])), 1);
    return Math.round(value * scale) / scale;
  }

  private getSparseThreshold(values: number[], sparsityRatio: number): number {
    const sortedValues = values.map(Math.abs).sort((a, b) => b - a);
    const keepCount = Math.floor(values.length * (1 - sparsityRatio));
    return sortedValues[keepCount] || 0;
  }

  private svdApproximation(matrix: number[][], rank: number): number[][] {
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

  private calculateSize(data: any): number {
    return JSON.stringify(data).length;
  }
}