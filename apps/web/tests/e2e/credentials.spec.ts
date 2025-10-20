import { test, expect } from '@playwright/test';

test.describe('Credential Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to credentials page
    // Note: In real tests, would need authentication setup
    await page.goto('/settings/credentials');
  });

  test('should display credentials settings page', async ({ page }) => {
    // Check for main heading
    await expect(page.getByRole('heading', { name: /credentials/i })).toBeVisible();
    
    // Check for credentials list container
    const credentialsList = page.locator('[data-testid="credentials-list"]');
    await expect(credentialsList).toBeVisible();
  });

  test('should display available credential providers', async ({ page }) => {
    // Check for common OAuth providers
    await expect(page.locator('text=/twitter|x.com/i')).toBeVisible();
    await expect(page.locator('text=/facebook|meta/i')).toBeVisible();
    await expect(page.locator('text=/linkedin/i')).toBeVisible();
  });

  test('should mask sensitive token values', async ({ page }) => {
    // Wait for any credentials to load
    await page.waitForSelector('[data-testid="credentials-list"]', { timeout: 5000 });
    
    // Check if any token elements exist
    const tokenElements = page.locator('[data-testid*="token"], [data-testid*="access"]');
    const count = await tokenElements.count();
    
    if (count > 0) {
      // Verify tokens are masked (showing pattern like ****...****)
      for (let i = 0; i < count; i++) {
        const text = await tokenElements.nth(i).textContent();
        // Should contain asterisks or be hidden
        expect(text).toMatch(/\*{3,}|hidden|masked/i);
      }
    }
  });

  test('should open connect credential dialog', async ({ page }) => {
    // Look for "Connect" or "Add Credential" button
    const connectButton = page.getByRole('button', { name: /connect|add credential/i }).first();
    await connectButton.click();
    
    // Dialog/modal should appear
    await expect(page.locator('[role="dialog"], [role="modal"]')).toBeVisible();
  });

  test('should show provider selection in connect dialog', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /connect|add credential/i }).first();
    await connectButton.click();
    
    // Should show provider options
    await expect(page.locator('text=/select provider|choose provider/i')).toBeVisible();
  });

  test('should initiate OAuth flow for Twitter', async ({ page }) => {
    // Click connect Twitter button
    const twitterButton = page.getByRole('button', { name: /connect twitter|connect x/i });
    
    if (await twitterButton.isVisible()) {
      await twitterButton.click();
      
      // Should redirect or show OAuth popup
      // In real scenario, would redirect to Twitter OAuth
      await page.waitForTimeout(1000);
    }
  });

  test.skip('should display connected credential status', async ({ page, context }) => {
    // This requires actual OAuth flow completion
    // Skip unless integration test environment is set up
    
    await page.goto('/settings/credentials');
    
    // Look for connected status indicator
    const connectedBadge = page.locator('[data-testid*="connected"], text=/connected/i');
    await expect(connectedBadge.first()).toBeVisible();
  });

  test.skip('should allow revoking credential', async ({ page }) => {
    // This requires actual credentials to exist
    await page.goto('/settings/credentials');
    
    // Click revoke button
    const revokeButton = page.locator('[data-testid*="revoke"]').first();
    await revokeButton.click();
    
    // Confirmation dialog should appear
    await expect(page.locator('text=/confirm|are you sure/i')).toBeVisible();
    
    // Confirm revocation
    await page.getByRole('button', { name: /confirm|yes|revoke/i }).click();
    
    // Success message should appear
    await expect(page.locator('text=/revoked|disconnected/i')).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields in manual credential form', async ({ page }) => {
    // If manual credential entry is available
    const manualButton = page.getByRole('button', { name: /manual|api key/i });
    
    if (await manualButton.isVisible()) {
      await manualButton.click();
      
      // Try to submit without filling fields
      const submitButton = page.getByRole('button', { name: /save|add/i });
      await submitButton.click();
      
      // Should show validation errors
      await expect(page.locator('text=/required|must not be empty/i')).toBeVisible();
    }
  });

  test('should filter credentials by provider', async ({ page }) => {
    // Look for filter/search functionality
    const filterInput = page.locator('input[placeholder*="filter"], input[placeholder*="search"]');
    
    if (await filterInput.isVisible()) {
      await filterInput.fill('twitter');
      await page.waitForTimeout(500);
      
      // Should filter results
      const visibleItems = page.locator('[data-testid="credential-item"]');
      const count = await visibleItems.count();
      
      // Verify filtering works (or shows empty state)
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const text = await visibleItems.nth(i).textContent();
          expect(text?.toLowerCase()).toContain('twitter');
        }
      }
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/settings/credentials');
    
    // Press Tab to navigate through interactive elements
    await page.keyboard.press('Tab');
    
    // Verify focus is on an interactive element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Should be able to activate with Enter/Space
    await page.keyboard.press('Enter');
  });
});

test.describe('Credential Security', () => {
  test('should not expose tokens in page source', async ({ page }) => {
    await page.goto('/settings/credentials');
    
    // Get page content
    const content = await page.content();
    
    // Should not contain patterns that look like real tokens
    // Real tokens typically look like: sk_live_xxxxxxx, at-xxxxxxx, etc.
    expect(content).not.toMatch(/sk_live_[a-zA-Z0-9]{20,}/);
    expect(content).not.toMatch(/at-[a-zA-Z0-9]{20,}/);
  });

  test('should use HTTPS for credential operations', async ({ page }) => {
    await page.goto('/settings/credentials');
    
    // In production, should always use HTTPS
    if (process.env.NODE_ENV === 'production') {
      expect(page.url()).toMatch(/^https:/);
    }
  });
});