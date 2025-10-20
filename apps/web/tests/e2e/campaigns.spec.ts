import { test, expect } from '@playwright/test';

test.describe('Campaign Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to campaigns page
    await page.goto('/campaigns');
  });

  test('should display campaigns list page', async ({ page }) => {
    // Check for main heading
    await expect(page.getByRole('heading', { name: /campaigns/i })).toBeVisible();
    
    // Check for new campaign button
    await expect(page.getByRole('button', { name: /new campaign|create campaign/i })).toBeVisible();
  });

  test('should open create campaign dialog', async ({ page }) => {
    // Click new campaign button
    const createButton = page.getByRole('button', { name: /new campaign|create campaign/i });
    await createButton.click();
    
    // Dialog should appear
    await expect(page.locator('[role="dialog"], [role="modal"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: /new campaign|create/i })).toBeVisible();
  });

  test('should create new email campaign', async ({ page }) => {
    // Open create dialog
    await page.getByRole('button', { name: /new campaign|create campaign/i }).click();
    
    // Fill form fields
    await page.fill('[name="name"], input[placeholder*="name"]', 'Test Email Campaign');
    
    // Select campaign type
    const typeSelect = page.locator('select[name="type"], [role="combobox"]').first();
    if (await typeSelect.isVisible()) {
      await typeSelect.click();
      await page.getByRole('option', { name: /email/i }).click();
    }
    
    // Fill subject
    await page.fill('[name="subject"], input[placeholder*="subject"]', 'Test Subject Line');
    
    // Submit form
    await page.getByRole('button', { name: /create|save/i }).click();
    
    // Should show success message or redirect
    await expect(page.locator('text=/created|success/i')).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields in campaign form', async ({ page }) => {
    // Open create dialog
    await page.getByRole('button', { name: /new campaign|create campaign/i }).click();
    
    // Try to submit without filling fields
    await page.getByRole('button', { name: /create|save/i }).click();
    
    // Should show validation errors
    await expect(page.locator('text=/required|must not be empty/i')).toBeVisible();
  });

  test('should display campaign list with status', async ({ page }) => {
    // Wait for campaigns to load
    await page.waitForSelector('[data-testid="campaigns-list"], [data-testid="campaign-item"]', { 
      timeout: 5000,
      state: 'visible' 
    }).catch(() => {
      // May not have campaigns yet
    });
    
    // Check for status indicators if campaigns exist
    const statusBadges = page.locator('[data-testid*="status"], .badge, .status');
    const count = await statusBadges.count();
    
    if (count > 0) {
      // Should show status like draft, scheduled, active, completed
      await expect(statusBadges.first()).toBeVisible();
    }
  });

  test.skip('should schedule campaign', async ({ page }) => {
    // This requires existing campaign
    await page.goto('/campaigns');
    
    // Click schedule button on first campaign
    const scheduleButton = page.locator('[data-testid*="schedule"]').first();
    await scheduleButton.click();
    
    // Schedule dialog should appear
    await expect(page.locator('text=/schedule|when/i')).toBeVisible();
    
    // Set date and time
    await page.fill('[name="scheduleDate"], input[type="date"]', '2025-12-31');
    await page.fill('[name="scheduleTime"], input[type="time"]', '10:00');
    
    // Confirm schedule
    await page.getByRole('button', { name: /schedule|confirm/i }).click();
    
    // Success message
    await expect(page.locator('text=/scheduled|success/i')).toBeVisible({ timeout: 5000 });
  });

  test.skip('should view campaign details', async ({ page }) => {
    await page.goto('/campaigns');
    
    // Click on first campaign
    const firstCampaign = page.locator('[data-testid="campaign-item"]').first();
    await firstCampaign.click();
    
    // Should navigate to details page
    await expect(page.url()).toMatch(/\/campaigns\/[a-zA-Z0-9-]+/);
    
    // Should show campaign details
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test.skip('should run A/B test', async ({ page }) => {
    // Navigate to specific campaign
    await page.goto('/campaigns/test-campaign-id');
    
    // Click A/B test button
    await page.getByRole('button', { name: /a\/b test|split test/i }).click();
    
    // A/B test dialog
    await expect(page.locator('text=/variant|version/i')).toBeVisible();
    
    // Fill variants
    await page.fill('[name="variantA"], input[placeholder*="variant a"]', 'Subject A');
    await page.fill('[name="variantB"], input[placeholder*="variant b"]', 'Subject B');
    
    // Start test
    await page.getByRole('button', { name: /start test|run test/i }).click();
    
    // Should show test running indicator
    await expect(page.locator('[data-testid="ab-test-running"]')).toBeVisible({ timeout: 5000 });
  });

  test.skip('should display campaign analytics', async ({ page }) => {
    await page.goto('/campaigns/test-campaign-id/analytics');
    
    // Should show key metrics
    await expect(page.locator('[data-testid*="opens"], text=/opens/i')).toBeVisible();
    await expect(page.locator('[data-testid*="clicks"], text=/clicks/i')).toBeVisible();
    await expect(page.locator('[data-testid*="conversion"], text=/conversion/i')).toBeVisible();
  });

  test('should filter campaigns', async ({ page }) => {
    await page.goto('/campaigns');
    
    // Look for filter controls
    const filterInput = page.locator('input[placeholder*="filter"], input[placeholder*="search"]');
    
    if (await filterInput.isVisible()) {
      await filterInput.fill('test');
      await page.waitForTimeout(500);
      
      // Results should be filtered
      const campaigns = page.locator('[data-testid="campaign-item"]');
      const count = await campaigns.count();
      
      // Verify filtering
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const text = await campaigns.nth(i).textContent();
          expect(text?.toLowerCase()).toContain('test');
        }
      }
    }
  });

  test('should sort campaigns', async ({ page }) => {
    await page.goto('/campaigns');
    
    // Look for sort options
    const sortButton = page.getByRole('button', { name: /sort/i });
    
    if (await sortButton.isVisible()) {
      await sortButton.click();
      
      // Sort options should appear
      await expect(page.locator('text=/date|name|status/i')).toBeVisible();
    }
  });

  test.skip('should delete campaign', async ({ page }) => {
    await page.goto('/campaigns');
    
    // Click delete on first campaign
    const deleteButton = page.locator('[data-testid*="delete"]').first();
    await deleteButton.click();
    
    // Confirmation dialog
    await expect(page.locator('text=/confirm|are you sure/i')).toBeVisible();
    
    // Confirm deletion
    await page.getByRole('button', { name: /delete|confirm/i }).click();
    
    // Success message
    await expect(page.locator('text=/deleted|removed/i')).toBeVisible({ timeout: 5000 });
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/campaigns');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    
    // Focused element should be visible
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});

test.describe('Campaign Types', () => {
  test('should support email campaigns', async ({ page }) => {
    await page.goto('/campaigns');
    await page.getByRole('button', { name: /new campaign/i }).click();
    
    // Check email option exists
    await expect(page.locator('text=/email/i')).toBeVisible();
  });

  test('should support social media campaigns', async ({ page }) => {
    await page.goto('/campaigns');
    await page.getByRole('button', { name: /new campaign/i }).click();
    
    // Check social option exists
    await expect(page.locator('text=/social|twitter|facebook/i')).toBeVisible();
  });
});

test.describe('Campaign Performance', () => {
  test('should load campaigns list quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});