import { test, expect } from '@playwright/test';

test.describe('Space Blitz Game Lobby', () => {
  test('should load the main page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Space Blitz/);
  });

  test('should display game interface elements', async ({ page }) => {
    await page.goto('/');

    // Check for main heading
    await expect(page.locator('h1')).toContainText('Space Blitz');

    // Check for description
    await expect(page.locator('p')).toContainText('modern web-based strategy game');

    // Check for counter button
    const button = page.locator('button');
    await expect(button).toBeVisible();
    await expect(button).toContainText('count is 0');
  });

  test('should increment counter when button is clicked', async ({ page }) => {
    await page.goto('/');

    const button = page.locator('button');

    // Initial state
    await expect(button).toContainText('count is 0');

    // Click and verify
    await button.click();
    await expect(button).toContainText('count is 1');

    // Click again
    await button.click();
    await expect(button).toContainText('count is 2');
  });
});

test.describe('Game Navigation', () => {
  test('should handle 404 for unknown routes', async ({ page }) => {
    const response = await page.goto('/unknown-route');
    expect(response?.status()).toBe(404);
  });
});