import { test, expect } from '@playwright/test';

test.describe('Space Blitz Game Lobby', () => {
  test('should load the main page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Space Blitz/);
  });

  test('should display game interface elements', async ({ page }) => {
    await page.goto('/');

    // Check for main heading in main content
    await expect(page.locator('main h1')).toContainText('Space Blitz');

    // Check for description
    await expect(page.getByText('Welcome to the modern web-based strategy game')).toBeVisible();

    // Check for navigation menu
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should navigate to games page', async ({ page }) => {
    await page.goto('/');

    // Click on Games link in navigation
    await page.locator('nav a').filter({ hasText: 'Games' }).click();

    // Should be on games page
    await expect(page).toHaveURL(/.*\/games/);
    await expect(page.locator('main h1')).toContainText('Games');
  });

  test('should navigate to tournaments page', async ({ page }) => {
    await page.goto('/');

    // Click on Tournaments link in navigation
    await page.locator('nav a').filter({ hasText: 'Tournaments' }).click();

    // Should be on tournaments page
    await expect(page).toHaveURL(/.*\/tournaments/);
    await expect(page.locator('main h1')).toContainText('Tournaments');
  });
});

test.describe('Game Navigation', () => {
  test('should navigate back to home from games page', async ({ page }) => {
    await page.goto('/games');

    // Click on Home link in navigation
    await page.locator('nav a').filter({ hasText: 'Home' }).click();

    // Should be back on home page
    await expect(page).toHaveURL(/.*\/$/);
    await expect(page.locator('main h1')).toContainText('Space Blitz');
  });
});