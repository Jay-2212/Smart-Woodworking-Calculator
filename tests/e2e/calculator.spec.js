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

test('Internal Size fields use concise labels with equal aligned boxes at phone and desktop widths', async ({ page }) => {
  for (const width of [320, 390, 1200]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');

    const layout = await page.locator('label[for^="internal-"]').evaluateAll(labels => labels.map(label => {
      const input = document.getElementById(label.htmlFor);
      const labelRect = label.getBoundingClientRect();
      const inputRect = input.getBoundingClientRect();
      return {
        label: label.textContent.trim(),
        labelHeight: labelRect.height,
        labelBottom: labelRect.bottom,
        inputTop: inputRect.top,
        inputWidth: inputRect.width,
        inputHeight: inputRect.height,
        inputBottom: inputRect.bottom
      };
    }));

    expect(layout.map(field => field.label)).toEqual(['Length', 'Width', 'Height']);
    expect(Math.max(...layout.map(field => field.inputWidth)) - Math.min(...layout.map(field => field.inputWidth))).toBeLessThan(1);
    expect(Math.max(...layout.map(field => field.inputHeight)) - Math.min(...layout.map(field => field.inputHeight))).toBeLessThan(1);
    expect(Math.max(...layout.map(field => field.inputTop)) - Math.min(...layout.map(field => field.inputTop))).toBeLessThan(1);
    expect(layout.every(field => field.labelHeight <= 24 && field.inputTop >= field.labelBottom && field.inputTop - field.labelBottom <= 10)).toBe(true);
    expect(layout.every(field => field.inputBottom > field.inputTop)).toBe(true);
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

test('the 3D preview resizes after phone rotation, keeps one canvas, and offers reset without errors', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => consoleErrors.push(error.message));

  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('/');

  const canvas = page.locator('#three-scene-container canvas');
  await expect(canvas).toHaveCount(1);
  const desktopWidth = await canvas.evaluate(node => node.clientWidth);
  const initialView = await page.evaluate(() => window.AppThreeScene.getSceneDebugSnapshot().view);
  await canvas.scrollIntoViewIfNeeded();
  const canvasBox = await canvas.boundingBox();
  await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + canvasBox.width / 2 + 80, canvasBox.y + canvasBox.height / 2 + 20);
  await page.mouse.up();
  await page.mouse.wheel(0, -180);
  await expect.poll(() => page.evaluate(() => window.AppThreeScene.getSceneDebugSnapshot().view.cameraPosition)).not.toEqual(initialView.cameraPosition);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await canvas.evaluate(node => node.width)).toBeGreaterThan(0);
  expect(await canvas.evaluate(node => node.clientWidth)).toBeLessThan(desktopWidth);

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('button', { name: 'Reset 3D view' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset 3D view' }).click();
  await expect.poll(() => page.evaluate(() => window.AppThreeScene.getSceneDebugSnapshot().view.distance)).toBeCloseTo(initialView.distance, 2);

  await page.getByLabel('Internal width, inches').fill('24');
  await expect(canvas).toHaveCount(1);
  expect(consoleErrors).toEqual([]);
});

test('the 3D preview uses selected support dimensions and clearly limits crate and extra previews', async ({ page }) => {
  await page.goto('/');

  const sideSupportSize = page.getByLabel('Side Supports size');
  const currentSideSize = await sideSupportSize.inputValue();
  const sideSizeOptions = await sideSupportSize.locator('option').evaluateAll(options => options.map(option => option.value));
  const changedSideSize = sideSizeOptions.find(size => size !== currentSideSize);
  expect(changedSideSize).toBeTruthy();
  await sideSupportSize.selectOption(changedSideSize);
  const [sideWidth, sideThickness] = changedSideSize.split('x').map(Number);

  await page.getByLabel('Side Supports quantity').fill('3');
  await expect.poll(() => page.evaluate(() => window.AppThreeScene.getSceneDebugSnapshot())).toMatchObject({
    supportCounts: { sides: 3 },
    supportCrossSections: { sides: { width: sideWidth, thickness: sideThickness } }
  });

  await page.getByRole('button', { name: 'Add extra support' }).click();
  await expect(page.getByText('Extra supports are included in the quote but are not placed in this 3D preview.')).toBeVisible();

  await page.getByRole('button', { name: 'Crate' }).click();
  await expect(page.getByText('Crate preview shows the calculated structure only. It does not show crate slats or gaps.')).toBeVisible();
});

test('Simple side supports are vertical, interior, face-mounted, and preserve total count across both long sides', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('/');

  const sideSupportSize = page.getByLabel('Side Supports size');
  const selectedSideSize = await sideSupportSize.inputValue();
  const [sideWidth, sideThickness] = selectedSideSize.split('x').map(Number);

  await expect.poll(() => page.evaluate(() => window.AppThreeScene.getSceneDebugSnapshot())).toMatchObject({
    supportCounts: { sides: 4 },
    supportPlacements: { sides: { axis: 'y', totalCount: 4, faceCounts: [2, 2] } }
  });
  const defaultSidePlacement = await page.evaluate(() => window.AppThreeScene.getSceneDebugSnapshot().supportPlacements.sides);
  for (const face of defaultSidePlacement.faces) {
    expect(face.positions[0].x).toBeCloseTo(-defaultSidePlacement.panel.length / 6, 5);
    expect(face.positions[1].x).toBeCloseTo(defaultSidePlacement.panel.length / 6, 5);
  }

  await page.getByLabel('Side Supports quantity').fill('5');

  await expect.poll(() => page.evaluate(() => window.AppThreeScene.getSceneDebugSnapshot())).toMatchObject({
    coordinateConvention: { length: 'x', width: 'z', height: 'y' },
    supportCounts: { sides: 5 },
    supportCrossSections: { sides: { width: sideWidth, thickness: sideThickness } },
    supportPlacements: {
      sides: {
        axis: 'y',
        totalCount: 5,
        faceCounts: [3, 2]
      }
    }
  });

  const scene = await page.evaluate(() => window.AppThreeScene.getSceneDebugSnapshot());
  const sidePlacement = scene.supportPlacements.sides;
  expect(sidePlacement.panel.length).toBeGreaterThan(0);
  expect(sidePlacement.panel.height).toBeGreaterThan(0);
  expect(sidePlacement.crossSection).toEqual({ width: sideWidth, thickness: sideThickness });
  for (const face of sidePlacement.faces) {
    expect(face.positions).toHaveLength(face.count);
    const xPositions = face.positions.map(position => position.x);
    expect(Math.abs(xPositions[0] + xPositions[xPositions.length - 1])).toBeLessThan(0.0001);
    for (const position of face.positions) {
      expect(Math.abs(position.x)).toBeLessThan(sidePlacement.panel.length / 2 - sideWidth / 2);
      expect(position.dimensions).toEqual({ x: sideWidth, y: sidePlacement.length, z: sideThickness });
      expect(position.bounds.yMin).toBeGreaterThanOrEqual(sidePlacement.panel.yMin);
      expect(position.bounds.yMax).toBeLessThanOrEqual(sidePlacement.panel.yMax);
      if (face.name === 'positive-z') {
        expect(position.bounds.zMax).toBeCloseTo(face.panelInnerFaceZ, 5);
      } else {
        expect(position.bounds.zMin).toBeCloseTo(face.panelInnerFaceZ, 5);
      }
    }
  }
});

test('Bottom side supports keep the same vertical interior placement contract and UI direction', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'bottom', exact: true }).click();
  await expect(page.getByLabel('Side Supports quantity')).toHaveValue('4');

  await expect(page.getByLabel('Side Supports direction: Horizontal')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.AppThreeScene.getSceneDebugSnapshot())).toMatchObject({
    coordinateConvention: { length: 'x', width: 'z', height: 'y' },
    supportCounts: { sides: 4 },
    supportPlacements: {
      sides: {
        axis: 'y',
        totalCount: 4,
        faceCounts: [2, 2]
      }
    }
  });

  await expect.poll(() => page.evaluate(() => {
    const placement = window.AppThreeScene.getSceneDebugSnapshot().supportPlacements.sides;
    const sidePanelHeight = Number(document.querySelector('[aria-label="Sides width, inches"]')?.value);
    const supportLengthText = document.querySelector('[aria-label="Side Supports length"]')?.textContent || '';
    return placement.panel.height === sidePanelHeight && placement.length === sidePanelHeight && supportLengthText.includes(`${sidePanelHeight}"`);
  })).toBe(true);

  const sidePlacement = await page.evaluate(() => window.AppThreeScene.getSceneDebugSnapshot()).then(snapshot => snapshot.supportPlacements.sides);
  const sidePanelHeight = sidePlacement.panel.height;
  expect(Number(await page.getByLabel('Sides width, inches').inputValue())).toBe(sidePanelHeight);
  expect(sidePlacement.length).toBe(sidePanelHeight);
  await expect(page.getByRole('group', { name: 'Side Supports length' })).toContainText(`${sidePanelHeight}"`);
  expect(sidePlacement.faces.reduce((total, face) => total + face.positions.length, 0)).toBe(4);
  for (const face of sidePlacement.faces) {
    for (const position of face.positions) {
      expect(Math.abs(position.x)).toBeLessThan(sidePlacement.panel.length / 2 - sidePlacement.crossSection.width / 2);
      expect(position.dimensions.y).toBe(sidePlacement.length);
      expect(position.bounds.yMin).toBeGreaterThanOrEqual(sidePlacement.panel.yMin);
      expect(position.bounds.yMax).toBeLessThanOrEqual(sidePlacement.panel.yMax);
    }
  }
});

test('the 3D canvas reattaches after an unrelated root render', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('/');

  const canvas = page.locator('#three-scene-container canvas');
  await expect(canvas).toHaveCount(1);

  await page.evaluate(() => window.scrollTo(0, 400));
  await expect(canvas).toHaveCount(1);

  await page.getByLabel('Rate, rupees per CFT').fill('626');
  await expect(canvas).toHaveCount(1);
});

test('the 3D preview discloses when a calculated panel quantity cannot be assembled', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Top & Bottom quantity').fill('3');

  await expect(page.getByText('The altered panel quantity is included in the calculation but cannot be placed in this assembled 3D preview.')).toBeVisible();
});
