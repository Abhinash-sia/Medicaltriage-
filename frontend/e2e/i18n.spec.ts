import { test, expect } from '@playwright/test';

test.describe('Phase 23 — UI Internationalization & Locale Persistence', () => {
  test('should switch UI language between English, Hindi, and Odia and persist selection', async ({ page }) => {
    // 1. Visit the Login Page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 2. Verify initial English text and selector
    const languageSelector = page.locator('#language-selector').first();
    await expect(languageSelector).toBeVisible();
    await expect(page.getByText('Access Workspace')).toBeVisible();

    // 3. Switch language to Hindi ('hi')
    await languageSelector.selectOption('hi');

    // Verify Hindi static UI string renders
    await expect(page.getByText('कार्यक्षेत्र पहुंच')).toBeVisible();

    // 4. Switch language to Odia ('or')
    await languageSelector.selectOption('or');

    // Verify Odia static UI string renders
    await expect(page.getByText('କାର୍ଯ୍ୟକ୍ଷେତ୍ର ପ୍ରବେଶ')).toBeVisible();

    // 5. Reload page to verify locale cookie / localStorage persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Confirm Odia selection persists after reload
    await expect(languageSelector).toHaveValue('or');
    await expect(page.getByText('କାର୍ଯ୍ୟକ୍ଷେତ୍ର ପ୍ରବେଶ')).toBeVisible();

    // 6. Switch back to English ('en')
    await languageSelector.selectOption('en');
    await expect(page.getByText('Access Workspace')).toBeVisible();
  });
});
