import { Logger } from '../utils/Logger';
import { ModelUpdate, GradientUpdate } from '../types';
import { HomomorphicEncryption } from '../crypto/HomomorphicEncryption';
export declare class SecureAggregation {
    private logger;
    private he;
    constructor(logger: Logger, he: HomomorphicEncryption);
    /**
     * Performs FedAvg aggregation
     */
    fedAvg(modelUpdates: ModelUpdate[], weights: number[]): Promise<ModelUpdate>;
    /**
     * Performs FedProx aggregation with proximal regularization
     */
    fedProx(modelUpdates: ModelUpdate[], weights: number[], mu?: number): Promise<ModelUpdate>;
    /**
     * Performs secure aggregation using homomorphic encryption
     */
    secureAggregation(encryptedUpdates: string[], weights: number[], publicKey: string): Promise<ModelUpdate>;
    /**
     * Aggregates gradients securely
     */
    aggregateGradients(gradientUpdates: GradientUpdate[], weights: number[]): Promise<GradientUpdate>;
    /**
     * Averages weight matrices
     */
    private averageWeights;
    /**
     * Averages gradient matrices
     */
    private averageGradients;
    /**
     * Simulates decryption of homomorphically encrypted data
     */
    private simulateDecryption;
}
//# sourceMappingURL=SecureAggregation.d.ts.map