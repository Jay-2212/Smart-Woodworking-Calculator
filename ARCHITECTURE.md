# Architecture

## Overview

Smart Woodworking Calculator is a static, single-page JavaScript application. `index.html` loads a project-local lightweight renderer, vendored official Three.js r160, a locally adapted OrbitControls global wrapper, and the application scripts in dependency order. It is not a React application and does not use a custom Three.js engine.

The application keeps quote state in `js/app.js`. Pure CFT and crate helpers live in `js/calculations.js`; UI components, validation, and the 3D scene consume that state. There is no API, database, authentication, save/load, or export pipeline.

## Runtime load order

`index.html` loads these scripts in order:

1. `libs/react-simple.js` — project-local lightweight renderer used by the application.
2. `libs/three.min.js` — vendored official Three.js r160 distribution.
3. `libs/OrbitControlsGlobal.js` — locally adapted OrbitControls wrapper that attaches to the global `THREE` object.
4. `js/constants.js` — constants, icons, and shared validation helpers.
5. `js/calculations.js` — CFT, purchasing-length, size, and crate helpers.
6. `js/three-scene.js` — Three.js scene, controls, lifecycle, resize, and reset support.
7. `js/components.js` — reusable form and display components.
8. `js/app.js` — quote state, aggregation, validation, and application render.

Later files use globals established by earlier files, so changing this order can break page startup.

## Quote flow

```text
Internal dimensions and options
            |
            v
js/app.js adaptive recalculation
            |
            +--> main panel rows and support rows
            |             |
            |             v
            |       js/calculations.js line-item CFT
            |
            +--> js/three-scene.js structural preview
            |
            v
Board CFT + support/runner CFT + extras = final CFT and cost
```

`calculateLineCFT()` uses the purchased length, wood width, thickness, and quantity. Purchased length comes from `getPurchasedFeet()`, which preserves the business rule of rounding each piece up to the next half foot.

For an ordinary Simple box, `Top & Bottom` is one visible row representing two boards. `js/app.js` includes that combined row once in the board total; it does not add the matching hidden `bottom` state a second time. Supports and runners are aggregated separately and then included in the final total. Crate logic and crate-gap mathematics remain on their existing path.

Changing internal length, width, or height triggers the adaptive quote calculation. That intentionally replaces manually edited panel and support dimensions/quantities with values for the newly entered main dimensions.

## 3D preview boundary

`js/three-scene.js` uses Three.js and OrbitControls to present a structural preview. It rebuilds safely as quote state changes, keeps one canvas attached, observes viewport changes, and exposes the reset action used by the UI.

- Simple and Bottom configurations can show their structural panels and selected support dimensions.
- Crate previews are structural only; slats and gaps are not modelled.
- Extra supports and non-standard panel quantities still affect the calculation but are not placed in the assembled preview.

The scene helps explain a quote; it is not a fabrication drawing or a substitute for shop verification.

## Tests and deployment

Customer pages load only the runtime scripts above. They do not load or run `js/tests.js` or `js/tests-comprehensive.js`; those legacy files are retained as historical source, not production tests.

The maintained browser suite is `tests/e2e/calculator.spec.js`, run with Playwright:

```bash
npm ci
npx playwright install chromium
npm test
```

`playwright.config.js` starts a local Python static server for the suite. GitHub Actions runs `npm ci`, installs Chromium with dependencies, and runs `npm test` using Node 22 on pushes and pull requests.

The deployed static site is GitHub Pages at [https://jay-2212.github.io/Smart-Woodworking-Calculator/](https://jay-2212.github.io/Smart-Woodworking-Calculator/). CI is not a Pages deployment gate. Verify the Pages build for the intended `main` commit and inspect the live desktop and phone flows before declaring a release complete.

## Maintaining changes safely

- Keep calculation changes in `js/calculations.js` and the matching state/aggregation changes in `js/app.js` aligned.
- Add or update Playwright coverage for any changed quote rule, validation behaviour, or preview boundary.
- Do not reintroduce legacy test scripts into `index.html`.
- Update [README.md](README.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) whenever the public workflow or vendored libraries change.
