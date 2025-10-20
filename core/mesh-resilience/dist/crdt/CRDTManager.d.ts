/**
 * CRDT Manager
 * Manages Conflict-Free Replicated Data Types for eventual consistency
 * across distributed mesh nodes with offline-first capabilities
 */
import { EventEmitter } from 'eventemitter3';
import * as Automerge from '@automerge/automerge';
import { CRDTState } from '../types';
export declare class CRDTManager extends EventEmitter {
    private documents;
    private nodeId;
    private vectorClocks;
    private pendingOperations;
    constructor(nodeId: string);
    /**
     * Initialize a new CRDT document
     */
    createDocument<T extends Record<string, unknown>>(docId: string, initialData: T): void;
    /**
     * Update a CRDT document with automatic conflict resolution
     */
    updateDocument<T>(docId: string, updateFn: (doc: T) => void): Automerge.Doc<T> | null;
    /**
     * Merge changes from a remote node
     */
    mergeChanges(docId: string, remoteDoc: Automerge.Doc<any>): void;
    /**
     * Get the current state of a document
     */
    getDocument<T>(docId: string): T | null;
    /**
     * Get changes since a specific vector clock state
     */
    getChanges(docId: string, sinceVectorClock: Map<string, number>): Uint8Array[];
    /**
     * Apply changes from another node
     */
    applyChanges(docId: string, changes: Uint8Array[]): void;
    /**
     * Create a G-Counter (Grow-only Counter)
     */
    createGCounter(docId: string, initialValue?: number): void;
    /**
     * Increment a G-Counter
     */
    incrementGCounter(docId: string, amount?: number): number;
    /**
     * Get the value of a G-Counter (sum of all node counters)
     */
    getGCounterValue(docId: string): number;
    /**
     * Create an OR-Set (Observed-Remove Set)
     */
    createORSet(docId: string, initialElements?: any[]): void;
    /**
     * Add element to OR-Set
     */
    addToORSet(docId: string, element: any): void;
    /**
     * Remove element from OR-Set
     */
    removeFromORSet(docId: string, element: any): void;
    /**
     * Get all elements in OR-Set
     */
    getORSetElements(docId: string): any[];
    /**
     * Create an LWW-Register (Last-Write-Wins Register)
     */
    createLWWRegister(docId: string, initialValue?: any): void;
    /**
     * Set value in LWW-Register
     */
    setLWWRegister(docId: string, value: any): void;
    /**
     * Get value from LWW-Register
     */
    getLWWRegisterValue(docId: string): any;
    /**
     * Export document state for synchronization
     */
    exportState(docId: string): CRDTState | null;
    /**
     * Import document state from another node
     */
    importState(state: CRDTState): void;
    /**
     * Check if a change is newer than a vector clock state
     */
    private isChangeNewer;
    /**
     * Get statistics about CRDT operations
     */
    getStats(): {
        documentCount: number;
        totalOperations: number;
        nodeId: string;
    };
    /**
     * Clean up resources
     */
    destroy(): void;
}
