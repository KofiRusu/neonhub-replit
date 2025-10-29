/**
 * Simulation Engine Tests
 * 
 * Tests for Monte Carlo budget simulation
 */

import { SimulationEngine } from '../simulation-engine';
import type { BudgetPlan, SimulationInput } from '../types';

describe('SimulationEngine', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    engine = new SimulationEngine();
  });

  const basePlan: BudgetPlan = {
    totalBudget: 10000,
    currency: 'USD',
    period: {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-31'),
    },
    pacing: 'even',
    channels: [
      { channel: 'google-ads', priority: 8, historicalROI: 2.5 },
      { channel: 'facebook-ads', priority: 6, historicalROI: 1.8 },
      { channel: 'linkedin-ads', priority: 6, historicalROI: 3.2 },
    ],
  };

  describe('Monte Carlo Simulation', () => {
    it('should run specified number of iterations', () => {
      const input: SimulationInput = {
        plan: basePlan,
        iterations: 100,
      };

      const result = engine.simulate(input);

      expect(result.scenarios).toHaveLength(100);
    });

    it('should produce varied scenarios', () => {
      const input: SimulationInput = {
        plan: basePlan,
        iterations: 50,
      };

      const result = engine.simulate(input);

      // Check that ROI values vary
      const roiValues = result.scenarios.map(s => s.projectedROI);
      const uniqueROIs = new Set(roiValues);
      
      // Should have at least 10 different values in 50 iterations
      expect(uniqueROIs.size).toBeGreaterThan(10);
    });

    it('should use default iterations if not specified', () => {
      const input: SimulationInput = {
        plan: basePlan,
      };

      const result = engine.simulate(input);

      expect(result.scenarios).toHaveLength(1000); // Default
    });
  });

  describe('Statistical Summary', () => {
    it('should calculate mean and median ROI', () => {
      const input: SimulationInput = {
        plan: basePlan,
        iterations: 100,
      };

      const result = engine.simulate(input);

      expect(result.summary.meanROI).toBeGreaterThan(0);
      expect(result.summary.medianROI).toBeGreaterThan(0);
      expect(result.summary.minROI).toBeLessThan(result.summary.maxROI);
    });

    it('should calculate standard deviation', () => {
      const input: SimulationInput = {
        plan: basePlan,
        iterations: 100,
      };

      const result = engine.simulate(input);

      expect(result.summary.stdDevROI).toBeGreaterThan(0);
    });

    it('should calculate confidence interval', () => {
      const input: SimulationInput = {
        plan: basePlan,
        iterations: 1000,
        confidenceLevel: 0.95,
      };

      const result = engine.simulate(input);

      expect(result.summary.confidenceInterval.level).toBe(0.95);
      expect(result.summary.confidenceInterval.lower).toBeLessThan(result.summary.confidenceInterval.upper);
      expect(result.summary.confidenceInterval.lower).toBeLessThan(result.summary.meanROI);
      expect(result.summary.confidenceInterval.upper).toBeGreaterThan(result.summary.meanROI);
    });

    it('should calculate reach statistics', () => {
      const input: SimulationInput = {
        plan: basePlan,
        iterations: 100,
      };

      const result = engine.simulate(input);

      expect(result.summary.meanReach).toBeGreaterThan(0);
      expect(result.summary.medianReach).toBeGreaterThan(0);
      expect(result.summary.minReach).toBeLessThan(result.summary.maxReach);
    });
  });

  describe('Recommendations', () => {
    it('should generate recommendations', () => {
      const input: SimulationInput = {
        plan: basePlan,
        iterations: 100,
      };

      const result = engine.simulate(input);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should warn about high variance', () => {
      const highVariancePlan: BudgetPlan = {
        ...basePlan,
        channels: [
          { channel: 'volatile', priority: 10, historicalROI: 1.0 },
        ],
      };

      const input: SimulationInput = {
        plan: highVariancePlan,
        iterations: 100,
        variance: {
          roiVariance: 0.8, // Very high variance
        },
      };

      const result = engine.simulate(input);

      // Should surface a cautionary recommendation
      const hasRiskWarning = result.recommendations.some(r => {
        const normalized = r.toLowerCase();
        return (
          normalized.includes('variability') ||
          normalized.includes('risk') ||
          normalized.includes('confidence interval')
        );
      });

      expect(hasRiskWarning).toBe(true);
    });
  });

  describe('Variance Control', () => {
    it('should respect custom variance parameters', () => {
      const input: SimulationInput = {
        plan: basePlan,
        iterations: 100,
        variance: {
          roiVariance: 0.05, // Very low variance (±5%)
        },
      };

      const result = engine.simulate(input);

      // Low variance should produce tighter distribution
      const roiCOV = result.summary.stdDevROI / result.summary.meanROI;
      expect(roiCOV).toBeLessThan(0.15); // Should be relatively consistent
    });
  });

  describe('Deterministic Scenarios', () => {
    it('should produce consistent results with same seed', () => {
      const input: SimulationInput = {
        plan: basePlan,
        iterations: 10,
        variance: {
          roiVariance: 0,
          reachVariance: 0,
          costVariance: 0,
        },
      };

      // Simulations use iteration number as seed, so results should be reproducible
      const result1 = engine.simulate(input);
      const result2 = engine.simulate(input);

      // First scenario should match
      expect(result1.scenarios[0].projectedROI).toBeCloseTo(result2.scenarios[0].projectedROI);
      expect(result1.scenarios[0].projectedReach).toBeCloseTo(result2.scenarios[0].projectedReach);
    });
  });
});

