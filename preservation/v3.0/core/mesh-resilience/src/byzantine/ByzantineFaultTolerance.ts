/**
 * Byzantine Fault Tolerance Manager
 * Implements consensus algorithms to handle malicious or faulty nodes
 * in the distributed mesh network
 */

import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import {
  MeshNode,
  ByzantineVote,
  ConsensusRound,
} from '../types';

export class ByzantineFaultTolerance extends EventEmitter {
  private nodeId: string;
  private knownNodes: Map<string, MeshNode>;
  private activeRounds: Map<string, ConsensusRound>;
  private nodeReputations: Map<string, number>;
  private minConsensusNodes: number;
  private consensusThreshold: number; // Percentage required for consensus

  constructor(nodeId: string, minConsensusNodes: number = 3) {
    super();
    this.nodeId = nodeId;
    this.knownNodes = new Map();
    this.activeRounds = new Map();
    this.nodeReputations = new Map();
    this.minConsensusNodes = Math.max(minConsensusNodes, 3); // Minimum 3 for BFT
    this.consensusThreshold = 0.67; // 2/3 majority
  }

  /**
   * Register a node in the mesh
   */
  public registerNode(node: MeshNode): void {
    this.knownNodes.set(node.nodeId, node);
    
    // Initialize reputation if not exists
    if (!this.nodeReputations.has(node.nodeId)) {
      this.nodeReputations.set(node.nodeId, 100); // Start with perfect score
    }

    this.emit('node-registered', { nodeId: node.nodeId });
  }

  /**
   * Remove a node from the mesh
   */
  public unregisterNode(nodeId: string): void {
    this.knownNodes.delete(nodeId);
    this.emit('node-unregistered', { nodeId });
  }

  /**
   * Initiate a new consensus round
   */
  public async proposeConsensus(
    proposal: any,
    timeout: number = 30000
  ): Promise<{ accepted: boolean; votes: ByzantineVote[] }> {
    const roundId = uuidv4();
    const healthyNodes = this.getHealthyNodes();

    if (healthyNodes.length < this.minConsensusNodes) {
      throw new Error(
        `Insufficient nodes for consensus. Required: ${this.minConsensusNodes}, Available: ${healthyNodes.length}`
      );
    }

    const requiredVotes = Math.ceil(healthyNodes.length * this.consensusThreshold);
    const deadline = new Date(Date.now() + timeout);

    const round: ConsensusRound = {
      roundId,
      proposerId: this.nodeId,
      proposal,
      votes: [],
      requiredVotes,
      status: 'pending',
      startTime: new Date(),
      deadline,
    };

    this.activeRounds.set(roundId, round);
    this.emit('consensus-proposed', { roundId, proposal });

    // Broadcast proposal to all healthy nodes
    await this.broadcastProposal(round, healthyNodes);

    // Wait for votes or timeout
    return this.waitForConsensus(roundId, timeout);
  }

  /**
   * Cast a vote for a consensus round
   */
  public castVote(
    roundId: string,
    vote: 'accept' | 'reject',
    signature: string
  ): void {
    const round = this.activeRounds.get(roundId);
    if (!round) {
      throw new Error(`Consensus round ${roundId} not found`);
    }

    if (round.status !== 'pending') {
      throw new Error(`Consensus round ${roundId} is no longer active`);
    }

    const reputation = this.nodeReputations.get(this.nodeId) || 50;

    const byzantineVote: ByzantineVote = {
      nodeId: this.nodeId,
      proposalId: roundId,
      vote,
      signature,
      timestamp: new Date(),
      reputation,
    };

    round.votes.push(byzantineVote);
    this.emit('vote-cast', { roundId, vote: byzantineVote });

    // Check if consensus is reached
    this.evaluateConsensus(roundId);
  }

  /**
   * Receive a vote from another node
   */
  public receiveVote(vote: ByzantineVote): void {
    const round = this.activeRounds.get(vote.proposalId);
    if (!round || round.status !== 'pending') {
      return;
    }

    // Verify vote is from a known node
    if (!this.knownNodes.has(vote.nodeId)) {
      this.emit('suspicious-vote', { vote, reason: 'unknown-node' });
      return;
    }

    // Check for duplicate votes
    const existingVote = round.votes.find((v) => v.nodeId === vote.nodeId);
    if (existingVote) {
      // Conflicting vote detected - potential Byzantine behavior
      this.handleByzantineBehavior(vote.nodeId, 'duplicate-vote');
      return;
    }

    // Verify signature (simplified - in production use proper crypto)
    if (!this.verifySignature(vote)) {
      this.handleByzantineBehavior(vote.nodeId, 'invalid-signature');
      return;
    }

    round.votes.push(vote);
    this.emit('vote-received', { roundId: round.roundId, vote });

    // Check if consensus is reached
    this.evaluateConsensus(round.roundId);
  }

  /**
   * Evaluate if consensus has been reached
   */
  private evaluateConsensus(roundId: string): void {
    const round = this.activeRounds.get(roundId);
    if (!round || round.status !== 'pending') {
      return;
    }

    const acceptVotes = round.votes.filter((v) => v.vote === 'accept');
    const rejectVotes = round.votes.filter((v) => v.vote === 'reject');

    // Weight votes by reputation
    const weightedAccepts = acceptVotes.reduce(
      (sum, v) => sum + (v.reputation / 100),
      0
    );
    const weightedRejects = rejectVotes.reduce(
      (sum, v) => sum + (v.reputation / 100),
      0
    );

    const totalWeight = weightedAccepts + weightedRejects;
    const acceptPercentage = totalWeight > 0 ? weightedAccepts / totalWeight : 0;

    if (acceptPercentage >= this.consensusThreshold) {
      round.status = 'accepted';
      this.emit('consensus-reached', { roundId, accepted: true });
    } else if (weightedRejects > weightedAccepts && round.votes.length >= round.requiredVotes) {
      round.status = 'rejected';
      this.emit('consensus-reached', { roundId, accepted: false });
    }
  }

  /**
   * Handle detected Byzantine behavior
   */
  private handleByzantineBehavior(
    nodeId: string,
    reason: string
  ): void {
    const currentReputation = this.nodeReputations.get(nodeId) || 50;
    const newReputation = Math.max(0, currentReputation - 20);
    
    this.nodeReputations.set(nodeId, newReputation);
    this.emit('byzantine-behavior-detected', { nodeId, reason, newReputation });

    // If reputation drops below threshold, quarantine node
    if (newReputation < 30) {
      this.quarantineNode(nodeId);
    }
  }

  /**
   * Quarantine a suspicious node
   */
  private quarantineNode(nodeId: string): void {
    const node = this.knownNodes.get(nodeId);
    if (node) {
      node.health.status = 'offline';
      this.emit('node-quarantined', { nodeId });
    }
  }

  /**
   * Get all healthy nodes
   */
  private getHealthyNodes(): MeshNode[] {
    return Array.from(this.knownNodes.values()).filter(
      (node) => node.health.status === 'online' && node.byzantineScore >= 50
    );
  }

  /**
   * Broadcast proposal to nodes
   */
  private async broadcastProposal(
    round: ConsensusRound,
    nodes: MeshNode[]
  ): Promise<void> {
    // In production, this would send over network
    this.emit('proposal-broadcast', {
      roundId: round.roundId,
      nodeCount: nodes.length,
    });
  }

  /**
   * Wait for consensus to be reached or timeout
   */
  private async waitForConsensus(
    roundId: string,
    timeout: number
  ): Promise<{ accepted: boolean; votes: ByzantineVote[] }> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const round = this.activeRounds.get(roundId);
        if (!round) {
          clearInterval(checkInterval);
          resolve({ accepted: false, votes: [] });
          return;
        }

        if (round.status === 'accepted') {
          clearInterval(checkInterval);
          resolve({ accepted: true, votes: round.votes });
          this.activeRounds.delete(roundId);
        } else if (round.status === 'rejected') {
          clearInterval(checkInterval);
          resolve({ accepted: false, votes: round.votes });
          this.activeRounds.delete(roundId);
        } else if (new Date() >= round.deadline) {
          clearInterval(checkInterval);
          round.status = 'timeout';
          this.emit('consensus-timeout', { roundId });
          resolve({ accepted: false, votes: round.votes });
          this.activeRounds.delete(roundId);
        }
      }, 100);
    });
  }

  /**
   * Verify vote signature (simplified)
   */
  private verifySignature(vote: ByzantineVote): boolean {
    // In production, use proper cryptographic signature verification
    return vote.signature.length > 0;
  }

  /**
   * Get reputation score for a node
   */
  public getNodeReputation(nodeId: string): number {
    return this.nodeReputations.get(nodeId) || 50;
  }

  /**
   * Update node reputation (reward good behavior)
   */
  public increaseReputation(nodeId: string, amount: number = 5): void {
    const current = this.nodeReputations.get(nodeId) || 50;
    const newScore = Math.min(100, current + amount);
    this.nodeReputations.set(nodeId, newScore);
  }

  /**
   * Get statistics
   */
  public getStats(): {
    totalNodes: number;
    healthyNodes: number;
    activeRounds: number;
    averageReputation: number;
  } {
    const healthyNodes = this.getHealthyNodes();
    const reputations = Array.from(this.nodeReputations.values());
    const avgReputation =
      reputations.length > 0
        ? reputations.reduce((sum, r) => sum + r, 0) / reputations.length
        : 0;

    return {
      totalNodes: this.knownNodes.size,
      healthyNodes: healthyNodes.length,
      activeRounds: this.activeRounds.size,
      averageReputation: avgReputation,
    };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.knownNodes.clear();
    this.activeRounds.clear();
    this.nodeReputations.clear();
    this.removeAllListeners();
  }
}