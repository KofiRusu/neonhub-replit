/**
 * Budgeting Service
 * 
 * Main service for budget allocation and simulation
 * Provides explainable budget allocation with reasoning
 */

import { AllocationEngine } from './allocation-engine';
import { SimulationEngine } from './simulation-engine';
import type { BudgetPlan, AllocationResult, SimulationInput, SimulationResult } from './types';

export class BudgetingService {
  private allocationEngine: AllocationEngine;
  private simulationEngine: SimulationEngine;

  constructor() {
    this.allocationEngine = new AllocationEngine();
    this.simulationEngine = new SimulationEngine();
  }

  /**
   * Calculate budget allocation
   * 
   * @param plan - Budget plan configuration
   * @returns Allocation with explainable reasoning
   */
  allocate(plan: BudgetPlan): AllocationResult {
    return this.allocationEngine.calculate(plan);
  }

  /**
   * Simulate budget scenarios
   * 
   * @param input - Simulation parameters
   * @returns Monte Carlo simulation results
   */
  simulate(input: SimulationInput): SimulationResult {
    return this.simulationEngine.simulate(input);
  }

  /**
   * Get allocation history for a campaign
   * 
   * @param campaignId - Campaign identifier
   * @returns Historical allocations
   */
  async getHistory(_campaignId: string): Promise<AllocationResult[]> {
    // TODO: Implement when BudgetTransaction model is added
    // For now, return empty array
    return [];
  }

  /**
   * Validate a budget plan
   * 
   * @param plan - Budget plan to validate
   * @returns Validation result with errors
   */
  validate(plan: BudgetPlan): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      this.allocationEngine.calculate(plan);
      return { valid: true, errors: [] };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      return { valid: false, errors };
    }
  }
}

// Export singleton instance
export const budgetingService = new BudgetingService();

// Export types
export * from './types';


