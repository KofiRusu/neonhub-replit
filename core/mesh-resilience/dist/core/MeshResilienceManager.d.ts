/**
 * Mesh Resilience Manager
 * Central coordinator for distributed mesh resilience with CRDT, BFT, and self-reconstruction
 */
import { EventEmitter } from 'eventemitter3';
import { MeshNode, MeshResilienceConfig, MeshMetrics, SyncOperation } from '../types';
export declare class MeshResilienceManager extends EventEmitter {
    private nodeId;
    private config;
    private crdtManager;
    private bftManager;
    private meshNodes;
    private offlineOperations;
    private recoveryPlaybooks;
    private isOnline;
    constructor(nodeId: string, config: MeshResilienceConfig);
    /**
     * Initialize the mesh resilience system
     */
    initialize(): Promise<void>;
    /**
     * Register a new node in the mesh
     */
    registerNode(node: MeshNode): Promise<void>;
    /**
     * Unregister a node from the mesh
     */
    unregisterNode(nodeId: string): Promise<void>;
    /**
     * Perform an operation with offline support
     */
    performOperation(type: 'write' | 'delete' | 'update', data: any): Promise<string>;
    /**
     * Synchronize offline operations when coming back online
     */
    synchronize(): Promise<SyncOperation[]>;
    /**
     * Trigger self-reconstruction after catastrophic failure
     */
    selfReconstruct(): Promise<boolean>;
    /**
     * Execute a recovery playbook
     */
    executeRecoveryPlaybook(playbookId: string): Promise<{
        success: boolean;
        steps: any[];
    }>;
    /**
     * Get current mesh metrics
     */
    getMetrics(): MeshMetrics;
    /**
     * Handle network partition
     */
    handlePartition(partitionedNodes: string[]): void;
    /**
     * Handle network healing
     */
    handleHealing(): Promise<void>;
    /**
     * Set up event listeners
     */
    private setupEventListeners;
    /**
     * Propagate operation to mesh
     */
    private propagateOperation;
    /**
     * Request state from nodes
     */
    private requestStateFromNodes;
    /**
     * Reconstruct state from multiple node states
     */
    private reconstructFromStates;
    /**
     * Apply reconstructed state
     */
    private applyReconstructedState;
    /**
     * Execute a recovery step
     */
    private executeRecoveryStep;
    /**
     * Rollback recovery steps
     */
    private rollbackRecoverySteps;
    /**
     * Load default recovery playbooks
     */
    private loadDefaultRecoveryPlaybooks;
    /**
     * Clean up resources
     */
    destroy(): void;
}
