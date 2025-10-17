/**
 * Data Trust Integration Service
 * Provides API integration layer for the @neonhub/data-trust module
 */

import {
  DataHasher,
  ProvenanceTracker,
  IntegrityVerifier,
  AuditTrail,
  MerkleTree
} from '@neonhub/data-trust';
import { logger } from '../../lib/logger.js';

// Initialize core components
const dataHasher = new DataHasher();
const provenanceTracker = new ProvenanceTracker();
const integrityVerifier = new IntegrityVerifier();
const auditTrail = new AuditTrail();

/**
 * Hash data for integrity verification
 */
export async function hashData(data: any): Promise<{
  hash: string;
  algorithm: string;
  timestamp: Date;
}> {
  try {
    const result = await dataHasher.hash(JSON.stringify(data));
    
    logger.info({ hash: result.hash }, 'Data hashed successfully');
    
    return {
      hash: result.hash,
      algorithm: result.algorithm,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error({ error }, 'Failed to hash data');
    throw new Error('Failed to hash data');
  }
}

/**
 * Verify data integrity
 */
export async function verifyIntegrity(data: any, expectedHash: string): Promise<{
  isValid: boolean;
  actualHash: string;
  message: string;
}> {
  try {
    const result = await integrityVerifier.verify(data, expectedHash);
    
    return {
      isValid: result.isValid,
      actualHash: result.actualHash || '',
      message: result.isValid ? 'Data integrity verified' : 'Data integrity check failed'
    };
  } catch (error) {
    logger.error({ error }, 'Failed to verify integrity');
    throw new Error('Failed to verify data integrity');
  }
}

/**
 * Track data provenance event
 */
export async function trackProvenance(event: {
  eventType: string;
  dataId: string;
  actor: string;
  action: string;
  metadata?: Record<string, any>;
}): Promise<{
  eventId: string;
  timestamp: Date;
  hash: string;
}> {
  try {
    const provenanceEvent = await provenanceTracker.trackEvent({
      eventType: event.eventType as any,
      timestamp: new Date(),
      actor: event.actor,
      action: event.action,
      metadata: event.metadata
    });
    
    logger.info({ eventId: provenanceEvent.id }, 'Provenance event tracked');
    
    return {
      eventId: provenanceEvent.id,
      timestamp: provenanceEvent.timestamp,
      hash: provenanceEvent.hash
    };
  } catch (error) {
    logger.error({ error, event }, 'Failed to track provenance');
    throw new Error('Failed to track provenance event');
  }
}

/**
 * Get data provenance history
 */
export async function getProvenanceHistory(dataId: string): Promise<any[]> {
  try {
    const history = await provenanceTracker.getHistory(dataId);
    return history;
  } catch (error) {
    logger.error({ error, dataId }, 'Failed to get provenance history');
    throw new Error('Failed to retrieve provenance history');
  }
}

/**
 * Verify provenance chain
 */
export async function verifyProvenanceChain(dataId: string): Promise<{
  isValid: boolean;
  eventCount: number;
  message: string;
}> {
  try {
    const isValid = await provenanceTracker.verifyChain(dataId);
    const history = await provenanceTracker.getHistory(dataId);
    
    return {
      isValid,
      eventCount: history.length,
      message: isValid ? 'Provenance chain is valid' : 'Provenance chain verification failed'
    };
  } catch (error) {
    logger.error({ error, dataId }, 'Failed to verify provenance chain');
    throw new Error('Failed to verify provenance chain');
  }
}

/**
 * Create Merkle tree from data items
 */
export async function createMerkleTree(items: string[]): Promise<{
  root: string;
  leafCount: number;
}> {
  try {
    const merkleTree = new MerkleTree();
    const leaves = items.map(item => dataHasher.hashSync(item).hash);
    
    leaves.forEach(leaf => merkleTree.addLeaf(leaf));
    const root = merkleTree.getRoot();
    
    return {
      root: root || '',
      leafCount: leaves.length
    };
  } catch (error) {
    logger.error({ error }, 'Failed to create Merkle tree');
    throw new Error('Failed to create Merkle tree');
  }
}

/**
 * Log audit event
 */
export async function logAudit(event: {
  level: 'info' | 'warn' | 'error' | 'critical';
  category: string;
  action: string;
  userId?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await auditTrail.log({
      level: event.level,
      category: event.category as any,
      action: event.action,
      userId: event.userId,
      resourceId: event.metadata?.resourceId,
      result: 'success',
      metadata: event.metadata
    });
    
    logger.info({ action: event.action }, 'Audit event logged');
  } catch (error) {
    logger.error({ error, event }, 'Failed to log audit event');
    throw new Error('Failed to log audit event');
  }
}

/**
 * Query audit logs
 */
export async function queryAuditLogs(query: {
  startDate?: Date;
  endDate?: Date;
  level?: string;
  category?: string;
  userId?: string;
}): Promise<any[]> {
  try {
    const logs = await auditTrail.query({
      startDate: query.startDate,
      endDate: query.endDate,
      level: query.level as any,
      category: query.category as any,
      userId: query.userId
    });
    
    return logs;
  } catch (error) {
    logger.error({ error, query }, 'Failed to query audit logs');
    throw new Error('Failed to query audit logs');
  }
}

/**
 * Get data trust system status
 */
export function getSystemStatus(): {
  dataHasher: boolean;
  provenanceTracker: boolean;
  integrityVerifier: boolean;
  auditTrail: boolean;
} {
  return {
    dataHasher: true,
    provenanceTracker: true,
    integrityVerifier: true,
    auditTrail: true
  };
}