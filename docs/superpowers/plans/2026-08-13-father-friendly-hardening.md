# Father-Friendly Calculator Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing calculator safe, readable, mobile-friendly, and testable without changing protected CFT or crate business rules.

**Architecture:** Keep the static global-module application. Correct the Simple-board aggregation and custom renderer at their sources, add explicit input validity state in `App`, and replace the Three.js singleton lifecycle with a persistent controller that derives geometry from the existing calculated rows and support settings. Playwright runs the actual customer page separately from production scripts.

**Tech Stack:** HTML, CSS, vanilla JavaScript, existing `react-simple.js`, vendored Three.js r160, Playwright, GitHub Actions.

## Global Constraints

- Work directly on `main`; the user explicitly authorized direct production deployment.
- Do not change half-foot purchase rounding or any crate calculation formula/logic.
- Preserve automatic full recalculation when main Length, Width, or Height changes.
- Fix Simple total aggregation only for `boxType === 'simple'`.
- Keep the product simple: no saved quotes, exports, printing, stock optimisation, or framework migration.
- Maintain high-contrast, large, bold controls suitable for an older user on a phone.
- Do not auto-run tests on the customer page.

---

### Task 1: Establish browser test infrastructure and quote regressions

**Files:**
- Create: `package.json`
- Create: `playwright.config.js`
- Create: `tests/e2e/calculator.spec.js`
- Create: `.github/workflows/ci.yml`
- Modify: `.gitignore`
- Modify: `index.html`

**Interfaces:**
- Consumes: the static site at `http://127.0.0.1:4173` served by Playwright.
- Produces: `npm test` as the browser-test contract and CI as the repeatable verification path.

- [ ] **Step 1: Write a failing browser test for the customer-page test leak**

```js
test('customer page does not load development test APIs', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => typeof window.ComprehensiveTestSuite)).toBe('undefined');
  expect(await page.evaluate(() => typeof window.AppTests)).toBe('undefined');
});
```

- [ ] **Step 2: Run the focused tests and verify they fail for the documented defects**

Run: `npm test -- --grep "customer page does not load"`

Expected: the test fails because production currently loads both test APIs.

- [ ] **Step 3: Add minimal Playwright configuration and static-server setup**

```js
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://127.0.0.1:4173' },
  webServer: { command: 'python3 -m http.server 4173 --bind 127.0.0.1', port: 4173 }
});
```

- [ ] **Step 4: Remove production auto-loading of both legacy test files**

Remove only the `js/tests.js` and `js/tests-comprehensive.js` script tags from `index.html`; retain source files for historical reference during this pass.

- [ ] **Step 5: Add CI and generated-artifact ignore rules**

```yaml
name: CI
on: [push, pull_request]
jobs:
  browser-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm test
```

- [ ] **Step 6: Run the focused test and verify it passes**

Run: `npm test -- --grep "customer page does not load"`

Expected: the customer page no longer loads legacy test APIs.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json playwright.config.js tests/e2e/calculator.spec.js .github/workflows/ci.yml .gitignore index.html
git commit -m "test: add browser quote regressions"
```

### Task 2: Correct Simple quote aggregation and controlled select rendering

**Files:**
- Modify: `js/app.js:420-423`
- Modify: `js/components.js`
- Modify: `libs/react-simple.js:99-133`
- Modify: `tests/e2e/calculator.spec.js`

**Interfaces:**
- Consumes: `mainRows`, `supps`, `boxType`, and existing CFT functions.
- Produces: a board total that reflects visible Simple rows and selectors whose visible values equal `settings.size`.

- [ ] **Step 1: Add failing quote and rerender tests**

```js
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
```

- [ ] **Step 2: Run the tests and verify old behaviour fails**

Run: `npm test -- --grep "recalculates visible|non-first support"`

Expected: at least the non-first select test fails because select value is set before options are appended.

- [ ] **Step 3: Aggregate Simple boards using only the visible combined row**

```js
const totalBoard = boxType === 'simple'
  ? getRowCFT('Top', mainRows.top) + getRowCFT('Sides', mainRows.sides) + getRowCFT('Kara', mainRows.kara)
  : getRowCFT('Top', mainRows.top) + getRowCFT('Bottom', mainRows.bottom) + getRowCFT('Sides', mainRows.sides) + getRowCFT('Kara', mainRows.kara);
```

- [ ] **Step 4: Apply controlled select values after option children are appended**

```js
let pendingSelectValue;
// defer only <select value>; set input values immediately
// append children
if (type === 'select' && pendingSelectValue !== undefined) element.value = pendingSelectValue;
```

- [ ] **Step 5: Add stable labels and test identifiers needed by real browser tests**

Add `id`/`for` pairs and `aria-label` values for main dimensions, support size selectors, totals, board total, and support total. Do not alter calculation values or crate inputs.

- [ ] **Step 6: Run all current browser tests**

Run: `npm test`

Expected: all tests pass with corrected Simple result and displayed selector state.

- [ ] **Step 7: Commit**

```bash
git add js/app.js js/components.js libs/react-simple.js tests/e2e/calculator.spec.js
git commit -m "fix: align simple totals and support selections"
```

### Task 3: Add clear validation and father-friendly mobile/accessibility behaviour

**Files:**
- Modify: `js/app.js`
- Modify: `js/components.js`
- Modify: `styles/main.css`
- Modify: `index.html`
- Modify: `tests/e2e/calculator.spec.js`

**Interfaces:**
- Consumes: raw input values and current calculator state.
- Produces: clear validity status, focusable first-error navigation, explicit zero handling, labelled controls, and mobile-friendly component presentation.

- [ ] **Step 1: Write failing tests for incomplete input and the approved recalculation contract**

```js
test('blank required dimension marks the quote incomplete and the helper focuses it', async ({ page }) => {
  await page.goto('/');
  const length = page.getByLabel('Internal length, inches');
  await length.fill('');
  await expect(page.getByTestId('quote-incomplete')).toBeVisible();
  await page.getByRole('button', { name: 'Show first missing value' }).click();
  await expect(length).toBeFocused();
});

test('changing a main dimension overwrites prior manual panel and runner values', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Top & Bottom length, inches').fill('99');
  await page.getByLabel('Internal length, inches').fill('48');
  await expect(page.getByLabel('Top & Bottom length, inches')).not.toHaveValue('99');
});
```

- [ ] **Step 2: Run the tests and verify the missing-input test fails because the old app silently returns zero**

Run: `npm test -- --grep "blank required|overwrites prior"`

Expected: the incomplete-state assertion fails before validation is implemented.

- [ ] **Step 3: Add explicit input validity state without changing allowed zero quantities**

Required main dimensions, ordinary visible panel dimensions, support counts, and extra-support physical dimensions must be finite and valid before a quote is complete. Main/panel/extra dimensions must be greater than zero; support and panel quantities and rate may be zero; blank/negative rate is incomplete. Preserve raw blank values long enough to show an error. Do not add or change validation for crate plank/gap settings in this pass.

- [ ] **Step 4: Add a high-contrast incomplete-quote summary and focus/scroll helper**

```js
const focusFirstInvalid = () => {
  const first = document.querySelector('[aria-invalid="true"]');
  first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  first?.focus({ preventScroll: true });
};
```

- [ ] **Step 5: Repair accessible labels and states**

Use semantic `label for`, `fieldset`/`legend` or native radio inputs for mode selection, `aria-pressed` for toggle buttons, accessible names for +/-/delete/reset actions, and one concise `aria-live="polite"` result summary.

- [ ] **Step 6: Repair mobile component layout and visibility**

At small widths, render calculation rows as labelled cards or a legible stacked layout, retain 44px minimum interactive targets, remove forced browser zoom disabling, allow copying result text, and increase low-contrast small text.

- [ ] **Step 7: Add/Run mobile and accessibility coverage**

```js
test('phone layout has no horizontal overflow and exposes labelled inputs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByLabel('Top & Bottom quantity')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
```

Run: `npm test`

Expected: the full browser suite passes.

- [ ] **Step 8: Commit**

```bash
git add js/app.js js/components.js styles/main.css index.html tests/e2e/calculator.spec.js
git commit -m "fix: guide incomplete quotes on mobile"
```

### Task 4: Rebuild the Three.js lifecycle and truthful Simple/Bottom preview

**Files:**
- Modify: `js/three-scene.js`
- Modify: `js/app.js`
- Modify: `styles/main.css`
- Modify: `tests/e2e/calculator.spec.js`

**Interfaces:**
- Consumes: `dims`, `boxType`, `crateType`, `mainRows`, `supps`, `runnerConfig`, and `extras`.
- Produces: a persistent, responsive Three.js canvas and `resetThreeSceneView()` for the UI.

- [ ] **Step 1: Write failing browser/model tests for resize, reset, exact selected runner geometry, and honest notices**

```js
test('the canvas resizes after phone rotation and reset view remains available', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('#three-scene-container canvas');
  const desktopWidth = await canvas.evaluate(node => node.clientWidth);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(canvas).toHaveJSProperty('width', expect.any(Number));
  expect(await canvas.evaluate(node => node.clientWidth)).toBeLessThan(desktopWidth);
  await page.getByRole('button', { name: 'Reset 3D view' }).click();
});
```

- [ ] **Step 2: Run focused 3D tests and verify old canvas sizing/reset behaviour fails**

Run: `npm test -- --grep "canvas resizes"`

Expected: the old scene remains at its initial canvas size and has no reset control.

- [ ] **Step 3: Replace global observer/forever RAF with a SceneController**

The controller owns the scene, camera, renderer, controls, reusable materials, resize observer, canvas reattachment, resource disposal, and a single scheduled render. No calculator or crate formula changes are permitted.

- [ ] **Step 4: Build Simple/Bottom primitives from actual calculated rows and support settings**

Use panel `l`, `w`, and `t`; selected support `getSizeDims(size)`; exact support count allocation across both sides/ends; and existing orientation settings. Keep an assembled structural-only crate rendering path, with a clear disclosure instead of invented slats/gaps.

- [ ] **Step 5: Add reset, fit, fallback, and truthful preview messaging**

Add ResizeObserver sizing, DPR cap 2, camera fitting, reset button, drag/zoom instruction, no panning, a WebGL unavailable message, crate structural-preview disclosure, and an extras-not-placed disclosure.

- [ ] **Step 6: Run the full browser suite and manual browser checks**

Run: `npm test`

Expected: full suite passes; repeated edits keep one canvas and the visual preview remains usable at desktop and phone widths.

- [ ] **Step 7: Commit**

```bash
git add js/three-scene.js js/app.js styles/main.css tests/e2e/calculator.spec.js
git commit -m "fix: harden responsive 3d preview"
```

### Task 5: Repair documentation, final verification, direct release, and live validation

**Files:**
- Modify: `README.md`
- Modify: `ARCHITECTURE.md`
- Modify: `THIRD_PARTY_NOTICES.md`
- Modify: `index.html`
- Modify: `docs/superpowers/specs/2026-08-13-father-friendly-hardening-design.md`
- Modify: `docs/superpowers/plans/2026-08-13-father-friendly-hardening.md`

**Interfaces:**
- Consumes: shipped behaviour and verification results.
- Produces: accurate user/developer documentation and a public `main` deployment.

- [ ] **Step 1: Add documentation assertions to the release checklist**

Verify documentation describes actual loaded vendored libraries, protected business rules, the live Pages URL, non-production test execution, current limitations, and the MIT/vendor provenance.

- [ ] **Step 2: Update docs only after final implementation behaviour is verified**

Remove stale claims about a custom minimal Three.js engine, auto-running customer tests, non-existent script paths, and conflicting licence wording. Include the Simple Top & Bottom rule, separate runner total, preserved half-foot rounding, unchanged crate logic, and the current GitHub Pages URL.

- [ ] **Step 3: Run all local verification**

Run:

```bash
npm ci
npx playwright install chromium
npm test
node --check js/app.js
node --check js/components.js
node --check js/three-scene.js
git diff --check
git status --short
```

Expected: all browser tests pass, JavaScript syntax checks pass, and no whitespace errors remain.

- [ ] **Step 4: Commit and push the complete approved hardening pass directly to main**

```bash
git add README.md ARCHITECTURE.md THIRD_PARTY_NOTICES.md docs/superpowers
git commit -m "docs: document calculator hardening"
git push origin main
```

- [ ] **Step 5: Verify the deployed SHA and live user journey**

Wait for GitHub Pages to build the pushed commit, then test `https://jay-2212.github.io/Smart-Woodworking-Calculator/` on desktop and phone widths. Confirm the corrected default Simple quote, visible `4x2`, labelled inputs, mobile layout, validation guidance, and 3D reset/resize behaviour.
