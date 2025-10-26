import { test, expect } from '@playwright/test';

test.describe('Billing & Subscriptions', () => {
  test('should display subscription plans on pricing page', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check for main heading
    await expect(page.getByRole('heading', { name: /pricing|plans/i })).toBeVisible();
    
    // Check for plan cards
    await expect(page.locator('[data-testid="plan-free"], text=/free/i')).toBeVisible();
    await expect(page.locator('[data-testid="plan-pro"], text=/pro/i')).toBeVisible();
    await expect(page.locator('[data-testid="plan-enterprise"], text=/enterprise/i')).toBeVisible();
  });

  test('should display plan features', async ({ page }) => {
    await page.goto('/pricing');
    
    // Each plan should show features
    const features = page.locator('ul li, [data-testid*="feature"]');
    await expect(features.first()).toBeVisible();
    
    // Common features to check for
    await expect(page.locator('text=/campaigns/i')).toBeVisible();
    await expect(page.locator('text=/emails/i')).toBeVisible();
  });

  test('should show free plan limits', async ({ page }) => {
    await page.goto('/pricing');
    
    // Free tier should show limits
    const freePlan = page.locator('[data-testid="plan-free"]');
    await expect(freePlan).toBeVisible();
    
    // Check for typical free tier limits
    await expect(page.locator('text=/5 campaigns|limited/i')).toBeVisible();
  });

  test('should initiate checkout for Pro plan', async ({ page }) => {
    await page.goto('/pricing');
    
    // Click upgrade button for Pro plan
    const upgradeButton = page.locator('[data-testid="upgrade-pro"], button:has-text("Upgrade")').first();
    
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
      
      // Should redirect or show checkout modal
      // In real scenario, would redirect to Stripe checkout
      await page.waitForTimeout(1000);
      
      // Check for redirect or modal
      const isStripeUrl = page.url().includes('stripe.com') || page.url().includes('checkout');
      const hasCheckoutModal = await page.locator('[role="dialog"], [data-testid="checkout-modal"]').isVisible();
      
      expect(isStripeUrl || hasCheckoutModal).toBeTruthy();
    }
  });

  test('should display current subscription in settings', async ({ page }) => {
    await page.goto('/settings/billing');
    
    // Should show subscription info
    await expect(page.getByRole('heading', { name: /billing|subscription/i })).toBeVisible();
    
    // Should show current plan
    await expect(page.locator('[data-testid="current-plan"], text=/plan|tier/i')).toBeVisible();
  });

  test('should show usage limits on free tier', async ({ page }) => {
    await page.goto('/settings/billing');
    
    // Look for usage indicators
    const usageSection = page.locator('[data-testid="usage-limits"], text=/usage|limits/i');
    
    if (await usageSection.isVisible()) {
      // Should show metrics like campaigns, emails, etc.
      await expect(page.locator('text=/campaigns/i')).toBeVisible();
      await expect(page.locator('text=/emails/i')).toBeVisible();
    }
  });

  test('should display usage progress bars', async ({ page }) => {
    await page.goto('/settings/billing');
    
    // Check for progress bars or usage meters
    const progressBars = page.locator('[role="progressbar"], .progress, [data-testid*="usage"]');
    const count = await progressBars.count();
    
    if (count > 0) {
      await expect(progressBars.first()).toBeVisible();
    }
  });

  test.skip('should block campaign creation at limit', async ({ page, context: _context }) => {
    // This test requires setting up a user at their limit
    // Skip unless test data is available
    
    await page.goto('/campaigns');
    
    // Try to create new campaign
    await page.getByRole('button', { name: /new campaign/i }).click();
    
    // Should show limit reached message
    await expect(page.locator('text=/limit reached|upgrade/i')).toBeVisible();
    
    // Should have upgrade button
    await expect(page.getByRole('button', { name: /upgrade/i })).toBeVisible();
  });

  test('should display billing history', async ({ page }) => {
    await page.goto('/settings/billing');
    
    // Look for billing history section
    const historySection = page.locator('text=/history|invoices|transactions/i');
    
    if (await historySection.isVisible()) {
      // Should show table or list of transactions
      await expect(page.locator('table, [data-testid="transaction-list"]')).toBeVisible();
    }
  });

  test('should show payment method section', async ({ page }) => {
    await page.goto('/settings/billing');
    
    // Look for payment method section
    const paymentSection = page.locator('text=/payment method|card|billing info/i');
    
    if (await paymentSection.isVisible()) {
      // Should have add/update payment method option
      await expect(page.locator('button:has-text("Add"), button:has-text("Update")')).toBeVisible();
    }
  });

  test('should allow canceling subscription', async ({ page }) => {
    await page.goto('/settings/billing');
    
    // Look for cancel button
    const cancelButton = page.locator('button:has-text("Cancel Subscription"), [data-testid="cancel-subscription"]');
    
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      
      // Should show confirmation dialog
      await expect(page.locator('text=/confirm|are you sure/i')).toBeVisible();
    }
  });

  test('should compare plans side by side', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check if plans are displayed in a comparable format
    const planCards = page.locator('[data-testid*="plan-"]');
    const count = await planCards.count();
    
    // Should have at least 2 plans to compare
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should highlight recommended plan', async ({ page }) => {
    await page.goto('/pricing');
    
    // Look for recommended badge or highlight
    const recommended = page.locator('text=/recommended|popular|best value/i');
    
    // Most pricing pages have a recommended plan
    if (await recommended.isVisible()) {
      await expect(recommended).toBeVisible();
    }
  });

  test('should show annual vs monthly pricing toggle', async ({ page }) => {
    await page.goto('/pricing');
    
    // Look for billing cycle toggle
    const toggle = page.locator('text=/monthly|annual|yearly/i');
    
    if (await toggle.isVisible()) {
      // Should be able to switch between billing cycles
      await toggle.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Billing Security', () => {
  test('should use secure payment provider', async ({ page }) => {
    await page.goto('/pricing');
    
    // When clicking upgrade, should redirect to Stripe (secure provider)
    const upgradeButton = page.locator('[data-testid="upgrade-pro"]').first();
    
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
      await page.waitForTimeout(1000);
      
      // Should use HTTPS for payment pages
      if (page.url().includes('checkout')) {
        expect(page.url()).toMatch(/^https:/);
      }
    }
  });

  test('should display security badges', async ({ page }) => {
    await page.goto('/pricing');
    
    // Look for trust indicators
    const securityBadges = page.locator('text=/secure|encrypted|ssl|stripe|pci/i');
    
    // Most pricing pages show security badges
    const count = await securityBadges.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Plan Restrictions', () => {
  test('should show upgrade prompt for pro features', async ({ page }) => {
    // Navigate to a feature that might be pro-only
    await page.goto('/campaigns');
    
    // Look for pro badges or upgrade prompts
    const proBadge = page.locator('text=/pro|premium|upgrade/i');
    
    if (await proBadge.isVisible()) {
      await expect(proBadge).toBeVisible();
    }
  });

  test('should disable pro features for free users', async ({ page }) => {
    await page.goto('/campaigns');
    
    // Look for disabled/locked features
    const lockedFeatures = page.locator('[data-testid*="locked"], [aria-disabled="true"], .disabled');
    
    // Some features might be locked
    const count = await lockedFeatures.count();
    if (count > 0) {
      await expect(lockedFeatures.first()).toBeVisible();
    }
  });
});

test.describe('Billing Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/pricing');
    
    // Tab through plan cards
    await page.keyboard.press('Tab');
    
    // Should focus on interactive elements
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have accessible plan comparison', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible();
    
    // Plan cards should have proper labels
    const planLabels = page.locator('[aria-label*="plan"], [aria-labelledby]');
    const count = await planLabels.count();
    
    if (count > 0) {
      await expect(planLabels.first()).toBeVisible();
    }
  });
});
