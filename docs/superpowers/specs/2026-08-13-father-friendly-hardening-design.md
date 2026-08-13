# Father-Friendly Calculator Hardening Design

## Goal

Make the existing calculator reliable and easy to use on a phone for Ambica Wooden Works without expanding its business model. Correct confirmed quote/display defects, improve the existing 3D preview, improve mobile/accessibility behaviour, and add repeatable browser tests and CI.

## Chosen approach

Keep the current zero-build static application and its existing calculator rules. Apply a focused hardening pass instead of migrating to React or adding saving, exporting, stock optimisation, or new crate rules.

Alternative approaches considered:

1. A full React/Vite rewrite would improve lifecycle management, but would introduce unnecessary business risk for a tool used for live quotations.
2. A UI-only polish pass would leave the quote calculation/display mismatch and 3D lifecycle defects in place.
3. The chosen approach fixes the confirmed defects in the current structure, adds regression coverage, and defers a framework migration.

## Business rules that must remain unchanged

- Purchase length rounds each piece up to the next half-foot. This is intentional purchasing logic.
- Crate calculation rules and crate-gap mathematics are out of scope for this pass.
- In a standard Simple box, the displayed `Top & Bottom` row represents two boards and is counted once in the board total.
- Runners and supports are separate materials and remain included in the final total.
- A change to the main internal Length, Width, or Height starts a new adaptive quote: it recalculates and overwrites prior manual panel/support dimensions and quantities exactly as the existing calculator does. A manually chosen support size continues to follow the existing state behaviour.

## Calculation and display safety

- Repair the custom select renderer so the visible selected wood size is always the same size used in CFT calculations.
- Correct only `boxType === 'simple'` board aggregation. Preserve hidden bottom dimensions for the 3D assembled model and leave both crate paths unchanged.
- Treat blank, negative, or non-positive required dimensions as incomplete instead of silently calculating them as zero.
- Zero remains allowed for optional quantities and for a deliberately zero rate. The UI must make a zero rate explicit rather than mistake it for a missing value.
- When a quote is incomplete, show a high-contrast error summary and a button that scrolls and focuses the first highlighted field. Do not unexpectedly move the page while the user is typing.
- Validation in this pass covers the ordinary main, panel, support-count, and extra-support controls only. Crate settings keep their present handling because crate logic is explicitly frozen.

## Older-user and mobile interaction design

- Retain the existing bold, dark, large visual language and increase clarity rather than making the design denser.
- Restore browser zoom, keep controls at least 44px where practical, use labels with units, and give buttons meaningful accessible names.
- Change narrow component rows into legible small-screen cards while retaining a compact table on wider screens.
- Use high-contrast red error borders/messages and a plain-language result summary.

## 3D preview design

- Keep Three.js and the static application architecture for this pass.
- Replace the permanent animation loop and global DOM observer with a single reusable scene controller that reattaches after the current renderer redraws the page.
- Dispose removed geometry, reuse materials, react to container resize, cap pixel ratio at 2, and provide a large Reset 3D View control.
- Make the Simple and Bottom visual model derive from the actual panel thicknesses and selected runner sizes/counts used by the calculator. Preserve the existing runner orientation convention.
- Do not invent physical placement for extras or crate slats. Clearly state when extras are counted but unplaced and when a crate view is structural only.

## Testing, CI, documentation, and release

- Customer pages must not auto-load or auto-run test scripts.
- Add Playwright browser tests for corrected Simple totals, visible support size matching calculated size, main-size recalculation, incomplete-field guidance, mobile usability, accessibility labels/zoom, and 3D resize/reset behaviour.
- Add a GitHub Actions CI workflow using Node 22 and a committed npm lockfile.
- Update README, ARCHITECTURE, and third-party provenance to describe the real runtime and the protected business rules.
- Push directly to `main` only after local verification; then verify the GitHub Pages deployment at the exact pushed SHA and test the live site.

## Deferred work

- React/Preact migration and build-system migration.
- Saved quotes, exports, print workflows, or sharing.
- Stock-length optimisation, kerf, or waste calculations.
- Any crate formula or slat-layout business decision.
