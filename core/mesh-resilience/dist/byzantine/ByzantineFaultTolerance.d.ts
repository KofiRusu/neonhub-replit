/**
 * Byzantine Fault Tolerance Manager
 * Implements consensus algorithms to handle malicious or faulty nodes
 * in the distributed mesh network
 */
import { EventEmitter } from 'eventemitter3';
import { MeshNode, ByzantineVote } from '../types';
export declare class ByzantineFaultTolerance extends EventEmitter {
    private nodeId;
    private knownNodes;
    private activeRounds;
    private nodeReputations;
    private minConsensusNodes;
    private consensusThreshold;
    constructor(nodeId: string, minConsensusNodes?: number);
    /**
     * Register a node in the mesh
     */
    registerNode(node: MeshNode): void;
    /**
     * Remove a node from the mesh
     */
    unregisterNode(nodeId: string): void;
    /**
     * Initiate a new consensus round
     */
    proposeConsensus(proposal: any, timeout?: number): Promise<{
        accepted: boolean;
        votes: ByzantineVote[];
    }>;
    /**
     * Cast a vote for a consensus round
     */
    castVote(roundId: string, vote: 'accept' | 'reject', signature: string): void;
    /**
     * Receive a vote from another node
     */
    receiveVote(vote: ByzantineVote): void;
    /**
     * Evaluate if consensus has been reached
     */
    private evaluateConsensus;
    /**
     * Handle detected Byzantine behavior
     */
    private handleByzantineBehavior;
    /**
     * Quarantine a suspicious node
     */
    private quarantineNode;
    /**
     * Get all healthy nodes
     */
    private getHealthyNodes;
    /**
     * Broadcast proposal to nodes
     */
    private broadcastProposal;
    /**
     * Wait for consensus to be reached or timeout
     */
    private waitForConsensus;
    /**
     * Verify vote signature (simplified)
     */
    private verifySignature;
    /**
     * Get reputation score for a node
     */
    getNodeReputation(nodeId: string): number;
    /**
     * Update node reputation (reward good behavior)
     */
    increaseReputation(nodeId: string, amount?: number): void;
    /**
     * Get statistics
     */
    getStats(): {
        totalNodes: number;
        healthyNodes: number;
        activeRounds: number;
        averageReputation: number;
    };
    /**
     * Clean up resources
     */
    destroy(): void;
}
