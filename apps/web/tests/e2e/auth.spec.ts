import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for navigation to complete
    await page.waitForURL(/.*sign-in/, { timeout: 5000 });
    expect(page.url()).toContain('sign-in');
  });

  test('should display sign-in page with OAuth options', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check for OAuth buttons
    await expect(page.getByRole('button', { name: /sign in with github/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
  });

  test('should navigate to GitHub OAuth when clicking GitHub button', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Click GitHub sign-in button
    const githubButton = page.getByRole('button', { name: /sign in with github/i });
    await githubButton.click();
    
    // Should redirect to GitHub (or NextAuth callback)
    await page.waitForURL(/.*github.com.*|.*api\/auth\/signin\/github.*/i, { timeout: 5000 });
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // If email/password form exists
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid@example.com');
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Check for error message
      await expect(page.locator('text=/error|invalid|incorrect/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have accessible sign-in page', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check for proper heading structure
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check buttons are keyboard accessible
    const githubButton = page.getByRole('button', { name: /sign in with github/i });
    await githubButton.focus();
    await expect(githubButton).toBeFocused();
  });
});

test.describe('Authenticated User Session', () => {
  test.skip('should show user profile after login', async ({ page, context }) => {
    // This test requires real authentication setup
    // Skip in CI unless auth test credentials are available
    
    // Setup authenticated session (would use test credentials)
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    await page.goto('/profile');
    await expect(page.locator('[data-testid="user-email"]')).toBeVisible();
  });

  test.skip('should logout and clear session', async ({ page, context }) => {
    // This test requires real authentication setup
    
    // Setup authenticated session
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    await page.goto('/dashboard');
    await page.click('[data-testid="user-menu"]');
    await page.click('button:has-text("Logout")');
    
    // Should redirect to sign-in
    await expect(page).toHaveURL(/.*sign-in/);
    
    // Session should be cleared
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session'));
    expect(sessionCookie).toBeUndefined();
  });
});