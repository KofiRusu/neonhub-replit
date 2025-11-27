/**
 * Critical Flows E2E Tests
 * Playwright tests for essential user journeys
 */

import { test, expect } from '@playwright/test';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100';
const WEB_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto(WEB_URL);
  });

  test('Flow 1: Homepage loads successfully', async ({ page }) => {
    // Check page loads
    await expect(page).toHaveTitle(/NeonHub/i);
    
    // Check key elements present
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('Flow 2: Content creation workflow', async ({ page }) => {
    // Skip auth for E2E (or implement test user login)
    // Navigate to content creation
    await page.goto(`${WEB_URL}/content/new`);
    
    // Check form is present
    const form = page.locator('form, [role="form"]').first();
    await expect(form).toBeVisible({ timeout: 10000 });
    
    // Fill minimal form data (adjust selectors based on actual form)
    const topicInput = page.locator('input[name="topic"], input[placeholder*="topic" i]').first();
    if (await topicInput.isVisible()) {
      await topicInput.fill('Test AI Marketing Content');
    }
    
    // Note: Full flow requires authentication
    // This test validates page structure exists
  });

  test('Flow 3: Agent Runs page displays', async ({ page }) => {
    // Navigate to agents page
    await page.goto(`${WEB_URL}/agents`);
    
    // Check page loads
    await expect(page.locator('h1, h3')).toContainText(/Agent/i, { timeout: 10000 });
    
    // Check for either data or empty state
    const hasContent = await page.locator('text=/No agent runs|Agent Runs|execution/i').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('API: Health endpoint responds', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
  });

  test('API: Metrics endpoint exposes Prometheus data', async ({ request }) => {
    const response = await request.get(`${API_URL}/metrics`);
    expect(response.ok()).toBeTruthy();
    
    const text = await response.text();
    expect(text).toContain('agent_runs_total');
    expect(text).toContain('# HELP');
    expect(text).toContain('# TYPE');
  });
});

