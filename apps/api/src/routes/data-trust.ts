/**
 * Data Trust API Routes
 * Endpoints for data provenance, integrity verification, and audit trails
 */

import { Router } from 'express';
import * as dataTrustService from '../services/data-trust/index.js';
import { logger } from '../lib/logger.js';

const router: Router = Router();

// POST /api/data-trust/hash - Hash data
router.post('/hash', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        error: 'Data is required'
      });
    }

    const result = await dataTrustService.hashData(data);

    res.json({
      success: true,
      hash: result.hash,
      algorithm: result.algorithm,
      timestamp: result.timestamp
    });
  } catch (error) {
    logger.error({ error }, 'Failed to hash data');
    res.status(500).json({
      error: 'Failed to hash data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/data-trust/verify - Verify data integrity
router.post('/verify', async (req, res) => {
  try {
    const { data, expectedHash } = req.body;

    if (!data || !expectedHash) {
      return res.status(400).json({
        error: 'Data and expectedHash are required'
      });
    }

    const result = await dataTrustService.verifyIntegrity(data, expectedHash);

    res.json({
      success: true,
      isValid: result.isValid,
      actualHash: result.actualHash,
      message: result.message
    });
  } catch (error) {
    logger.error({ error }, 'Failed to verify integrity');
    res.status(500).json({
      error: 'Failed to verify data integrity',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/data-trust/provenance/track - Track provenance event
router.post('/provenance/track', async (req, res) => {
  try {
    const { eventType, dataId, actor, action, metadata } = req.body;

    if (!eventType || !dataId || !actor || !action) {
      return res.status(400).json({
        error: 'eventType, dataId, actor, and action are required'
      });
    }

    const result = await dataTrustService.trackProvenance({
      eventType,
      dataId,
      actor,
      action,
      metadata
    });

    res.json({
      success: true,
      eventId: result.eventId,
      timestamp: result.timestamp,
      hash: result.hash
    });
  } catch (error) {
    logger.error({ error }, 'Failed to track provenance');
    res.status(500).json({
      error: 'Failed to track provenance event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/data-trust/provenance/:dataId - Get provenance history
router.get('/provenance/:dataId', async (req, res) => {
  try {
    const { dataId } = req.params;

    const history = await dataTrustService.getProvenanceHistory(dataId);

    res.json({
      success: true,
      dataId,
      history,
      count: history.length
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get provenance history');
    res.status(500).json({
      error: 'Failed to retrieve provenance history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/data-trust/provenance/:dataId/verify - Verify provenance chain
router.get('/provenance/:dataId/verify', async (req, res) => {
  try {
    const { dataId } = req.params;

    const result = await dataTrustService.verifyProvenanceChain(dataId);

    res.json({
      success: true,
      dataId,
      isValid: result.isValid,
      eventCount: result.eventCount,
      message: result.message
    });
  } catch (error) {
    logger.error({ error }, 'Failed to verify provenance chain');
    res.status(500).json({
      error: 'Failed to verify provenance chain',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/data-trust/merkle - Create Merkle tree
router.post('/merkle', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        error: 'Items array is required'
      });
    }

    const result = await dataTrustService.createMerkleTree(items);

    res.json({
      success: true,
      root: result.root,
      leafCount: result.leafCount
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create Merkle tree');
    res.status(500).json({
      error: 'Failed to create Merkle tree',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/data-trust/audit/log - Log audit event
router.post('/audit/log', async (req, res) => {
  try {
    const { level, category, action, userId, metadata } = req.body;

    if (!level || !category || !action) {
      return res.status(400).json({
        error: 'level, category, and action are required'
      });
    }

    await dataTrustService.logAudit({ level, category, action, userId, metadata });

    res.json({
      success: true,
      message: 'Audit event logged successfully'
    });
  } catch (error) {
    logger.error({ error }, 'Failed to log audit event');
    res.status(500).json({
      error: 'Failed to log audit event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/data-trust/audit/logs - Query audit logs
router.get('/audit/logs', async (req, res) => {
  try {
    const { startDate, endDate, level, category, userId } = req.query;

    const query: any = {};
    if (startDate) query.startDate = new Date(startDate as string);
    if (endDate) query.endDate = new Date(endDate as string);
    if (level) query.level = level;
    if (category) query.category = category;
    if (userId) query.userId = userId;

    const logs = await dataTrustService.queryAuditLogs(query);

    res.json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    logger.error({ error }, 'Failed to query audit logs');
    res.status(500).json({
      error: 'Failed to query audit logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/data-trust/status - Get system status
router.get('/status', async (req, res) => {
  try {
    const status = dataTrustService.getSystemStatus();

    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get system status');
    res.status(500).json({
      error: 'Failed to get system status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;