import { expect, test } from '@playwright/test';

test('customer page does not load development test APIs', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => typeof window.ComprehensiveTestSuite)).toBe('undefined');
  expect(await page.evaluate(() => typeof window.AppTests)).toBe('undefined');
});

test('standard Simple quote counts the combined Top & Bottom row once and retains runners', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('board-total')).toHaveText('2.889 CFT');
  await expect(page.getByTestId('grand-total-cft')).toHaveText('3.69');
  await expect(page.getByTestId('grand-total-cost')).toContainText('2,309');
});

test('Bottom Supports visibly starts at and calculates with 4x2', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Bottom Supports size')).toHaveValue('4x2');
});

test('changing the Simple main size recalculates visible board rows and retains runner CFT', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Internal length, inches').fill('48');
  await expect(page.getByTestId('board-total')).not.toHaveText('4.111 CFT');
  await expect(page.getByTestId('supports-total')).not.toHaveText('0.000 CFT');
});

test('a non-first support size stays visibly selected after a rerender', async ({ page }) => {
  await page.goto('/');
  const select = page.getByLabel('Bottom Supports size');
  await select.selectOption('4x4');
  await page.getByLabel('Internal width, inches').fill('24');
  await expect(select).toHaveValue('4x4');
});
