export type HashAlgorithm = 'sha256' | 'sha3-256' | 'sha3-512' | 'blake2b-256' | 'blake2b-512';

export type BlockchainNetwork =
  | 'ethereum'
  | 'polygon'
  | 'bsc'
  | 'arbitrum'
  | 'optimism'
  | 'avalanche'
  | 'fantom'
  | 'cronos';

export interface HashResult {
  hash: string;
  algorithm: HashAlgorithm;
  timestamp: Date;
  dataSize: number;
}

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  data?: string;
}

export interface MerkleProof {
  leaf: string;
  proof: string[];
  root: string;
  index: number;
}

export interface MerkleTreeConfig {
  algorithm?: HashAlgorithm;
  leafEncoding?: 'hex' | 'utf8';
  sortLeaves?: boolean;
  sortPairs?: boolean;
}

export interface BlockchainConfig {
  network: BlockchainNetwork;
  rpcUrl: string;
  chainId: number;
  contractAddress?: string;
  privateKey?: string;
  gasLimit?: number;
  gasPrice?: bigint;
}

export interface BlockchainTransaction {
  hash: string;
  blockNumber: number;
  blockHash: string;
  timestamp: Date;
  from: string;
  to: string;
  value: bigint;
  gasUsed: bigint;
  gasPrice: bigint;
  status: boolean;
  data?: string;
}

export interface ProvenanceEvent {
  id: string;
  dataId: string;
  eventType: ProvenanceEventType;
  actor: string;
  timestamp: Date;
  previousHash?: string;
  currentHash: string;
  metadata: Record<string, any>;
  blockchainTx?: string;
}

export type ProvenanceEventType =
  | 'CREATED'
  | 'MODIFIED'
  | 'ACCESSED'
  | 'DELETED'
  | 'VALIDATED'
  | 'VERIFIED'
  | 'TRANSFERRED'
  | 'ARCHIVED';

export interface DataProvenance {
  dataId: string;
  originalHash: string;
  currentHash: string;
  createdAt: Date;
  lastModified: Date;
  owner: string;
  lineage: ProvenanceEvent[];
  blockchainRecords: string[];
  metadata: Record<string, any>;
}

export interface IntegrityCheck {
  dataId: string;
  expectedHash: string;
  actualHash: string;
  isValid: boolean;
  timestamp: Date;
  algorithm: HashAlgorithm;
  proof?: MerkleProof;
  blockchainVerification?: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  level: AuditLevel;
  category: AuditCategory;
  actor: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  blockchainTx?: string;
}

export type AuditLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export type AuditCategory =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'integrity_check'
  | 'provenance'
  | 'blockchain'
  | 'system';

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  level?: AuditLevel;
  category?: AuditCategory;
  actor?: string;
  resource?: string;
  limit?: number;
  offset?: number;
}

export interface DataTrustConfig {
  defaultHashAlgorithm: HashAlgorithm;
  blockchain: BlockchainConfig;
  audit: {
    enabled: boolean;
    level: AuditLevel;
    retentionDays: number;
  };
  merkleTree: MerkleTreeConfig;
  logging: {
    level: string;
    format: 'json' | 'simple';
  };
}

export interface DataHasher {
  hash(data: string | Buffer, algorithm?: HashAlgorithm): Promise<HashResult>;
  hashFile(filePath: string, algorithm?: HashAlgorithm): Promise<HashResult>;
  verify(data: string | Buffer, expectedHash: string, algorithm?: HashAlgorithm): Promise<boolean>;
}

export interface MerkleTreeInterface {
  build(leaves: string[]): Promise<void>;
  getRoot(): string;
  generateProof(leaf: string): MerkleProof;
  verifyProof(leaf: string, proof: MerkleProof): boolean;
  getLeaves(): string[];
  getTree(): MerkleNode;
}

export interface BlockchainConnectorInterface {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  storeHash(hash: string, metadata?: Record<string, any>): Promise<BlockchainTransaction>;
  verifyHash(hash: string, txHash: string): Promise<boolean>;
  getTransaction(txHash: string): Promise<BlockchainTransaction>;
  getNetworkInfo(): Promise<{ chainId: number; blockNumber: number }>;
}

export interface ProvenanceTrackerInterface {
  recordEvent(event: Omit<ProvenanceEvent, 'id'>): Promise<string>;
  getProvenance(dataId: string): Promise<DataProvenance>;
  getEventHistory(dataId: string, limit?: number): Promise<ProvenanceEvent[]>;
  updateDataHash(dataId: string, newHash: string, actor: string): Promise<void>;
  transferOwnership(dataId: string, newOwner: string, actor: string): Promise<void>;
}

export interface IntegrityVerifierInterface {
  checkIntegrity(dataId: string, data: string | Buffer): Promise<IntegrityCheck>;
  verifyMerkleProof(dataId: string, proof: MerkleProof): Promise<boolean>;
  batchCheckIntegrity(checks: Array<{ dataId: string; data: string | Buffer }>): Promise<IntegrityCheck[]>;
  getIntegrityHistory(dataId: string): Promise<IntegrityCheck[]>;
}

export interface AuditTrailInterface {
  log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string>;
  query(query: AuditQuery): Promise<AuditEvent[]>;
  getEvent(eventId: string): Promise<AuditEvent>;
  exportAuditLog(query: AuditQuery, format: 'json' | 'csv'): Promise<string>;
  cleanup(retentionDays: number): Promise<number>;
}

export class DataTrustError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'DataTrustError';
  }
}

export class HashingError extends DataTrustError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'HASHING_ERROR', details);
    this.name = 'HashingError';
  }
}

export class MerkleTreeError extends DataTrustError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'MERKLE_TREE_ERROR', details);
    this.name = 'MerkleTreeError';
  }
}

export class BlockchainError extends DataTrustError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'BLOCKCHAIN_ERROR', details);
    this.name = 'BlockchainError';
  }
}

export class ProvenanceError extends DataTrustError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'PROVENANCE_ERROR', details);
    this.name = 'ProvenanceError';
  }
}

export class IntegrityError extends DataTrustError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'INTEGRITY_ERROR', details);
    this.name = 'IntegrityError';
  }
}

export class AuditError extends DataTrustError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'AUDIT_ERROR', details);
    this.name = 'AuditError';
  }
}