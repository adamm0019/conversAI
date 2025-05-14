import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page and allow login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    await expect(page).not.toHaveURL(/login/);
  });

  test('should protect a private route', async ({ page }) => {
    await page.goto('/protected');

    await expect(page).toHaveURL(/login/);
  });
}); 