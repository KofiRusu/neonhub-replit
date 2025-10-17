// Main exports for the Data Trust module
export { DataHasher } from './core/DataHasher.js';
export { MerkleTree } from './core/MerkleTree.js';
export { BlockchainConnector } from './core/BlockchainConnector.js';
export { ProvenanceTracker } from './core/ProvenanceTracker.js';
export { IntegrityVerifier } from './core/IntegrityVerifier.js';
export { AuditTrail } from './core/AuditTrail.js';

// Type exports
export type {
  HashAlgorithm,
  HashResult,
  MerkleNode,
  MerkleProof,
  MerkleTreeConfig,
  BlockchainNetwork,
  BlockchainConfig,
  BlockchainTransaction,
  ProvenanceEvent,
  ProvenanceEventType,
  DataProvenance,
  IntegrityCheck,
  AuditEvent,
  AuditLevel,
  AuditCategory,
  AuditQuery,
  DataTrustConfig,
  DataHasher as IDataHasher,
  MerkleTreeInterface,
  BlockchainConnectorInterface,
  ProvenanceTrackerInterface,
  IntegrityVerifierInterface,
  AuditTrailInterface,
  DataTrustError,
  HashingError,
  MerkleTreeError,
  BlockchainError,
  ProvenanceError,
  IntegrityError,
  AuditError
} from './types/index.js';

// Import types for internal use
import type {
  HashAlgorithm,
  MerkleTreeConfig,
  BlockchainConfig,
  AuditLevel
} from './types/index.js';

// Import classes for factory functions
import { DataHasher } from './core/DataHasher.js';
import { MerkleTree } from './core/MerkleTree.js';
import { BlockchainConnector } from './core/BlockchainConnector.js';
import { ProvenanceTracker } from './core/ProvenanceTracker.js';
import { IntegrityVerifier } from './core/IntegrityVerifier.js';
import { AuditTrail } from './core/AuditTrail.js';
import type { DataTrustConfig } from './types/index.js';

// Default configuration
export const DEFAULT_CONFIG: Partial<DataTrustConfig> = {
  defaultHashAlgorithm: 'sha256',
  blockchain: {
    network: 'ethereum',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    chainId: 1
  },
  audit: {
    enabled: true,
    level: 'info',
    retentionDays: 90
  },
  merkleTree: {
    algorithm: 'sha256',
    leafEncoding: 'hex',
    sortLeaves: false,
    sortPairs: false
  },
  logging: {
    level: 'info',
    format: 'json'
  }
};

// Factory functions for easy instantiation
export function createDataHasher(algorithm?: HashAlgorithm) {
  return new DataHasher();
}

export function createMerkleTree(config?: MerkleTreeConfig) {
  return new MerkleTree(config);
}

export function createBlockchainConnector(config: BlockchainConfig) {
  return new BlockchainConnector(config);
}

export function createProvenanceTracker() {
  return new ProvenanceTracker();
}

export function createIntegrityVerifier() {
  return new IntegrityVerifier();
}

export function createAuditTrail(options?: {
  logLevel?: AuditLevel;
  logFilePath?: string;
  retentionDays?: number;
  format?: 'json' | 'simple';
}) {
  return new AuditTrail(options);
}

// Version information
export const VERSION = '4.0.0';
export const MODULE_NAME = '@neonhub/data-trust';