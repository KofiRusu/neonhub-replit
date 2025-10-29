/**
 * Global Orchestration API Routes
 * Endpoints for node management, routing, scaling, and failover
 */

import { Router } from 'express';
import * as orchestrationService from '../services/orchestration/index.js';
import { logger } from '../lib/logger.js';

const router: Router = Router();

// POST /api/orchestration/nodes/register - Register a new node
router.post('/nodes/register', async (req, res) => {
  try {
    const { id, region, endpoint, capabilities, metadata } = req.body;

    if (!id || !region || !endpoint || !capabilities) {
      return res.status(400).json({
        error: 'id, region, endpoint, and capabilities are required'
      });
    }

    await orchestrationService.registerNode({ id, region, endpoint, capabilities, metadata });

    res.json({
      success: true,
      message: 'Node registered successfully',
      nodeId: id
    });
  } catch (error) {
    logger.error({ error }, 'Failed to register node');
    res.status(500).json({
      error: 'Failed to register node',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/orchestration/nodes - Discover nodes
router.get('/nodes', async (req, res) => {
  try {
    const { region } = req.query;

    const nodes = await orchestrationService.discoverNodes(region as string);

    res.json({
      success: true,
      nodes,
      count: nodes.length
    });
  } catch (error) {
    logger.error({ error }, 'Failed to discover nodes');
    res.status(500).json({
      error: 'Failed to discover nodes',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/orchestration/route - Route a request
router.post('/route', async (req, res) => {
  try {
    const { requestId, sourceRegion, priority, payload } = req.body;

    if (!requestId || !sourceRegion || !priority || !payload) {
      return res.status(400).json({
        error: 'requestId, sourceRegion, priority, and payload are required'
      });
    }

    const routing = await orchestrationService.routeRequest({
      requestId,
      sourceRegion,
      priority,
      payload
    });

    res.json({
      success: true,
      routing,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to route request');
    res.status(500).json({
      error: 'Failed to route request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/orchestration/health - Get system health
router.get('/health', async (req, res) => {
  try {
    const health = await orchestrationService.getSystemHealth();

    res.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get system health');
    res.status(500).json({
      error: 'Failed to get system health',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/orchestration/scaling/evaluate - Evaluate scaling decision
router.post('/scaling/evaluate', async (req, res) => {
  try {
    const { cpuUtilization, memoryUtilization, requestRate } = req.body;

    if (cpuUtilization === undefined || memoryUtilization === undefined || requestRate === undefined) {
      return res.status(400).json({
        error: 'cpuUtilization, memoryUtilization, and requestRate are required'
      });
    }

    const decision = await orchestrationService.evaluateScaling({
      cpuUtilization,
      memoryUtilization,
      requestRate
    });

    res.json({
      success: true,
      decision,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to evaluate scaling');
    res.status(500).json({
      error: 'Failed to evaluate auto-scaling',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/orchestration/failover/:nodeId - Execute failover
router.post('/failover/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;

    const result = await orchestrationService.executeFailover(nodeId);

    res.json({
      success: result.success,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to execute failover');
    res.status(500).json({
      error: 'Failed to execute failover',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/orchestration/metrics - Get orchestration metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await orchestrationService.getOrchestrationMetrics();

    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get orchestration metrics');
    res.status(500).json({
      error: 'Failed to retrieve orchestration metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/orchestration/config - Update configuration
router.put('/config', async (req, res) => {
  try {
    const config = req.body;

    if (!config || Object.keys(config).length === 0) {
      return res.status(400).json({
        error: 'Configuration object is required'
      });
    }

    await orchestrationService.updateConfiguration(config);

    res.json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    logger.error({ error }, 'Failed to update configuration');
    res.status(500).json({
      error: 'Failed to update configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;