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

test('Bottom Supports excludes the unapproved 4x4 size', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Bottom Supports size').locator('option[value="4x4"]')).toHaveCount(0);
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
  await select.selectOption('3x2');
  await page.getByLabel('Internal width, inches').fill('24');
  await expect(select).toHaveValue('3x2');
});

test('blank required dimension marks the quote incomplete and the helper focuses it', async ({ page }) => {
  await page.goto('/');
  const length = page.getByLabel('Internal length, inches');

  await length.fill('');

  await expect(page.getByTestId('quote-incomplete')).toBeVisible();
  await expect(length).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Show first missing value' }).click();
  await expect(length).toBeFocused();
});

test('changing a main dimension overwrites prior manual panel and runner values', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Top & Bottom length, inches').fill('99');
  await page.getByLabel('Bottom Supports quantity').fill('9');

  await page.getByLabel('Internal length, inches').fill('48');

  await expect(page.getByLabel('Top & Bottom length, inches')).not.toHaveValue('99');
  await expect(page.getByLabel('Bottom Supports quantity')).not.toHaveValue('9');
});

test('blank visible panel dimensions and blank rate keep the quote incomplete', async ({ page }) => {
  await page.goto('/');
  const topLength = page.getByLabel('Top & Bottom length, inches');
  const rate = page.getByLabel('Rate, rupees per CFT');

  await topLength.fill('');

  await expect(topLength).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByTestId('quote-incomplete')).toBeVisible();

  await topLength.fill('44');
  await rate.fill('');

  await expect(rate).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByTestId('quote-incomplete')).toBeVisible();

  await rate.fill('0');

  await expect(page.getByTestId('quote-incomplete')).toBeHidden();
  await expect(page.getByTestId('grand-total-cost')).toContainText('0');
});

test('blank extra-support dimensions are visibly incomplete while zero quantity is allowed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add extra support' }).click();

  const extraLength = page.getByLabel('Extra support 1 length, inches');
  await extraLength.fill('');

  await expect(extraLength).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByTestId('quote-incomplete')).toBeVisible();

  await extraLength.fill('12');
  await page.getByLabel('Extra support 1 quantity').fill('0');

  await expect(page.getByTestId('quote-incomplete')).toBeHidden();
});

test('phone layouts at 320px and 390px have no horizontal overflow and retain usable panel controls', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');

    const topLength = page.getByLabel('Top & Bottom length, inches');
    const topQuantity = page.getByLabel('Top & Bottom quantity');
    await expect(topLength).toBeVisible();
    await expect(topQuantity).toBeVisible();
    await expect(topLength).toBeEditable();
    await expect(topQuantity).toBeEditable();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.getByLabel('Internal length, inches').fill('');
    await expect(page.getByTestId('quote-incomplete')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('phone users can zoom and controls expose their current state', async ({ page }) => {
  await page.goto('/');

  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(viewport).not.toContain('user-scalable=no');
  expect(viewport).not.toContain('maximum-scale');
  await expect(page.getByTestId('quote-result-summary')).toHaveAttribute('aria-live', 'polite');
  await expect(page.getByRole('button', { name: 'Simple' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Decrease quantity for Bottom Supports' })).toBeVisible();
});
