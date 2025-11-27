import pino from 'pino';
import { BudgetTracker } from './types.js';

const logger = pino({ name: 'budget-tracker' });

/**
 * Tracks resource consumption against budgets
 */
export class BudgetTrackerImpl implements BudgetTracker {
  consumed = {
    cost: 0,
    tokens: 0,
    time: 0,
  };

  limits: {
    maxCost?: number;
    maxTokens?: number;
    maxTime?: number;
  };

  constructor(limits: { maxCost?: number; maxTokens?: number; maxTime?: number } = {}) {
    this.limits = limits;
  }

  canExecute(): boolean {
    if (this.limits.maxCost !== undefined && this.consumed.cost >= this.limits.maxCost) {
      logger.warn({ consumed: this.consumed.cost, limit: this.limits.maxCost }, 'Cost budget exceeded');
      return false;
    }

    if (this.limits.maxTokens !== undefined && this.consumed.tokens >= this.limits.maxTokens) {
      logger.warn({ consumed: this.consumed.tokens, limit: this.limits.maxTokens }, 'Token budget exceeded');
      return false;
    }

    if (this.limits.maxTime !== undefined && this.consumed.time >= this.limits.maxTime) {
      logger.warn({ consumed: this.consumed.time, limit: this.limits.maxTime }, 'Time budget exceeded');
      return false;
    }

    return true;
  }

  track(cost: number, tokens: number, time: number): void {
    this.consumed.cost += cost;
    this.consumed.tokens += tokens;
    this.consumed.time += time;

    logger.info({ consumed: this.consumed, limits: this.limits }, 'Budget tracked');
  }

  reset(): void {
    this.consumed = {
      cost: 0,
      tokens: 0,
      time: 0,
    };
    logger.info('Budget reset');
  }

  getRemaining(): { cost?: number; tokens?: number; time?: number } {
    return {
      cost: this.limits.maxCost !== undefined ? this.limits.maxCost - this.consumed.cost : undefined,
      tokens: this.limits.maxTokens !== undefined ? this.limits.maxTokens - this.consumed.tokens : undefined,
      time: this.limits.maxTime !== undefined ? this.limits.maxTime - this.consumed.time : undefined,
    };
  }

  getUsagePercent(): { cost?: number; tokens?: number; time?: number } {
    return {
      cost: this.limits.maxCost !== undefined ? (this.consumed.cost / this.limits.maxCost) * 100 : undefined,
      tokens: this.limits.maxTokens !== undefined ? (this.consumed.tokens / this.limits.maxTokens) * 100 : undefined,
      time: this.limits.maxTime !== undefined ? (this.consumed.time / this.limits.maxTime) * 100 : undefined,
    };
  }
}

