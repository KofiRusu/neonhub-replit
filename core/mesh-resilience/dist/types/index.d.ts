/**
 * NeonHub v7.0 Mesh Resilience Types
 * Defines types for CRDT-based eventual consistency, Byzantine fault tolerance,
 * and self-reconstruction algorithms
 */
export type NodeLocation = 'terrestrial' | 'orbital' | 'lunar' | 'martian' | 'deep-space';
export interface MeshNode {
    nodeId: string;
    location: NodeLocation;
    coordinates?: {
        latitude?: number;
        longitude?: number;
        altitude?: number;
        orbit?: string;
    };
    capabilities: string[];
    lastSeen: Date;
    health: NodeHealth;
    replicationFactor: number;
    byzantineScore: number;
}
export interface NodeHealth {
    status: 'online' | 'degraded' | 'offline' | 'recovering';
    cpuUsage: number;
    memoryUsage: number;
    networkLatency: number;
    packetLoss: number;
    lastHealthCheck: Date;
}
export interface CRDTState {
    type: 'G-Counter' | 'PN-Counter' | 'G-Set' | 'OR-Set' | 'LWW-Register' | 'RGA';
    nodeId: string;
    vectorClock: Map<string, number>;
    data: any;
    timestamp: Date;
}
export interface ByzantineVote {
    nodeId: string;
    proposalId: string;
    vote: 'accept' | 'reject';
    signature: string;
    timestamp: Date;
    reputation: number;
}
export interface ConsensusRound {
    roundId: string;
    proposerId: string;
    proposal: any;
    votes: ByzantineVote[];
    requiredVotes: number;
    status: 'pending' | 'accepted' | 'rejected' | 'timeout';
    startTime: Date;
    deadline: Date;
}
export interface OfflineOperation {
    operationId: string;
    nodeId: string;
    type: 'write' | 'delete' | 'update';
    data: any;
    vectorClock: Map<string, number>;
    timestamp: Date;
    synced: boolean;
}
export interface RecoveryPlaybook {
    playbookId: string;
    name: string;
    triggerConditions: RecoveryTrigger[];
    steps: RecoveryStep[];
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedRecoveryTime: number;
}
export interface RecoveryTrigger {
    type: 'node-failure' | 'partition' | 'data-corruption' | 'consensus-failure';
    threshold: number;
    windowSeconds: number;
}
export interface RecoveryStep {
    stepId: string;
    action: string;
    parameters: Record<string, any>;
    timeout: number;
    retries: number;
    rollbackOnFailure: boolean;
}
export interface DistributionStrategy {
    strategy: 'geographic' | 'orbital' | 'hybrid' | 'least-latency' | 'maximum-redundancy';
    replicationFactor: number;
    preferredLocations: NodeLocation[];
    constraints: DistributionConstraint[];
}
export interface DistributionConstraint {
    type: 'latency' | 'bandwidth' | 'data-sovereignty' | 'fault-domain';
    value: number | string;
    operator: 'max' | 'min' | 'equals' | 'not-in';
}
export interface SelfReconstructionConfig {
    enabled: boolean;
    minHealthyNodes: number;
    reconstructionThreshold: number;
    maxReconstructionAttempts: number;
    reconstructionStrategy: 'majority-vote' | 'weighted-consensus' | 'merkle-proof';
}
export interface MeshMetrics {
    totalNodes: number;
    healthyNodes: number;
    degradedNodes: number;
    offlineNodes: number;
    averageLatency: number;
    consensusSuccessRate: number;
    dataConsistencyScore: number;
    byzantineDetections: number;
    recoveryOperations: number;
    lastSync: Date;
}
export interface SyncOperation {
    syncId: string;
    sourceNodeId: string;
    targetNodeId: string;
    operations: OfflineOperation[];
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    conflicts: ConflictResolution[];
    startTime: Date;
    completionTime?: Date;
}
export interface ConflictResolution {
    conflictId: string;
    type: 'concurrent-write' | 'causal-ordering' | 'version-mismatch';
    resolution: 'last-write-wins' | 'merge' | 'manual-review';
    winner?: string;
    timestamp: Date;
}
export interface MeshResilienceConfig {
    crdtEnabled: boolean;
    byzantineToleranceEnabled: boolean;
    minConsensusNodes: number;
    maxPartitionDuration: number;
    offlineRecoveryEnabled: boolean;
    selfReconstructionConfig: SelfReconstructionConfig;
    distributionStrategy: DistributionStrategy;
}
