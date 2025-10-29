/**
 * Eco-Optimizer API Routes
 * Endpoints for energy monitoring, carbon footprint, and sustainability metrics
 */

import { Router } from 'express';
import * as ecoService from '../services/eco-optimizer/index.js';
import { logger } from '../lib/logger.js';

const router: Router = Router();

// GET /api/eco-metrics/energy - Get current energy metrics
router.get('/energy', async (req, res) => {
  try {
    const metrics = await ecoService.getCurrentEnergyMetrics();

    res.json({
      success: true,
      metrics,
      timestamp: metrics.timestamp
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get energy metrics');
    res.status(500).json({
      error: 'Failed to retrieve energy metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/eco-metrics/carbon - Calculate carbon footprint
router.post('/carbon', async (req, res) => {
  try {
    const { resources } = req.body;

    if (!resources || !Array.isArray(resources)) {
      return res.status(400).json({
        error: 'Resources array is required'
      });
    }

    const footprint = await ecoService.calculateCarbonFootprint(resources);

    res.json({
      success: true,
      footprint,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to calculate carbon footprint');
    res.status(500).json({
      error: 'Failed to calculate carbon footprint',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/eco-metrics/optimize - Optimize resource allocation
router.post('/optimize', async (req, res) => {
  try {
    const { resources } = req.body;

    if (!resources || !Array.isArray(resources)) {
      return res.status(400).json({
        error: 'Resources array is required'
      });
    }

    const optimization = await ecoService.optimizeResources(resources);

    res.json({
      success: true,
      optimization,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to optimize resources');
    res.status(500).json({
      error: 'Failed to optimize resource allocation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/eco-metrics/efficiency - Analyze system efficiency
router.get('/efficiency', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required'
      });
    }

    const analysis = await ecoService.analyzeEfficiency({
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    });

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to analyze efficiency');
    res.status(500).json({
      error: 'Failed to analyze system efficiency',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/eco-metrics/green-ai - Get Green AI recommendations
router.post('/green-ai', async (req, res) => {
  try {
    const { name, parameters, trainingData, framework, accelerator } = req.body;

    if (!name || !parameters || !trainingData || !framework || !accelerator) {
      return res.status(400).json({
        error: 'name, parameters, trainingData, framework, and accelerator are required'
      });
    }

    const recommendations = await ecoService.getGreenAIRecommendations({
      name,
      parameters,
      trainingData,
      framework,
      accelerator
    });

    res.json({
      success: true,
      recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get Green AI recommendations');
    res.status(500).json({
      error: 'Failed to generate Green AI recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/eco-metrics/sustainability-report - Generate sustainability report
router.get('/sustainability-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required'
      });
    }

    const report = await ecoService.generateSustainabilityReport({
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    });

    res.json({
      success: true,
      report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to generate sustainability report');
    res.status(500).json({
      error: 'Failed to generate sustainability report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/eco-metrics/track - Track energy usage
router.post('/track', async (req, res) => {
  try {
    const { type, provider, instanceType, region, utilizationPercent, durationHours } = req.body;

    if (!type || !provider || !instanceType || !region || utilizationPercent === undefined || !durationHours) {
      return res.status(400).json({
        error: 'type, provider, instanceType, region, utilizationPercent, and durationHours are required'
      });
    }

    const usage = await ecoService.trackEnergyUsage({
      type,
      provider,
      instanceType,
      region,
      utilizationPercent,
      durationHours
    });

    res.json({
      success: true,
      usage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to track energy usage');
    res.status(500).json({
      error: 'Failed to track energy usage',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/eco-metrics/status - Get system status
router.get('/status', async (req, res) => {
  try {
    const status = ecoService.getSystemStatus();

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