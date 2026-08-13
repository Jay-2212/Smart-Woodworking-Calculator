import { expect, test } from '@playwright/test';

test('customer page does not load development test APIs', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => typeof window.ComprehensiveTestSuite)).toBe('undefined');
  expect(await page.evaluate(() => typeof window.AppTests)).toBe('undefined');
});
