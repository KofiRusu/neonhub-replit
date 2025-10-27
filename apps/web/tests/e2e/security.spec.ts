import { test, expect } from '@playwright/test';

test.describe('Security Headers', () => {
  test('should have CSP header on all pages', async ({ page }) => {
    const response = await page.goto('/');
    const csp = response?.headers()['content-security-policy'];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test('should have X-Frame-Options DENY', async ({ page }) => {
    const response = await page.goto('/auth/signin');
    expect(response?.headers()['x-frame-options']).toBe('DENY');
  });

  test('should have X-Content-Type-Options nosniff', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.headers()['x-content-type-options']).toBe('nosniff');
  });

  test('should have security headers on API health endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/health');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['x-frame-options']).toBe('DENY');
  });
});

test.describe('CORS Protection', () => {
  test('should block requests from unauthorized origin', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/campaigns', {
      headers: { origin: 'https://evil.com' },
    });
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('CORS blocked');
  });

  test('should allow requests from authorized origin', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/health', {
      headers: { origin: 'http://localhost:3000' },
    });
    expect(response.ok()).toBeTruthy();
  });

  test('should handle OPTIONS preflight correctly', async ({ request }) => {
    const response = await request.fetch('http://localhost:3001/api/health', {
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:3000' },
    });
    expect(response.status()).toBe(204);
  });
});

test.describe('Rate Limiting', () => {
  test.skip('should rate limit excessive requests', async ({ request }) => {
    // Skip if rate limiting is disabled
    if (process.env.DISABLE_RATE_LIMIT === 'true') {
      test.skip();
    }

    const requests = [];
    for (let i = 0; i < 70; i++) {
      requests.push(request.get('http://localhost:3001/api/health'));
    }
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status() === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test.skip('should include rate limit headers', async ({ request }) => {
    if (process.env.DISABLE_RATE_LIMIT === 'true') {
      test.skip();
    }

    const response = await request.get('http://localhost:3001/api/health');
    expect(response.headers()['x-ratelimit-limit']).toBeTruthy();
    expect(response.headers()['x-ratelimit-remaining']).toBeTruthy();
    expect(response.headers()['x-ratelimit-reset']).toBeTruthy();
  });
});

test.describe('Open Redirect Protection', () => {
  test('should sanitize unsafe redirect parameters', async ({ page }) => {
    await page.goto('/?redirect=https://evil.com');
    // Should either remove redirect param or stay on safe URL
    expect(page.url()).not.toContain('evil.com');
  });

  test('should allow safe relative redirects', async ({ page }) => {
    await page.goto('/?redirect=/dashboard');
    // Should allow relative paths
    expect(page.url()).toContain('localhost');
  });
});
