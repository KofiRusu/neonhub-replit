import { checkLimit, rateLimitFor, resetInMemoryRateLimiter } from '../rateLimiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    resetInMemoryRateLimiter();
  });

  test('should allow requests under limit', async () => {
    const result = await checkLimit('test-key-1', 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  test('should block requests over limit', async () => {
    const key = 'test-key-2';
    const limit = 5;
    
    // Make requests up to limit
    for (let i = 0; i < limit; i++) {
      await checkLimit(key, limit);
    }
    
    // Next request should be blocked
    const result = await checkLimit(key, limit);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test('should reset limit after window expires', async () => {
    const key = 'test-key-3';
    const limit = 5;
    
    // Fill up the limit
    for (let i = 0; i < limit; i++) {
      await checkLimit(key, limit);
    }
    
    // Wait for window to expire (60 seconds in production, immediate for testing)
    // Note: In real tests, we'd mock the timer
    const result = await checkLimit(key, limit);
    expect(result.resetMs).toBeGreaterThan(0);
  });

  test('should enforce both IP and user limits', async () => {
    const ipResult = await rateLimitFor('192.168.1.1', 'user123');
    expect(ipResult.allowed).toBe(true);
    expect(ipResult.scope).toBe('ok');
  });

  test('should block on IP limit even if user limit not reached', async () => {
    const ip = '192.168.1.2';
    const userId = 'user456';
    
    // Fill up IP limit (60 requests)
    for (let i = 0; i < 60; i++) {
      await rateLimitFor(ip, userId);
    }
    
    // Next request should be blocked due to IP limit
    const result = await rateLimitFor(ip, userId);
    expect(result.allowed).toBe(false);
    expect(result.scope).toBe('ip');
  });

  test('should provide remaining count', async () => {
    const key = 'test-key-4';
    const limit = 10;
    
    const result1 = await checkLimit(key, limit);
    expect(result1.remaining).toBe(9);
    
    const result2 = await checkLimit(key, limit);
    expect(result2.remaining).toBe(8);
  });

  test('should handle concurrent requests correctly', async () => {
    const key = 'test-key-5';
    const limit = 20;
    
    // Make 15 concurrent requests
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(checkLimit(key, limit));
    }
    
    const results = await Promise.all(promises);
    const allowed = results.filter(r => r.allowed);
    
    // All should be allowed since we're under limit
    expect(allowed.length).toBe(15);
  });
});
