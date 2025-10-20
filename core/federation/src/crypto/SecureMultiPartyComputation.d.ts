import { Logger } from '../utils/Logger';
import { SecureComputationRequest } from '../types';
export declare class SecureMultiPartyComputation {
    private logger;
    constructor(logger: Logger);
    /**
     * Performs secure multi-party computation
     */
    performComputation(request: SecureComputationRequest): Promise<any>;
    /**
     * Implements secret sharing based computation
     */
    private secretSharingComputation;
    /**
     * Implements homomorphic encryption based computation
     */
    private homomorphicComputation;
    /**
     * Implements general multi-party computation
     */
    private multiPartyComputation;
    /**
     * Generates shares for secret sharing
     */
    private generateShares;
    /**
     * Computes on secret shares
     */
    private computeOnShares;
    /**
     * Reconstructs secret from shares
     */
    private reconstructShares;
    /**
     * Simulates encryption for homomorphic computation
     */
    private simulateEncryption;
    /**
     * Simulates decryption for homomorphic computation
     */
    private simulateDecryption;
    /**
     * Computes homomorphically on encrypted data
     */
    private computeHomomorphically;
    /**
     * Performs one round of secure computation
     */
    private secureComputationRound;
    /**
     * Aggregates results from multi-party computation
     */
    private aggregateResults;
    /**
     * Validates computation request
     */
    validateRequest(request: SecureComputationRequest): {
        isValid: boolean;
        reason?: string;
    };
}
//# sourceMappingURL=SecureMultiPartyComputation.d.ts.map