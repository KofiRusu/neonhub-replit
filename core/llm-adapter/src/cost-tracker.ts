import { CostTracker, Usage } from './types.js';

/**
 * Model pricing (USD per 1K tokens)
 * Based on OpenAI pricing as of 2024
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'text-embedding-ada-002': { input: 0.0001, output: 0 },
  'text-embedding-3-small': { input: 0.00002, output: 0 },
  'text-embedding-3-large': { input: 0.00013, output: 0 },
};

interface ModelStats {
  calls: number;
  tokens: number;
  cost: number;
}

/**
 * Tracks token usage and costs across LLM calls
 */
export class CostTrackerImpl implements CostTracker {
  private stats: Map<string, ModelStats> = new Map();

  trackUsage(model: string, usage: Usage): void {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4']; // Default to GPT-4 pricing
    
    const inputCost = (usage.promptTokens / 1000) * pricing.input;
    const outputCost = (usage.completionTokens / 1000) * pricing.output;
    const totalCost = inputCost + outputCost;

    const existing = this.stats.get(model) || { calls: 0, tokens: 0, cost: 0 };
    
    this.stats.set(model, {
      calls: existing.calls + 1,
      tokens: existing.tokens + usage.totalTokens,
      cost: existing.cost + totalCost,
    });
  }

  getTotalCost(): number {
    let total = 0;
    for (const stats of this.stats.values()) {
      total += stats.cost;
    }
    return total;
  }

  getCostByModel(model: string): number {
    return this.stats.get(model)?.cost || 0;
  }

  getUsageStats(): Record<string, ModelStats> {
    const result: Record<string, ModelStats> = {};
    for (const [model, stats] of this.stats.entries()) {
      result[model] = { ...stats };
    }
    return result;
  }

  reset(): void {
    this.stats.clear();
  }

  /**
   * Get formatted cost report
   */
  getReport(): string {
    const lines: string[] = ['=== LLM Cost Report ==='];
    let totalCost = 0;
    let totalTokens = 0;
    let totalCalls = 0;

    for (const [model, stats] of this.stats.entries()) {
      lines.push(
        `${model}: ${stats.calls} calls, ${stats.tokens.toLocaleString()} tokens, $${stats.cost.toFixed(4)}`
      );
      totalCost += stats.cost;
      totalTokens += stats.tokens;
      totalCalls += stats.calls;
    }

    lines.push('---');
    lines.push(`Total: ${totalCalls} calls, ${totalTokens.toLocaleString()} tokens, $${totalCost.toFixed(4)}`);

    return lines.join('\n');
  }
}

