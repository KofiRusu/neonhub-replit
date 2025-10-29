import { setTimeout as sleep } from "timers/promises";
import { logger } from "../../lib/logger.js";

type AsyncFn<Args extends unknown[], Result> = (...args: Args) => Promise<Result>;

export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CircuitBreakerOpenError";
  }
}

export function withRetry<Args extends unknown[], Result>(
  fn: AsyncFn<Args, Result>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {}
): AsyncFn<Args, Result> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 50;

  return async (...args: Args): Promise<Result> => {
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxAttempts) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        attempt += 1;

        if (attempt >= maxAttempts) {
          break;
        }

        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        logger.warn({ attempt, delay }, "Retrying orchestrator handler after failure");
        await sleep(delay);
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Handler failed after retries");
  };
}

export function withCircuitBreaker<Args extends unknown[], Result>(
  fn: AsyncFn<Args, Result>,
  options: { failThreshold: number; cooldownMs: number }
): AsyncFn<Args, Result> {
  let failureCount = 0;
  let lastFailureAt = 0;

  return async (...args: Args): Promise<Result> => {
    const now = Date.now();
    if (failureCount >= options.failThreshold && now - lastFailureAt < options.cooldownMs) {
      throw new CircuitBreakerOpenError("Circuit breaker open");
    }

    try {
      const result = await fn(...args);
      failureCount = 0;
      return result;
    } catch (error) {
      failureCount += 1;
      lastFailureAt = now;
      logger.error({ failureCount }, "Orchestrator handler failure recorded");
      throw error;
    }
  };
}
