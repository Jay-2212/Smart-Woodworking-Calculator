# Architecture Documentation

## Ambica Wooden Works - Smart CFT Calculator

This document explains the modular file structure of the Smart Woodworking Calculator application. Use this as a reference when working on specific features or debugging issues.

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Load Order (Critical)](#load-order-critical)
4. [Module Dependencies](#module-dependencies)
5. [Data Flow](#data-flow)
6. [State Management](#state-management)
7. [Quick Reference: Where to Find What](#quick-reference-where-to-find-what)
8. [Adding New Features](#adding-new-features)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Smart CFT Calculator is a single-page React application that calculates wood requirements (in Cubic Feet - CFT) for wooden boxes/crates used in shipping. The codebase has been modularized for better maintainability and collaboration.

### Key Features
- 3D visualization of box construction (Three.js)
- Real-time CFT calculations
- Support for 3 box types: Simple, Bottom, and Crate
- Crate gap calculations for ventilated boxes
- Cost estimation based on CFT × rate

---

## File Structure

```
Smart-Woodworking-Calculator/
├── index.html              # Main entry point (loads all modules)
├── ARCHITECTURE.md         # This documentation file
├── styles/
│   └── main.css           # All CSS utility classes
└── js/
    ├── constants.js       # Magic numbers, icons, error boundary
    ├── calculations.js    # Pure calculation functions
    ├── three-scene.js     # 3D visualization engine
    ├── components.js      # Reusable UI components
    ├── app.js             # Main App component & state
    └── tests.js           # Test suite (runs on page load)
```

### File Sizes (Approximate)
| File | Lines | Purpose |
|------|-------|---------|
| index.html | ~60 | Entry point, script loader |
| main.css | ~650 | Tailwind-like utility classes |
| constants.js | ~250 | Constants & shared utilities |
| calculations.js | ~280 | CFT calculation logic |
| three-scene.js | ~450 | 3D box visualization |
| components.js | ~500 | React UI components |
| app.js | ~850 | Main application logic |
| tests.js | ~280 | Test suite |

---

## Load Order (Critical)

**JavaScript files MUST be loaded in this exact order:**

```html
<!-- 1. External dependencies -->
<script src="react.js"></script>
<script src="react-dom.js"></script>
<script src="three.js"></script>
<script src="OrbitControls.js"></script>

<!-- 2. Application modules (ORDER MATTERS!) -->
<script src="js/constants.js"></script>      <!-- First: No dependencies -->
<script src="js/calculations.js"></script>   <!-- Needs: constants.js -->
<script src="js/three-scene.js"></script>    <!-- Needs: calculations.js -->
<script src="js/components.js"></script>     <!-- Needs: constants.js, calculations.js -->
<script src="js/app.js"></script>            <!-- Needs: ALL above -->
<script src="js/tests.js"></script>          <!-- Needs: constants.js, calculations.js -->
```

### Why Load Order Matters
Each module attaches its exports to the `window` object. Later modules depend on these exports being available. Loading out of order will cause "undefined" errors.

---

## Module Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                        index.html                                │
│                    (Entry Point / Loader)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      js/constants.js                             │
│                                                                  │
│  EXPORTS:                                                        │
│  • HALF_FOOT_THRESHOLD (0.5001)                                 │
│  • CUBIC_INCH_TO_CFT_DIVISOR (144)                              │
│  • INCHES_PER_FOOT (12)                                         │
│  • RUNNER_RECOMMENDATIONS                                        │
│  • MIN_RUNNER_COUNT (2)                                         │
│  • isInvalidNumber()                                            │
│  • Icon, Icons (Box, Plus, Trash, Rotate)                       │
│  • ErrorBoundary                                                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ js/calculations  │ │ js/components    │ │ js/tests.js      │
│                  │ │                  │ │                  │
│ EXPORTS:         │ │ EXPORTS:         │ │ EXPORTS:         │
│ • getPurchased-  │ │ • NumberInput    │ │ • runTests()     │
│   Feet()         │ │ • CalculationRow │ │                  │
│ • calculateLine- │ │ • SupportCard    │ │ USES:            │
│   CFT()          │ │ • BoxTypeSelector│ │ • All calc       │
│ • getSizeDims()  │ │                  │ │   functions      │
│ • getMaxDim()    │ │ USES:            │ │ • Constants      │
│ • calculateCrate │ │ • Icons          │ │                  │
│   EffectiveLen() │ │ • calculateLine- │ └──────────────────┘
│ • getEffective-  │ │   CFT()          │
│   CrateDims()    │ │ • getPurchased-  │
│                  │ │   Feet()         │
│ USES:            │ │ • getSizeDims()  │
│ • isInvalidNum() │ │ • getEffective-  │
│ • Constants      │ │   CrateDims()    │
└────────┬─────────┘ └────────┬─────────┘
         │                    │
         ▼                    │
┌──────────────────┐          │
│ js/three-scene   │          │
│                  │          │
│ EXPORTS:         │          │
│ • ThreeScene     │          │
│                  │          │
│ USES:            │          │
│ • getSizeDims()  │          │
│ • THREE.js       │          │
└────────┬─────────┘          │
         │                    │
         └────────┬───────────┘
                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                          js/app.js                                │
│                                                                   │
│  EXPORTS:                                                         │
│  • App component                                                  │
│                                                                   │
│  USES (everything):                                               │
│  • RUNNER_RECOMMENDATIONS, MIN_RUNNER_COUNT                       │
│  • Icons, ErrorBoundary                                           │
│  • All calculation functions                                      │
│  • ThreeScene                                                     │
│  • NumberInput, CalculationRow, SupportCard, BoxTypeSelector     │
│                                                                   │
│  MANAGES STATE FOR:                                               │
│  • Box dimensions (dims)                                          │
│  • Box type (boxType, crateType, crateSettings)                  │
│  • Pricing (costPerCFT)                                          │
│  • Panel dimensions (mainRows)                                    │
│  • Support runners (supps)                                        │
│  • Extra supports (extras)                                        │
│  • Runner configuration (runnerConfig)                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Input → Calculation → Display

```
User Input (dims)           Auto-Calculation              Display
─────────────────     ────────────────────────     ──────────────────
                      
┌─────────────┐       ┌──────────────────────┐    ┌─────────────────┐
│ Length: 40  │──────▶│ Calculate mainRows:  │───▶│ Top: 44 × 22    │
│ Width: 20   │       │ top.l = l + 4 = 44   │    │ Bottom: 44 × 22 │
│ Height: 20  │       │ top.w = w + 2 = 22   │    │ Sides: 44 × 20  │
└─────────────┘       └──────────────────────┘    │ Kara: 20 × 20   │
                                                  └─────────────────┘
      │                        │
      │                        │
      ▼                        ▼
┌─────────────┐       ┌──────────────────────┐    ┌─────────────────┐
│ Box Type:   │──────▶│ Calculate supps:     │───▶│ Bottom: 22"     │
│ Simple      │       │ bottom.dim = baseW   │    │ Sides: 26"      │
└─────────────┘       │ sides.dim = h + add  │    │ Top: 22"        │
                      └──────────────────────┘    └─────────────────┘
      │                        │
      │                        │
      ▼                        ▼
┌─────────────┐       ┌──────────────────────┐    ┌─────────────────┐
│ Each Panel  │──────▶│ calculateLineCFT()   │───▶│ CFT per item    │
│ Dimensions  │       │ getPurchasedFeet()   │    │ Total CFT       │
└─────────────┘       └──────────────────────┘    │ Total Cost      │
                                                  └─────────────────┘
```

### CFT Calculation Formula

```
CFT = (purchasedFeet × width × thickness) / 144 × quantity

Where:
- purchasedFeet = inches / 12, rounded up to nearest 0.5 ft
- width = wood width in inches (from size like "3x1" → 3")
- thickness = wood thickness in inches (from size like "3x1" → 1")
- 144 = 12 × 12 (converts inch² to ft² since length is already in feet)
```

---

## State Management

### State Variables in js/app.js

| State Variable | Type | Purpose |
|---------------|------|---------|
| `dims` | `{l, w, h}` | Internal box dimensions (inches) |
| `boxType` | `string` | 'simple', 'bottom', or 'crate' |
| `crateType` | `string` | 'simple' or 'bottom' (for crate boxes) |
| `crateSettings` | `{plank, gap}` | Plank width and gap for crates |
| `costPerCFT` | `number` | Price per cubic foot (₹) |
| `showStickyStats` | `boolean` | Controls sticky header visibility |
| `runnerConfig` | `{bottomDir, sideDir}` | Runner orientations |
| `mainRows` | `object` | Panel dimensions (top, bottom, sides, kara) |
| `supps` | `object` | Support runner configs |
| `extras` | `array` | User-added extra supports |
| `globalRunners` | `number` | Override for runner count |

### State Update Triggers

```
dims change ─────────────────────────────┐
boxType change ──────────────────────────┤
crateType change ────────────────────────┤──▶ useEffect ──▶ Update mainRows & supps
globalRunners change ────────────────────┤
runnerConfig change ─────────────────────┤
supps.bottom.size change ────────────────┤
supps.karaHorz.size change ──────────────┘
```

---

## Quick Reference: Where to Find What

### "I need to modify..."

| Task | File(s) |
|------|---------|
| Change wood size options | `js/calculations.js` → `getSizeDims()` |
| Add new box type | `js/app.js`, `js/components.js` → `BoxTypeSelector` |
| Fix CFT calculation | `js/calculations.js` → `calculateLineCFT()` |
| Change 3D visualization | `js/three-scene.js` → `ThreeScene` |
| Update styling | `styles/main.css` |
| Modify auto-calculation | `js/app.js` → main `useEffect` |
| Change runner thresholds | `js/constants.js` → `RUNNER_RECOMMENDATIONS` |
| Update UI components | `js/components.js` |
| Fix tests | `js/tests.js` |

### "I need to understand..."

| Concept | File | Function/Section |
|---------|------|------------------|
| How CFT is calculated | `js/calculations.js` | `calculateLineCFT()` |
| How feet are rounded | `js/calculations.js` | `getPurchasedFeet()` |
| How crate gaps work | `js/calculations.js` | `calculateCrateEffectiveLength()` |
| How 3D model is built | `js/three-scene.js` | Steps 1-8 comments |
| How dimensions auto-update | `js/app.js` | Main `useEffect` |
| What constants mean | `js/constants.js` | JSDoc comments |

---

## Adding New Features

### Adding a New Box Type

1. **Add type option** in `js/components.js`:
   ```javascript
   // In BoxTypeSelector, add to the button list
   ['simple', 'bottom', 'crate', 'newType'].map(...)
   ```

2. **Add calculation logic** in `js/app.js`:
   ```javascript
   // In the main useEffect, add a new branch
   if (boxType === 'newType') {
       // Calculate mainRows and supps
   }
   ```

3. **Update 3D visualization** in `js/three-scene.js`:
   ```javascript
   // Add rendering logic for the new type
   if (boxType === 'newType') {
       // Create 3D elements
   }
   ```

### Adding a New Calculation

1. **Add function** in `js/calculations.js`:
   ```javascript
   const myNewCalculation = (params) => {
       // Calculation logic
   };
   
   // Export it
   window.AppCalculations.myNewCalculation = myNewCalculation;
   ```

2. **Add tests** in `js/tests.js`:
   ```javascript
   // TEST X: My New Calculation
   const result = myNewCalculation(testParams);
   console.log(result === expected ? "✅ Pass" : "❌ Fail");
   ```

### Adding a New UI Component

1. **Create component** in `js/components.js`:
   ```javascript
   const MyNewComponent = ({ props }) => {
       return React.createElement('div', {...});
   };
   
   // Export it
   window.AppComponents.MyNewComponent = MyNewComponent;
   ```

2. **Use in App** in `js/app.js`:
   ```javascript
   const { MyNewComponent } = window.AppComponents;
   // Use in render
   ```

---

## Troubleshooting

### Common Issues

| Problem | Likely Cause | Solution |
|---------|--------------|----------|
| "undefined is not a function" | Wrong load order | Check script tags in index.html |
| 3D scene not rendering | Three.js not loaded | Ensure CDN scripts are accessible |
| Calculations returning 0 | Invalid input | Check `isInvalidNumber()` validation |
| Tests failing | Code change broke logic | Review test output in console |
| Styles not applying | CSS class missing | Check `styles/main.css` |

### Debug Checklist

1. **Open browser console (F12)** - Look for red errors
2. **Check test output** - Tests run automatically on load
3. **Verify load order** - All scripts should load in sequence
4. **Check network tab** - Ensure all files load successfully
5. **Add console.log** - Trace data flow through functions

### Re-running Tests

Open browser console and type:
```javascript
window.AppTests.runTests();
```

---

## Original File Reference

The original `index.html` contained everything in one file. Here's where each section went:

| Original Section | New Location |
|-----------------|--------------|
| Lines 1-983 (CSS) | `styles/main.css` |
| Lines 1017-1095 (Constants & Icons) | `js/constants.js` |
| Lines 1097-1252 (Calculation Functions) | `js/calculations.js` |
| Lines 1254-1640 (3D Engine) | `js/three-scene.js` |
| Lines 1642-1869 (UI Components) | `js/components.js` |
| Lines 1871-2385 (Main App) | `js/app.js` |
| Lines 2387-2525 (Tests) | `js/tests.js` |

---

## Contact & Updates

- Last Updated: 2024
- For questions about the codebase structure, refer to this document
- When making changes, update this documentation if the architecture changes
