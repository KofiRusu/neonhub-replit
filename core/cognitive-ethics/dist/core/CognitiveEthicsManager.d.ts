/**
 * CognitiveEthicsManager - Central orchestrator for ethics evaluation
 * Coordinates all evaluators and enforces ethical AI policies
 */
import { EthicsPolicy, EthicsEvaluationResult, AgentEthicsContext } from '../types';
export declare class CognitiveEthicsManager {
    private fairnessEvaluator;
    private safetyEvaluator;
    private privacyEvaluator;
    private policy;
    constructor(policy: EthicsPolicy);
    /**
     * Comprehensive ethics evaluation
     */
    evaluate(context: AgentEthicsContext, input: any, output: any): Promise<EthicsEvaluationResult>;
    /**
     * Pre-execution check
     */
    preCheck(context: AgentEthicsContext, input: any): Promise<{
        passed: boolean;
        violations: any[];
    }>;
    /**
     * Post-execution check with full evaluation
     */
    postCheck(context: AgentEthicsContext, input: any, output: any): Promise<EthicsEvaluationResult>;
    /**
     * Generate unique evaluation ID
     */
    private generateEvaluationId;
    /**
     * Generate cryptographic attestation
     */
    private generateAttestation;
    /**
     * Sign attestation (placeholder - should use proper key management)
     */
    private signAttestation;
    /**
     * Compute Merkle root for attestation chain
     */
    private computeMerkleRoot;
    /**
     * Update policy at runtime
     */
    updatePolicy(policy: EthicsPolicy): void;
    /**
     * Get current policy
     */
    getPolicy(): EthicsPolicy;
}
//# sourceMappingURL=CognitiveEthicsManager.d.ts.map