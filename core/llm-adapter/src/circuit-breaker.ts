import { CircuitState, CircuitBreaker } from './types.js';

/**
 * Circuit breaker implementation to prevent cascading failures
 */
export class CircuitBreakerImpl implements CircuitBreaker {
  state: CircuitState = CircuitState.CLOSED;
  failureCount = 0;
  successCount = 0;
  lastFailureTime: number | null = null;

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 60s
    private readonly halfOpenMaxAttempts: number = 3,
  ) {}

  recordSuccess(): void {
    this.failureCount = 0;
    this.successCount++;

    if (this.state === CircuitState.HALF_OPEN && this.successCount >= this.halfOpenMaxAttempts) {
      this.state = CircuitState.CLOSED;
      this.successCount = 0;
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
    }
  }

  canExecute(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      if (this.lastFailureTime && now - this.lastFailureTime >= this.timeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        return true;
      }
      return false;
    }

    // HALF_OPEN: allow limited attempts
    return true;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }

  getStatus(): { state: CircuitState; failures: number; successes: number } {
    return {
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
    };
  }
}

