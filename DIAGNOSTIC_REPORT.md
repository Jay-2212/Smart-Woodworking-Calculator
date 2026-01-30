# WebGL Visualization Diagnostic Report

## Executive Summary

This report documents the root cause analysis of two critical rendering bugs in the Smart Woodworking Calculator's 3D visualization module:

1. **Missing Side Runners**: Only 1 of 2 expected runners visible on side faces
2. **Z-Fighting/Flickering**: Aggressive flickering during camera rotation

Both issues stem from fundamental architectural flaws in the depth sorting algorithm and geometry positioning strategy, NOT from parameter tuning (threshold adjustments).

---

## Investigation Methodology

### Files Analyzed
| File | Purpose | Lines |
|------|---------|-------|
| `libs/three-minimal.js` | Custom WebGL renderer with depth sorting | 617 |
| `js/three-scene.js` | 3D geometry generation and placement | 586 |
| `js/constants.js` | Global constants and thresholds | 259 |

### Rendering Architecture Overview
The system uses a **Canvas 2D painter's algorithm** (NOT hardware WebGL with Z-buffer):
- Faces are collected from all meshes
- Faces are sorted by depth (furthest-first)
- Faces are drawn sequentially with later faces painting over earlier ones
- Back-face culling removes faces pointing away from camera

---

## Root Cause #1: Side Runner Visibility Failure

### Symptom
Side faces show only 1 of 2 expected dark-brown runners at certain viewing angles.

### Technical Analysis

#### Geometry Positioning (three-scene.js:431-470)
```javascript
const drawSideRunners = (sideMultiplier) => {
    const zPosPanel = sideMultiplier * (sideZ_offset + THK + 0.5);
    // Creates runners at Z = ±(sideZ_offset + 1.5)
    group.add(createBox(srLen, 3, 1, woodMatDark, 0, yPos, zPosPanel, RUNNER_RENDER_ORDER));
};
```

**Critical Dimensions:**
- Side panel center: `sideZ_offset`
- Side panel edges: `sideZ_offset ± 0.5` (THK=1)
- Runner center: `sideZ_offset + 1.5` (offset by THK + 0.5)
- Runner depth: **1 unit** (extremely thin in Z-axis)

#### The Depth Epsilon Problem (three-minimal.js:46)
```javascript
const DEPTH_SORT_EPSILON = 0.6;
```

When viewing from angles where both runners (+Z and -Z) project to similar screen depths:
1. Their face depths fall within the 0.6 epsilon
2. Sort falls back to `renderOrder` (both = 1)
3. Sort falls back to `sortIndex` (insertion order)

**Insertion Order Instability:**
```javascript
// three-minimal.js:253-256
const sortableFaces = allFaces.map((face, index) => ({
    face,
    sortIndex: index  // Not deterministic across renders!
}));
```

The insertion order depends on mesh traversal order, which can vary between renders when the scene graph changes or meshes are repositioned.

#### Face Occlusion Chain
1. Runner A (at +Z) and Runner B (at -Z) are both drawn
2. During rotation, their projected depths become nearly identical
3. Epsilon tolerance triggers fallback sorting
4. Non-deterministic sortIndex causes one runner's faces to sort incorrectly
5. One runner gets occluded by the side panel it should be drawn on top of

### Why Threshold Adjustments Failed
Previous attempts changed:
- `BACKFACE_CULL_THRESHOLD`: -0.3 → -0.7 (culling threshold)
- `THIN_OBJECT_CULL_THRESHOLD`: Added at -0.95

These address **culling** (whether a face is visible at all), NOT **sorting** (draw order when both are visible). The bug is in sorting, not culling.

---

## Root Cause #2: Z-Fighting Flickering

### Symptom
Entire cuboid exhibits aggressive flickering during camera rotation/translation.

### Technical Analysis

#### Depth Calculation (three-minimal.js:401-402)
```javascript
const avgDepth = faceCorners.reduce((sum, c) => sum + c.z, 0) / 4;
```

The average of 4 corner Z-coordinates provides face depth. For thin objects (depth=1), opposing faces have centers only 1 unit apart.

#### Floating-Point Precision During Rotation
```javascript
// Normal rotation (three-minimal.js:385-394)
const cosY = Math.cos(rotY);
const sinY = Math.sin(rotY);
const nx1 = nx * cosY - nz * sinY;
const nz1 = nx * sinY + nz * cosY;

const cosX = Math.cos(rotX);
const sinX = Math.sin(rotX);
const nz2 = ny * sinX + nz1 * cosX;
```

Multiple trigonometric operations accumulate floating-point errors. When:
- Face A depth: 10.000000001
- Face B depth: 10.000000002
- Epsilon: 0.6

Both fall within epsilon, causing sort fallback. On next frame:
- Face A depth: 10.000000003
- Face B depth: 9.999999999

Depths cross the boundary, causing sort order flip → **FLICKER**

#### Insufficient Tie-Breaking
Current tie-breaking cascade:
1. Depth (with epsilon tolerance) → Often equal for thin/nearby geometry
2. RenderOrder → Often equal (runners all use RUNNER_RENDER_ORDER=1)
3. SortIndex → **Non-deterministic across renders**

When multiple faces have equal depth AND equal renderOrder, sortIndex provides unstable ordering.

---

## Structural Defects Summary

| Defect | Location | Impact |
|--------|----------|--------|
| Non-deterministic face ordering | three-minimal.js:267 | Flickering |
| Single epsilon for all geometry | three-minimal.js:46 | Thin object instability |
| Thin runner geometry (depth=1) | three-scene.js:437,467 | Depth precision loss |
| Insufficient runner Z-offset | three-scene.js:432 | Panel/runner occlusion |
| No face ID for stable sorting | three-minimal.js:253-256 | Order instability |

---

## Recommended Architectural Fixes

### Fix 1: Stable Face Identification
Add deterministic face ID based on mesh identity and face index, not insertion order.

### Fix 2: Geometry-Aware Depth Strategy
- Increase runner Z-offset to ensure clear depth separation
- Use minimum depth of face corners (not average) for closer-to-camera face detection

### Fix 3: Enhanced Tie-Breaking
Add mesh-level grouping to ensure all faces of one object sort together relative to another object.

### Fix 4: Adaptive Epsilon
Use smaller epsilon for thin objects to prevent false depth equivalence.

---

## Test Validation Strategy

1. **Runner Count Assertion**: Verify 12 runners total (2 per face × 6 faces equivalent)
2. **Depth Separation Test**: Assert minimum depth gap between panels and runners > epsilon
3. **Rotation Stability Test**: Render 360° rotation, verify zero face order changes for stationary geometry
4. **Occlusion Correctness**: Verify runners always render on top of adjacent panels

---

## Conclusion

The rendering instabilities are **architectural**, not parametric. Surface-level threshold adjustments cannot fix:
- Non-deterministic sort fallback
- Inadequate geometry separation
- Missing stable face identification

A structural refactor of the depth sorting system and geometry positioning is required.
