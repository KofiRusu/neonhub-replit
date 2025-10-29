/**
 * Budget Allocation API Routes
 * 
 * Endpoints for budget allocation and simulation
 */

import { Router } from "express";
import { budgetingService } from "../services/budgeting/index.js";
import type { BudgetPlan, SimulationInput } from "../services/budgeting/types.js";

const router: Router = Router();

/**
 * POST /budgets/allocate
 * Calculate budget allocation with explainable reasoning
 */
router.post('/allocate', async (req, res) => {
  try {
    const plan = req.body as BudgetPlan;
    
    // Validate plan
    const validation = budgetingService.validate(plan);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid budget plan',
        details: validation.errors,
      });
    }

    // Calculate allocation
    const result = budgetingService.allocate(plan);

    res.json(result);
  } catch (error) {
    console.error('Budget allocation error:', error);
    res.status(500).json({
      error: 'Failed to calculate allocation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /budgets/simulate
 * Run Monte Carlo simulation for budget scenarios
 */
router.post('/simulate', async (req, res) => {
  try {
    const input = req.body as SimulationInput;

    // Validate input
    if (!input.plan) {
      return res.status(400).json({
        error: 'Budget plan is required',
      });
    }

    // Run simulation
    const result = budgetingService.simulate(input);

    res.json(result);
  } catch (error) {
    console.error('Budget simulation error:', error);
    res.status(500).json({
      error: 'Failed to run simulation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /budgets/:campaignId/history
 * Get budget allocation history for a campaign
 */
router.get('/:campaignId/history', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const history = await budgetingService.getHistory(campaignId);

    res.json({
      campaignId,
      history,
    });
  } catch (error) {
    console.error('Budget history error:', error);
    res.status(500).json({
      error: 'Failed to fetch budget history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /budgets/validate
 * Validate a budget plan without calculating allocation
 */
router.post('/validate', async (req, res) => {
  try {
    const plan = req.body as BudgetPlan;
    
    const validation = budgetingService.validate(plan);

    res.json(validation);
  } catch (error) {
    console.error('Budget validation error:', error);
    res.status(500).json({
      error: 'Failed to validate budget plan',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

