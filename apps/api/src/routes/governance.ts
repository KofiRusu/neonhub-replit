/**
 * AI Governance API Routes
 * Endpoints for policy management, ethical assessments, and compliance checks
 */

import { Router } from 'express';
import * as governanceService from '../services/governance/index.js';
import { logger } from '../lib/logger.js';

const router: Router = Router();

// POST /api/governance/evaluate - Evaluate action against policies
router.post('/evaluate', async (req, res) => {
  try {
    const { action, context } = req.body;

    if (!action || !context) {
      return res.status(400).json({
        error: 'Action and context are required'
      });
    }

    const evaluation = await governanceService.evaluateAction({ action, context });

    res.json({
      success: true,
      evaluation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to evaluate action');
    res.status(500).json({
      error: 'Failed to evaluate action',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/governance/policies - Add a new policy
router.post('/policies', async (req, res) => {
  try {
    const policy = req.body;

    if (!policy.id || !policy.name || !policy.rules) {
      return res.status(400).json({
        error: 'Policy id, name, and rules are required'
      });
    }

    await governanceService.addPolicy(policy);

    res.json({
      success: true,
      message: 'Policy added successfully',
      policyId: policy.id
    });
  } catch (error) {
    logger.error({ error }, 'Failed to add policy');
    res.status(500).json({
      error: 'Failed to add policy',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/governance/policies - Get all policies
router.get('/policies', async (req, res) => {
  try {
    const policies = await governanceService.getPolicies();

    res.json({
      success: true,
      policies,
      count: policies.length
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get policies');
    res.status(500).json({
      error: 'Failed to retrieve policies',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/governance/ethics/assess - Perform ethical assessment
router.post('/ethics/assess', async (req, res) => {
  try {
    const { scenario, stakeholders, potentialImpacts } = req.body;

    if (!scenario || !stakeholders || !potentialImpacts) {
      return res.status(400).json({
        error: 'Scenario, stakeholders, and potentialImpacts are required'
      });
    }

    const assessment = await governanceService.assessEthics({
      scenario,
      stakeholders,
      potentialImpacts
    });

    res.json({
      success: true,
      assessment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to assess ethics');
    res.status(500).json({
      error: 'Failed to perform ethical assessment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/governance/health - Get governance system health
router.get('/health', async (req, res) => {
  try {
    const health = await governanceService.getHealthStatus();

    res.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get health status');
    res.status(500).json({
      error: 'Failed to get governance health',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/governance/audit-logs - Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { startDate, endDate, level, category } = req.query;

    const filter: any = {};
    if (startDate) filter.startDate = new Date(startDate as string);
    if (endDate) filter.endDate = new Date(endDate as string);
    if (level) filter.level = level;
    if (category) filter.category = category;

    const logs = await governanceService.getAuditLogs(filter);

    res.json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get audit logs');
    res.status(500).json({
      error: 'Failed to retrieve audit logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;