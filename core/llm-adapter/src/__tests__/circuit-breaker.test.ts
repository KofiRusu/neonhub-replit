import { describe, it, expect, beforeEach } from '@jest/globals';
import { CircuitBreakerImpl } from '../circuit-breaker.js';
import { CircuitState } from '../types.js';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreakerImpl;

  beforeEach(() => {
    breaker = new CircuitBreakerImpl(3, 5000); // 3 failures, 5s timeout
  });

  it('should start in CLOSED state', () => {
    expect(breaker.state).toBe(CircuitState.CLOSED);
    expect(breaker.canExecute()).toBe(true);
  });

  it('should open after threshold failures', () => {
    breaker.recordFailure();
    expect(breaker.state).toBe(CircuitState.CLOSED);
    expect(breaker.canExecute()).toBe(true);

    breaker.recordFailure();
    expect(breaker.state).toBe(CircuitState.CLOSED);

    breaker.recordFailure();
    expect(breaker.state).toBe(CircuitState.OPEN);
    expect(breaker.canExecute()).toBe(false);
  });

  it('should reset failure count on success', () => {
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.failureCount).toBe(2);

    breaker.recordSuccess();
    expect(breaker.failureCount).toBe(0);
    expect(breaker.state).toBe(CircuitState.CLOSED);
  });

  it('should transition to HALF_OPEN after timeout', async () => {
    // Open the circuit
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.state).toBe(CircuitState.OPEN);

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 5100));

    // Should allow execution (HALF_OPEN)
    expect(breaker.canExecute()).toBe(true);
    expect(breaker.state).toBe(CircuitState.HALF_OPEN);
  }, 10000);

  it('should close after successful HALF_OPEN attempts', async () => {
    const customBreaker = new CircuitBreakerImpl(2, 1000, 2); // 2 successes needed

    // Open the circuit
    customBreaker.recordFailure();
    customBreaker.recordFailure();
    expect(customBreaker.state).toBe(CircuitState.OPEN);

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Execute in HALF_OPEN
    expect(customBreaker.canExecute()).toBe(true);
    expect(customBreaker.state).toBe(CircuitState.HALF_OPEN);

    // First success
    customBreaker.recordSuccess();
    expect(customBreaker.state).toBe(CircuitState.HALF_OPEN);

    // Second success should close
    customBreaker.recordSuccess();
    expect(customBreaker.state).toBe(CircuitState.CLOSED);
  }, 5000);

  it('should provide status', () => {
    breaker.recordFailure();
    const status = breaker.getStatus();

    expect(status.state).toBe(CircuitState.CLOSED);
    expect(status.failures).toBe(1);
    expect(status.successes).toBe(0);
  });

  it('should reset all state', () => {
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.state).toBe(CircuitState.OPEN);

    breaker.reset();
    expect(breaker.state).toBe(CircuitState.CLOSED);
    expect(breaker.failureCount).toBe(0);
    expect(breaker.canExecute()).toBe(true);
  });
});

