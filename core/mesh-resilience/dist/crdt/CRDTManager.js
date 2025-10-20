"use strict";
/**
 * CRDT Manager
 * Manages Conflict-Free Replicated Data Types for eventual consistency
 * across distributed mesh nodes with offline-first capabilities
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRDTManager = void 0;
const eventemitter3_1 = require("eventemitter3");
const Automerge = __importStar(require("@automerge/automerge"));
const uuid_1 = require("uuid");
class CRDTManager extends eventemitter3_1.EventEmitter {
    constructor(nodeId) {
        super();
        this.nodeId = nodeId;
        this.documents = new Map();
        this.vectorClocks = new Map();
        this.pendingOperations = new Map();
    }
    /**
     * Initialize a new CRDT document
     */
    createDocument(docId, initialData) {
        const doc = Automerge.from(initialData);
        this.documents.set(docId, doc);
        this.vectorClocks.set(docId, new Map([[this.nodeId, 1]]));
        this.emit('document-created', { docId, nodeId: this.nodeId });
    }
    /**
     * Update a CRDT document with automatic conflict resolution
     */
    updateDocument(docId, updateFn) {
        const doc = this.documents.get(docId);
        if (!doc) {
            throw new Error(`Document ${docId} not found`);
        }
        const newDoc = Automerge.change(doc, updateFn);
        this.documents.set(docId, newDoc);
        // Update vector clock
        const clock = this.vectorClocks.get(docId);
        clock.set(this.nodeId, (clock.get(this.nodeId) || 0) + 1);
        this.emit('document-updated', { docId, nodeId: this.nodeId });
        return newDoc;
    }
    /**
     * Merge changes from a remote node
     */
    mergeChanges(docId, remoteDoc) {
        const localDoc = this.documents.get(docId);
        if (!localDoc) {
            // No local copy, adopt remote
            this.documents.set(docId, remoteDoc);
            return;
        }
        const mergedDoc = Automerge.merge(localDoc, remoteDoc);
        this.documents.set(docId, mergedDoc);
        this.emit('documents-merged', { docId, nodeId: this.nodeId });
    }
    /**
     * Get the current state of a document
     */
    getDocument(docId) {
        const doc = this.documents.get(docId);
        return doc ? doc : null;
    }
    /**
     * Get changes since a specific vector clock state
     */
    getChanges(docId, sinceVectorClock) {
        const doc = this.documents.get(docId);
        if (!doc)
            return [];
        // Get all changes since the provided vector clock
        const allChanges = Automerge.getAllChanges(doc);
        return allChanges.filter((change) => {
            // Filter changes based on vector clock comparison
            return this.isChangeNewer(change, sinceVectorClock);
        });
    }
    /**
     * Apply changes from another node
     */
    applyChanges(docId, changes) {
        let doc = this.documents.get(docId);
        if (!doc) {
            doc = Automerge.init();
        }
        const newDoc = Automerge.applyChanges(doc, changes);
        this.documents.set(docId, newDoc);
        this.emit('changes-applied', { docId, changeCount: changes.length });
    }
    /**
     * Create a G-Counter (Grow-only Counter)
     */
    createGCounter(docId, initialValue = 0) {
        this.createDocument(docId, {
            type: 'G-Counter',
            counters: { [this.nodeId]: initialValue },
        });
    }
    /**
     * Increment a G-Counter
     */
    incrementGCounter(docId, amount = 1) {
        const doc = this.updateDocument(docId, (state) => {
            if (!state.counters[this.nodeId]) {
                state.counters[this.nodeId] = 0;
            }
            state.counters[this.nodeId] += amount;
        });
        return this.getGCounterValue(docId);
    }
    /**
     * Get the value of a G-Counter (sum of all node counters)
     */
    getGCounterValue(docId) {
        const doc = this.getDocument(docId);
        if (!doc || doc.type !== 'G-Counter')
            return 0;
        return Object.values(doc.counters).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    }
    /**
     * Create an OR-Set (Observed-Remove Set)
     */
    createORSet(docId, initialElements = []) {
        const elements = new Map();
        initialElements.forEach((el) => {
            const id = (0, uuid_1.v4)();
            elements.set(id, { value: el, nodeId: this.nodeId, timestamp: Date.now() });
        });
        this.createDocument(docId, {
            type: 'OR-Set',
            elements: Object.fromEntries(elements),
            tombstones: {},
        });
    }
    /**
     * Add element to OR-Set
     */
    addToORSet(docId, element) {
        this.updateDocument(docId, (state) => {
            const id = (0, uuid_1.v4)();
            state.elements[id] = {
                value: element,
                nodeId: this.nodeId,
                timestamp: Date.now(),
            };
        });
    }
    /**
     * Remove element from OR-Set
     */
    removeFromORSet(docId, element) {
        this.updateDocument(docId, (state) => {
            // Find all instances of the element
            Object.entries(state.elements).forEach(([id, el]) => {
                if (JSON.stringify(el.value) === JSON.stringify(element)) {
                    // Move to tombstones instead of deleting
                    state.tombstones[id] = el;
                    delete state.elements[id];
                }
            });
        });
    }
    /**
     * Get all elements in OR-Set
     */
    getORSetElements(docId) {
        const doc = this.getDocument(docId);
        if (!doc || doc.type !== 'OR-Set')
            return [];
        return Object.values(doc.elements).map((el) => el.value);
    }
    /**
     * Create an LWW-Register (Last-Write-Wins Register)
     */
    createLWWRegister(docId, initialValue = null) {
        this.createDocument(docId, {
            type: 'LWW-Register',
            value: initialValue,
            timestamp: Date.now(),
            nodeId: this.nodeId,
        });
    }
    /**
     * Set value in LWW-Register
     */
    setLWWRegister(docId, value) {
        this.updateDocument(docId, (state) => {
            const newTimestamp = Date.now();
            if (newTimestamp > state.timestamp) {
                state.value = value;
                state.timestamp = newTimestamp;
                state.nodeId = this.nodeId;
            }
        });
    }
    /**
     * Get value from LWW-Register
     */
    getLWWRegisterValue(docId) {
        const doc = this.getDocument(docId);
        if (!doc || doc.type !== 'LWW-Register')
            return null;
        return doc.value;
    }
    /**
     * Export document state for synchronization
     */
    exportState(docId) {
        const doc = this.documents.get(docId);
        if (!doc)
            return null;
        const vectorClock = this.vectorClocks.get(docId) || new Map();
        return {
            type: 'LWW-Register', // Default, should be determined from doc
            nodeId: this.nodeId,
            vectorClock,
            data: doc,
            timestamp: new Date(),
        };
    }
    /**
     * Import document state from another node
     */
    importState(state) {
        const docId = `imported-${state.nodeId}-${Date.now()}`;
        this.documents.set(docId, state.data);
        this.vectorClocks.set(docId, state.vectorClock);
        this.emit('state-imported', { docId, sourceNode: state.nodeId });
    }
    /**
     * Check if a change is newer than a vector clock state
     */
    isChangeNewer(change, vectorClock) {
        // Simplified check - in production, parse change and compare clocks
        return true;
    }
    /**
     * Get statistics about CRDT operations
     */
    getStats() {
        let totalOps = 0;
        this.vectorClocks.forEach((clock) => {
            clock.forEach((count) => {
                totalOps += count;
            });
        });
        return {
            documentCount: this.documents.size,
            totalOperations: totalOps,
            nodeId: this.nodeId,
        };
    }
    /**
     * Clean up resources
     */
    destroy() {
        this.documents.clear();
        this.vectorClocks.clear();
        this.pendingOperations.clear();
        this.removeAllListeners();
    }
}
exports.CRDTManager = CRDTManager;
