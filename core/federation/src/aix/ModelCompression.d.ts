import { CompressionConfig } from '../types';
import { Logger } from '../utils/Logger';
export declare class ModelCompression {
    private logger;
    constructor(logger?: Logger);
    /**
     * Compress model weights using quantization
     */
    quantizeWeights(weights: Record<string, number[][]>, bits?: number): Record<string, number[][]>;
    /**
     * Apply pruning to model weights
     */
    pruneWeights(weights: Record<string, number[][]>, threshold?: number): Record<string, number[][]>;
    /**
     * Compress model using sparse coding
     */
    sparseEncode(weights: Record<string, number[][]>, sparsityRatio?: number): {
        encoded: Record<string, number[][]>;
        mask: Record<string, boolean[][]>;
    };
    /**
     * Decompress sparse encoded model
     */
    sparseDecode(encoded: Record<string, number[][]>, mask: Record<string, boolean[][]>): Record<string, number[][]>;
    /**
     * Apply low-rank approximation
     */
    lowRankApproximation(weights: Record<string, number[][]>, rank: number): Record<string, number[][]>;
    /**
     * Compress model data based on configuration
     */
    compress(modelData: any, config: CompressionConfig): Promise<any>;
    /**
     * Decompress model data
     */
    decompress(compressedData: any): Promise<any>;
    /**
     * Calculate compression ratio
     */
    calculateCompressionRatio(original: any, compressed: any): number;
    private quantizeValue;
    private getSparseThreshold;
    private svdApproximation;
    private calculateSize;
}
//# sourceMappingURL=ModelCompression.d.ts.map