/**
 * Budget Simulation Engine
 * 
 * Monte Carlo simulation for budget allocation scenarios
 * Provides confidence intervals and risk analysis
 */

import type { SimulationInput, SimulationResult, BudgetPlan } from './types';
import { AllocationEngine } from './allocation-engine';

export class SimulationEngine {
  private allocationEngine: AllocationEngine;

  constructor() {
    this.allocationEngine = new AllocationEngine();
  }

  /**
   * Run Monte Carlo simulation
   * 
   * @param input - Simulation parameters
   * @returns Simulation results with statistics
   */
  simulate(input: SimulationInput): SimulationResult {
    const iterations = input.iterations || 1000;
    const confidenceLevel = input.confidenceLevel || 0.95;
    const variance = input.variance || {
      roiVariance: 0.15, // ±15% variance
      costVariance: 0.10, // ±10% variance
      reachVariance: 0.20, // ±20% variance
    };

    const scenarios: SimulationResult['scenarios'] = [];

    // Run Monte Carlo iterations
    for (let i = 0; i < iterations; i++) {
      // Create variation of the budget plan
      const variedPlan = this.createVariation(input.plan, variance, i);
      
      // Calculate allocation for this scenario
      const allocation = this.allocationEngine.calculate(variedPlan);
      
      // Project outcomes with variation
      const projectedReach = allocation.estimates.totalReach * (1 + this.randomVariation(variance.reachVariance));
      const projectedROI = allocation.estimates.expectedROI * (1 + this.randomVariation(variance.roiVariance));
      const projectedCost = allocation.totalAllocated * (1 + this.randomVariation(variance.costVariance));

      scenarios.push({
        iteration: i + 1,
        allocation,
        projectedReach,
        projectedROI,
        projectedCost,
      });
    }

    // Calculate statistical summary
    const summary = this.calculateStatistics(scenarios, confidenceLevel);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(scenarios, summary);

    return {
      scenarios,
      summary,
      recommendations,
    };
  }

  /**
   * Create a variation of the budget plan
   */
  private createVariation(
    plan: BudgetPlan,
    variance: SimulationInput['variance'],
    seed: number
  ): BudgetPlan {
    // Use seed for reproducibility
    const seededRandom = this.seededRandom(seed);
    
    return {
      ...plan,
      channels: plan.channels.map(channel => ({
        ...channel,
        historicalROI: channel.historicalROI
          ? channel.historicalROI * (1 + this.randomVariation(variance?.roiVariance || 0.15, seededRandom))
          : undefined,
      })),
    };
  }

  /**
   * Calculate statistics from scenarios
   */
  private calculateStatistics(
    scenarios: SimulationResult['scenarios'],
    confidenceLevel: number
  ): SimulationResult['summary'] {
    // Extract ROI and Reach values
    const roiValues = scenarios.map(s => s.projectedROI).sort((a, b) => a - b);
    const reachValues = scenarios.map(s => s.projectedReach).sort((a, b) => a - b);

    // Calculate confidence interval
    const alpha = 1 - confidenceLevel;
    const lowerIndex = Math.floor((alpha / 2) * roiValues.length);
    const upperIndex = Math.floor((1 - alpha / 2) * roiValues.length);

    return {
      // ROI statistics
      meanROI: this.mean(roiValues),
      medianROI: this.median(roiValues),
      minROI: roiValues[0],
      maxROI: roiValues[roiValues.length - 1],
      stdDevROI: this.standardDeviation(roiValues),
      
      // Reach statistics
      meanReach: this.mean(reachValues),
      medianReach: this.median(reachValues),
      minReach: reachValues[0],
      maxReach: reachValues[reachValues.length - 1],
      
      // Confidence interval
      confidenceInterval: {
        lower: roiValues[lowerIndex],
        upper: roiValues[upperIndex],
        level: confidenceLevel,
      },
    };
  }

  /**
   * Generate recommendations based on simulation results
   */
  private generateRecommendations(
    scenarios: SimulationResult['scenarios'],
    summary: SimulationResult['summary']
  ): string[] {
    const recommendations: string[] = [];

    // ROI consistency check
    const roiCOV = summary.stdDevROI / summary.meanROI;
    if (roiCOV > 0.5) {
      recommendations.push(
        `High ROI variability detected (CV: ${(roiCOV * 100).toFixed(1)}%). Consider diversifying channels to reduce risk.`
      );
    }

    // Confidence interval width
    const ciWidth = summary.confidenceInterval.upper - summary.confidenceInterval.lower;
    const ciRange = (ciWidth / summary.meanROI) * 100;
    if (ciRange > 30) {
      recommendations.push(
        `Wide confidence interval (${ciRange.toFixed(1)}% of mean). Consider gathering more historical data for better predictions.`
      );
    }

    // Positive ROI check
    if (summary.confidenceInterval.lower < 0) {
      recommendations.push(
        `Risk of negative ROI detected. Lower confidence bound: ${summary.confidenceInterval.lower.toFixed(2)}. Review high-risk channels.`
      );
    }

    // Best allocation strategy
    const bestScenario = scenarios.reduce((best, current) => 
      current.projectedROI > best.projectedROI ? current : best
    );
    
    recommendations.push(
      `Best scenario achieves ${bestScenario.projectedROI.toFixed(2)} ROI with ${bestScenario.projectedReach.toLocaleString()} reach.`
    );

    // Conservative recommendation
    recommendations.push(
      `Conservative estimate (lower ${summary.confidenceInterval.level * 100}% CI): ${summary.confidenceInterval.lower.toFixed(2)} ROI.`
    );

    return recommendations;
  }

  /**
   * Generate random variation
   */
  private randomVariation(variance: number, random: () => number = Math.random): number {
    // Box-Muller transform for normal distribution
    const u1 = random();
    const u2 = random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // Scale to variance (±3 standard deviations = ±variance)
    return (z / 3) * variance;
  }

  /**
   * Seeded random number generator
   */
  private seededRandom(seed: number): () => number {
    let state = seed;
    
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }

  /**
   * Calculate mean
   */
  private mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calculate median
   */
  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calculate standard deviation
   */
  private standardDeviation(values: number[]): number {
    const avg = this.mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquareDiff = this.mean(squareDiffs);
    
    return Math.sqrt(avgSquareDiff);
  }
}


