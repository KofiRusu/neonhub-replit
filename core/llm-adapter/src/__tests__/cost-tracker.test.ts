import { describe, it, expect, beforeEach } from '@jest/globals';
import { CostTrackerImpl } from '../cost-tracker.js';
import { Usage } from '../types.js';

describe('CostTracker', () => {
  let tracker: CostTrackerImpl;

  beforeEach(() => {
    tracker = new CostTrackerImpl();
  });

  it('should track usage', () => {
    const usage: Usage = {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    };

    tracker.trackUsage('gpt-4', usage);

    expect(tracker.getTotalCost()).toBeGreaterThan(0);
    expect(tracker.getCostByModel('gpt-4')).toBeGreaterThan(0);
  });

  it('should calculate GPT-4 costs correctly', () => {
    const usage: Usage = {
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
    };

    tracker.trackUsage('gpt-4', usage);

    // GPT-4: $0.03/1K input, $0.06/1K output
    // Expected: (1000/1000 * 0.03) + (500/1000 * 0.06) = 0.03 + 0.03 = 0.06
    const cost = tracker.getCostByModel('gpt-4');
    expect(cost).toBeCloseTo(0.06, 4);
  });

  it('should calculate GPT-3.5-turbo costs correctly', () => {
    const usage: Usage = {
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
    };

    tracker.trackUsage('gpt-3.5-turbo', usage);

    // GPT-3.5-turbo: $0.0015/1K input, $0.002/1K output
    // Expected: (1000/1000 * 0.0015) + (500/1000 * 0.002) = 0.0015 + 0.001 = 0.0025
    const cost = tracker.getCostByModel('gpt-3.5-turbo');
    expect(cost).toBeCloseTo(0.0025, 5);
  });

  it('should track multiple models', () => {
    tracker.trackUsage('gpt-4', { promptTokens: 100, completionTokens: 50, totalTokens: 150 });
    tracker.trackUsage('gpt-3.5-turbo', { promptTokens: 200, completionTokens: 100, totalTokens: 300 });

    const stats = tracker.getUsageStats();
    expect(Object.keys(stats).length).toBe(2);
    expect(stats['gpt-4'].calls).toBe(1);
    expect(stats['gpt-3.5-turbo'].calls).toBe(1);
  });

  it('should accumulate costs', () => {
    const usage: Usage = {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    };

    tracker.trackUsage('gpt-4', usage);
    tracker.trackUsage('gpt-4', usage);
    tracker.trackUsage('gpt-4', usage);

    const stats = tracker.getUsageStats();
    expect(stats['gpt-4'].calls).toBe(3);
    expect(stats['gpt-4'].tokens).toBe(450);
  });

  it('should generate report', () => {
    tracker.trackUsage('gpt-4', { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 });
    tracker.trackUsage('gpt-3.5-turbo', { promptTokens: 2000, completionTokens: 1000, totalTokens: 3000 });

    const report = tracker.getReport();
    expect(report).toContain('LLM Cost Report');
    expect(report).toContain('gpt-4');
    expect(report).toContain('gpt-3.5-turbo');
    expect(report).toContain('Total:');
  });

  it('should reset all tracking', () => {
    tracker.trackUsage('gpt-4', { promptTokens: 100, completionTokens: 50, totalTokens: 150 });
    expect(tracker.getTotalCost()).toBeGreaterThan(0);

    tracker.reset();
    expect(tracker.getTotalCost()).toBe(0);
    expect(Object.keys(tracker.getUsageStats()).length).toBe(0);
  });
});

