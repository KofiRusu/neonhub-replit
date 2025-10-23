import { test, expect } from '@playwright/test';

const dashboardSelectors = {
  headline: 'Get started by editing',
  docsLink: /Read our docs/i,
  deployLink: /Deploy now/i,
};

test.describe('NeonUI onboarding surface', () => {
  test('renders the landing experience with key calls to action', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(dashboardSelectors.headline)).toBeVisible();

    const docsLink = page.getByRole('link', { name: dashboardSelectors.docsLink });
    await expect(docsLink).toBeVisible();
    await expect(docsLink).toHaveAttribute('href', expect.stringContaining('nextjs.org/docs'));

    const deployLink = page.getByRole('link', { name: dashboardSelectors.deployLink });
    await expect(deployLink).toBeVisible();
    await expect(deployLink).toHaveAttribute('href', expect.stringContaining('vercel.com'));

    const heroImage = page.locator('img[alt="Next.js logo"]');
    await expect(heroImage).toBeVisible();
  });
});
