/**
 * Allocation Engine Tests
 * 
 * Tests for budget allocation logic with deterministic scenarios
 */

import { AllocationEngine } from '../allocation-engine';
import type { BudgetPlan } from '../types';

describe('AllocationEngine', () => {
  let engine: AllocationEngine;

  beforeEach(() => {
    engine = new AllocationEngine();
  });

  describe('Basic Allocation', () => {
    it('should allocate budget based on priority weights', () => {
      const plan: BudgetPlan = {
        totalBudget: 10000,
        currency: 'USD',
        period: {
          start: new Date('2025-01-01'),
          end: new Date('2025-01-31'),
        },
        pacing: 'even',
        channels: [
          { channel: 'google-ads', priority: 8 },
          { channel: 'facebook-ads', priority: 6 },
          { channel: 'linkedin-ads', priority: 4 },
          { channel: 'twitter-ads', priority: 2 },
        ],
      };

      const result = engine.calculate(plan);

      // Total weight = 8+6+4+2 = 20
      // google-ads: 8/20 = 40% = $4000
      // facebook-ads: 6/20 = 30% = $3000
      // linkedin-ads: 4/20 = 20% = $2000
      // twitter-ads: 2/20 = 10% = $1000

      expect(result.totalAllocated).toBe(10000);
      expect(result.allocations).toHaveLength(4);
      
      const googleAds = result.allocations.find(a => a.channel === 'google-ads')!;
      expect(googleAds.amount).toBeCloseTo(4000, 0);
      expect(googleAds.percentage).toBeCloseTo(40, 0);

      const twitterAds = result.allocations.find(a => a.channel === 'twitter-ads')!;
      expect(twitterAds.amount).toBeCloseTo(1000, 0);
      expect(twitterAds.percentage).toBeCloseTo(10, 0);
    });

    it('should provide reasoning for decisions', () => {
      const plan: BudgetPlan = {
        totalBudget: 5000,
        currency: 'USD',
        period: { start: new Date(), end: new Date() },
        pacing: 'even',
        channels: [
          { channel: 'email', priority: 7 },
          { channel: 'social', priority: 3 },
        ],
      };

      const result = engine.calculate(plan);

      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
      
      // Should have validation, priority, and normalization steps
      expect(result.reasoning.some(r => r.rule === 'validation')).toBe(true);
      expect(result.reasoning.some(r => r.rule === 'priority_weighting')).toBe(true);
      expect(result.reasoning.some(r => r.rule === 'normalization')).toBe(true);
    });
  });

  describe('ROI-Based Adjustments', () => {
    it('should adjust allocation based on historical ROI', () => {
      const plan: BudgetPlan = {
        totalBudget: 10000,
        currency: 'USD',
        period: { start: new Date(), end: new Date() },
        pacing: 'even',
        channels: [
          { channel: 'high-roi', priority: 5, historicalROI: 3.0 }, // 300% ROI
          { channel: 'low-roi', priority: 5, historicalROI: 1.0 },  // 100% ROI
        ],
      };

      const result = engine.calculate(plan);

      const highROI = result.allocations.find(a => a.channel === 'high-roi')!;
      const lowROI = result.allocations.find(a => a.channel === 'low-roi')!;

      // High ROI channel should get more allocation
      expect(highROI.amount).toBeGreaterThan(lowROI.amount);
      expect(result.reasoning.some(r => r.rule === 'roi_optimization')).toBe(true);
    });
  });

  describe('Constraint Enforcement', () => {
    it('should enforce minimum allocations', () => {
      const plan: BudgetPlan = {
        totalBudget: 10000,
        currency: 'USD',
        period: { start: new Date(), end: new Date() },
        pacing: 'even',
        channels: [
          { channel: 'channel-a', priority: 9, minAllocation: 2000 },
          { channel: 'channel-b', priority: 1, minAllocation: 1000 },
        ],
      };

      const result = engine.calculate(plan);

      const channelB = result.allocations.find(a => a.channel === 'channel-b')!;
      expect(channelB.amount).toBeGreaterThanOrEqual(1000);
    });

    it('should enforce maximum allocations', () => {
      const plan: BudgetPlan = {
        totalBudget: 10000,
        currency: 'USD',
        period: { start: new Date(), end: new Date() },
        pacing: 'even',
        channels: [
          { channel: 'channel-a', priority: 10, maxAllocation: 3000 },
          { channel: 'channel-b', priority: 1 },
        ],
      };

      const result = engine.calculate(plan);

      const channelA = result.allocations.find(a => a.channel === 'channel-a')!;
      expect(channelA.amount).toBeLessThanOrEqual(3000);
    });

    it('should throw error if min allocations exceed total budget', () => {
      const plan: BudgetPlan = {
        totalBudget: 5000,
        currency: 'USD',
        period: { start: new Date(), end: new Date() },
        pacing: 'even',
        channels: [
          { channel: 'channel-a', priority: 5, minAllocation: 4000 },
          { channel: 'channel-b', priority: 5, minAllocation: 3000 },
        ],
      };

      expect(() => engine.calculate(plan)).toThrow('exceed total budget');
    });
  });

  describe('Estimates', () => {
    it('should calculate reach and ROI estimates', () => {
      const plan: BudgetPlan = {
        totalBudget: 10000,
        currency: 'USD',
        period: { start: new Date(), end: new Date() },
        pacing: 'even',
        channels: [
          { channel: 'channel-a', priority: 5, historicalROI: 2.5 },
          { channel: 'channel-b', priority: 5, historicalROI: 1.5 },
        ],
      };

      const result = engine.calculate(plan);

      expect(result.estimates.totalReach).toBeGreaterThan(0);
      expect(result.estimates.expectedROI).toBeGreaterThan(0);
      expect(result.estimates.confidence).toBeGreaterThan(0);
      expect(result.estimates.confidence).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Deterministic Output', () => {
    it('should produce identical results for same input', () => {
      const plan: BudgetPlan = {
        totalBudget: 10000,
        currency: 'USD',
        period: { start: new Date('2025-01-01'), end: new Date('2025-01-31') },
        pacing: 'even',
        channels: [
          { channel: 'email', priority: 7, historicalROI: 3.2 },
          { channel: 'social', priority: 5, historicalROI: 2.1 },
          { channel: 'search', priority: 8, historicalROI: 4.5 },
        ],
      };

      const result1 = engine.calculate(plan);
      const result2 = engine.calculate(plan);

      // Results should be deterministic
      expect(result1.totalAllocated).toBe(result2.totalAllocated);
      expect(result1.allocations.length).toBe(result2.allocations.length);
      
      for (let i = 0; i < result1.allocations.length; i++) {
        expect(result1.allocations[i].amount).toBeCloseTo(result2.allocations[i].amount, 2);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero budget', () => {
      const plan: BudgetPlan = {
        totalBudget: 0,
        currency: 'USD',
        period: { start: new Date(), end: new Date() },
        pacing: 'even',
        channels: [{ channel: 'test', priority: 5 }],
      };

      expect(() => engine.calculate(plan)).toThrow('greater than 0');
    });

    it('should handle single channel', () => {
      const plan: BudgetPlan = {
        totalBudget: 5000,
        currency: 'USD',
        period: { start: new Date(), end: new Date() },
        pacing: 'even',
        channels: [{ channel: 'only-channel', priority: 10 }],
      };

      const result = engine.calculate(plan);

      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0].amount).toBe(5000);
      expect(result.allocations[0].percentage).toBe(100);
    });

    it('should handle no channels', () => {
      const plan: BudgetPlan = {
        totalBudget: 5000,
        currency: 'USD',
        period: { start: new Date(), end: new Date() },
        pacing: 'even',
        channels: [],
      };

      expect(() => engine.calculate(plan)).toThrow('At least one channel is required');
    });
  });
});


