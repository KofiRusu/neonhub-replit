import { Router } from 'express';
import {
  processMetricsForScaling,
  executeAutoScaling,
  getPredictiveEngineHealth,
  getAdaptiveAgentStats,
  getBaselineMetrics
} from '../services/predictive-engine';

const router = Router();

// POST /api/predictive/scale - Process metrics and make scaling decisions
router.post('/scale', async (req, res) => {
  try {
    const { metrics } = req.body;

    if (!metrics) {
      return res.status(400).json({
        error: 'Metrics data is required'
      });
    }

    const decision = await processMetricsForScaling(metrics);

    res.json({
      success: true,
      decision,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing scaling decision:', error);
    res.status(500).json({
      error: 'Failed to process scaling decision',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/predictive/execute - Execute scaling decision
router.post('/execute', async (req, res) => {
  try {
    const { decision, namespace, deploymentName } = req.body;

    if (!decision) {
      return res.status(400).json({
        error: 'Scaling decision is required'
      });
    }

    await executeAutoScaling(decision, namespace, deploymentName);

    res.json({
      success: true,
      message: 'Scaling executed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error executing scaling:', error);
    res.status(500).json({
      error: 'Failed to execute scaling',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/predictive/health - Get predictive engine health status
router.get('/health', async (req, res) => {
  try {
    const health = await getPredictiveEngineHealth();

    res.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting predictive engine health:', error);
    res.status(500).json({
      error: 'Failed to get predictive engine health',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/predictive/stats - Get adaptive agent learning statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = getAdaptiveAgentStats();

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting adaptive agent stats:', error);
    res.status(500).json({
      error: 'Failed to get adaptive agent statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/predictive/baseline - Get baseline performance metrics
router.get('/baseline', async (req, res) => {
  try {
    const baseline = await getBaselineMetrics();

    res.json({
      success: true,
      baseline,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting baseline metrics:', error);
    res.status(500).json({
      error: 'Failed to get baseline metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;