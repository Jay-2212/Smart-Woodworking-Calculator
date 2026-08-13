# Smart Woodworking Calculator

The Smart Woodworking Calculator helps Ambica Wooden Works prepare material estimates for Simple, Bottom, and Crate boxes. Enter the internal dimensions, review the calculated boards and supports, set the CFT rate, and use the resulting total as the starting point for a customer quotation.

The live calculator is available at [https://jay-2212.github.io/Smart-Woodworking-Calculator/](https://jay-2212.github.io/Smart-Woodworking-Calculator/).

## What it does

- Calculates boards, runners, supports, CFT, and cost for Simple, Bottom, and Crate box configurations.
- Shows a responsive structural 3D preview that can be rotated, zoomed, and reset.
- Lets the user adjust panel, support, runner, and extra-support values before using a quote.
- Marks a quote incomplete when required visible values are blank or invalid, and provides a shortcut to the first missing value.

This is a static browser application. It has no server, account system, saved jobs, export feature, inventory optimisation, or fabrication-drawing output.

## Protected quotation rules

These rules are deliberate business logic. Change them only with an agreed calculation review and updated browser coverage.

- Every individual purchase length is rounded up to the next half foot; this purchasing rule has not changed.
- In an ordinary **Simple** box, `Top & Bottom` represents two boards in one displayed row and is counted once in the board total.
- Runners and supports are separate materials and are included in the final total.
- Crate calculations, including the existing crate-gap logic, were not changed in this hardening pass.
- Editing the main internal length, width, or height starts a new adaptive quote. It recalculates the current panel and support values and overwrites manual panel/support adjustments.

## Using the calculator

1. Enter internal length, width, and height in inches.
2. Select Simple, Bottom, or Crate; choose the crate construction where relevant.
3. Check the calculated board and support rows. Adjust them only when the job needs a deliberate override.
4. Enter the rate per CFT and confirm the quote is ready before sharing a price.
5. Treat the 3D view as a structural aid, not a cutting plan.

The preview supports Simple and Bottom structures, follows the selected support cross-sections, resizes with the viewport, and has a reset button. For crates it shows the calculated structure only, not individual slats or gaps. Extra supports and non-standard panel quantities remain included in the calculation but cannot be placed in the assembled preview.

## Local development

The customer page needs only a static web server. For example:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open [http://127.0.0.1:4173/](http://127.0.0.1:4173/).

The application is built from ordinary browser scripts; there is no application build step and no React dependency. It uses the project’s lightweight renderer plus vendored Three.js r160 and a locally adapted OrbitControls global wrapper.

## Testing

Production pages do **not** load or run the legacy `js/tests.js` and `js/tests-comprehensive.js` browser scripts. Those source files are retained for historical reference only.

The supported automated browser suite is Playwright:

```bash
npm ci
npx playwright install chromium
npm test
node --check js/app.js
node --check js/components.js
node --check js/three-scene.js
git diff --check
```

`npm test` starts a local static server through Playwright and checks the customer journey in Chromium. GitHub Actions runs the same browser suite on Node 22 for pushes and pull requests. This is not a claim of testing every external browser or device.

## Deployment

GitHub Pages serves the `main` branch at [https://jay-2212.github.io/Smart-Woodworking-Calculator/](https://jay-2212.github.io/Smart-Woodworking-Calculator/) over HTTPS. Before calling a change live, check the Pages build status for the intended commit and test the live page at both desktop and phone widths. The CI browser check and the Pages publication are separate checks; this repository does not document a gated Pages deployment.

## Project layout

```text
index.html                  Static entry point and ordered script loading
styles/main.css             Responsive application styles
libs/react-simple.js        Project lightweight renderer
libs/three.min.js           Vendored official Three.js r160 distribution
libs/OrbitControlsGlobal.js Locally adapted Three.js OrbitControls global wrapper
js/constants.js             Shared constants, icons, and validation helpers
js/calculations.js          CFT and crate calculation functions
js/three-scene.js           Three.js structural preview lifecycle and rendering
js/components.js            Reusable input and display components
js/app.js                   Quote state, calculation aggregation, and UI assembly
tests/e2e/                  Playwright browser tests
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the module flow and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for vendor provenance.

## License

This repository is licensed under the [MIT License](LICENSE). Third-party notices are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
