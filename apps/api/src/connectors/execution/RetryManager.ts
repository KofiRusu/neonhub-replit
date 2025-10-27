import { setTimeout as delay } from "timers/promises";
import { logger } from "../../lib/logger.js";

export interface RetryOptions {
  retries?: number;
  initialDelayMs?: number;
  factor?: number;
}

export class RetryManager {
  constructor(private readonly options: RetryOptions = {}) {
    this.options = {
      retries: options.retries ?? 3,
      initialDelayMs: options.initialDelayMs ?? 1000,
      factor: options.factor ?? 2,
    };
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    const { retries, initialDelayMs, factor } = this.options;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await fn();
      } catch (error) {
        attempt += 1;
        if (attempt > (retries ?? 0)) {
          throw error;
        }
        const wait = (initialDelayMs ?? 1000) * Math.pow(factor ?? 2, attempt - 1);
        logger.warn({ attempt, wait }, "Retrying connector operation after failure");
        await delay(wait);
      }
    }
  }
}

export const retryManager = new RetryManager();
