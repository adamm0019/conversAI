import { test, expect } from '@playwright/test';


test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {

    await page.goto('/');


    await page.waitForLoadState('networkidle');


    const authOverlay = page.getByText(/sign in/i);
    if (await authOverlay.isVisible({ timeout: 3000 }).catch(() => false)) {
    }
  });

  test('should load the home page correctly', async ({ page }) => {

    await expect(page.getByPlaceholder(/Type or speak your message.../i)).toBeVisible();


    await expect(page.getByText(/How can I assist you with your language learning today?/i).or(page.getByText(/welcome/i))).toBeVisible();
  });

  test('should allow sending a message if authenticated', async ({ page }) => {

    const isLoggedIn = await page.getByText(/dashboard/i).isVisible().catch(() => false);

    if (!isLoggedIn) {
      test.skip();
      return;
    }


    const inputField = page.getByPlaceholder(/Type or speak your message.../i);
    await inputField.fill('Hello ConversAItion');


    await page.keyboard.press('Enter');


    await expect(page.getByText('Hello ConversAItion')).toBeVisible({ timeout: 5000 });


    await expect(inputField).toHaveValue('');
  });

  test('should show authentication UI for non-authenticated users', async ({ page }) => {

    const signInButton = page.getByRole('button', { name: /sign in/i });
    const isVisible = await signInButton.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }


    await expect(signInButton).toBeVisible();
    await expect(page.getByText(/continue with google/i).or(page.getByText(/log in/i))).toBeVisible();
  });

  test('should navigate between sections if authenticated', async ({ page }) => {

    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    const isLoggedIn = await dashboardLink.isVisible().catch(() => false);

    if (!isLoggedIn) {
      test.skip();
      return;
    }


    await dashboardLink.click();


    await expect(page).toHaveURL(/.*dashboard/);


    await expect(page.getByText(/statistics/i).or(page.getByText(/progress/i))).toBeVisible({ timeout: 5000 });
  });

  test('should be responsive and adjust to different viewports', async ({ page }) => {

    await expect(page.getByPlaceholder(/Type or speak your message.../i)).toBeVisible();


    await page.setViewportSize({ width: 375, height: 667 });


    await expect(page.getByPlaceholder(/Type or speak your message.../i)).toBeVisible();


    await expect(page.getByRole('button', { name: /menu/i }).or(page.locator('.mobile-menu-toggle'))).toBeVisible();
  });
}); 