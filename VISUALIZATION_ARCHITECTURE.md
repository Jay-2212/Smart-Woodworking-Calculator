# WebGL Visualization Architecture

## Overview

This document describes the 3D rendering architecture for the Smart Woodworking Calculator, including coordinate conventions, depth management strategies, and runner placement mathematics.

---

## Table of Contents

1. [Coordinate System Conventions](#coordinate-system-conventions)
2. [Rendering Pipeline](#rendering-pipeline)
3. [Depth Management Strategy](#depth-management-strategy)
4. [Runner Placement Mathematics](#runner-placement-mathematics)
5. [Back-face Culling](#back-face-culling)
6. [Constants Reference](#constants-reference)
7. [Troubleshooting Guide](#troubleshooting-guide)

---

## Coordinate System Conventions

### World Space

```
        Y (up)
        │
        │
        │
        └──────── X (length/right)
       /
      /
     Z (width/forward)
```

| Axis | Direction | Box Dimension |
|------|-----------|---------------|
| X    | Right (+) / Left (-) | Length (L) |
| Y    | Up (+) / Down (-) | Height (H) |
| Z    | Forward (+) / Back (-) | Width (W) |

### Camera Space

After camera rotation transforms:
- **Higher Z** = **Closer to camera** (painted last in painter's algorithm)
- **Lower Z** = **Further from camera** (painted first)

### Box Origin

The box is centered at world origin `(0, 0, 0)` with Y offset:
- Bottom runners sit on Y=0 plane
- Bottom panel sits on top of runners at `Y = runnerHeight + panelThickness/2`

---

## Rendering Pipeline

### Architecture: Canvas 2D with Painter's Algorithm

Unlike hardware WebGL, this renderer uses Canvas 2D API with software depth sorting.

```
┌─────────────────────────────────────────────────────────────┐
│                    RENDER PIPELINE                          │
├─────────────────────────────────────────────────────────────┤
│ 1. COLLECT MESHES                                           │
│    Scene traversal → Mesh[] with geometry/material/position │
├─────────────────────────────────────────────────────────────┤
│ 2. GENERATE FACES                                           │
│    For each mesh:                                           │
│    - Transform 8 corners to camera space                    │
│    - Apply back-face culling                                │
│    - Calculate face depths                                  │
│    - Attach stable face identifiers                         │
├─────────────────────────────────────────────────────────────┤
│ 3. SORT FACES (Painter's Algorithm)                         │
│    Sort by: depth → renderOrder → meshId → faceIndex        │
│    Draw order: furthest first (lowest depth first)          │
├─────────────────────────────────────────────────────────────┤
│ 4. DRAW FACES                                               │
│    For each face: fillPath → strokePath                     │
└─────────────────────────────────────────────────────────────┘
```

### Face Sorting Cascade

```javascript
allFaces.sort((a, b) => {
    // 1. Primary: Depth with geometry-aware epsilon
    const effectiveEpsilon = (a.isThinObject || b.isThinObject)
        ? THIN_DEPTH_SORT_EPSILON   // 0.15 for thin objects
        : DEPTH_SORT_EPSILON;        // 0.6 for standard objects

    const depthDiff = a.depth - b.depth;
    if (Math.abs(depthDiff) > effectiveEpsilon) {
        return depthDiff;  // Further faces first (lower depth)
    }

    // 2. Secondary: Explicit render order
    if (a.renderOrder !== b.renderOrder) {
        return a.renderOrder - b.renderOrder;  // Lower first
    }

    // 3. Tertiary: Stable mesh grouping
    if (a.meshId !== b.meshId) {
        return a.meshId - b.meshId;  // Lower first
    }

    // 4. Quaternary: Consistent face ordering within mesh
    return a.faceIndex - b.faceIndex;
});
```

---

## Depth Management Strategy

### Problem: Z-Fighting

Z-fighting occurs when faces have nearly identical depths, causing:
- Flickering during rotation
- Random face ordering
- Missing geometry

### Solution: Multi-Layer Defense

#### Layer 1: Geometry Separation

Ensure physical distance between runner and panel surfaces exceeds `DEPTH_SORT_EPSILON`:

```
Panel Cross-Section (side view):
                                    ← RUNNER_Z_OFFSET = 2.3 →
┌────────────────┐                  ┌────────────┐
│   Side Panel   │     gap = 0.8    │   Runner   │
│   THK = 1.0    │                  │  depth = 2 │
└────────────────┘                  └────────────┘
     center                              center
    ←─── 0.5 ───→←────── 1.8 ──────→←─── 1.0 ───→
     (half THK)      (separation)    (half depth)
```

**Calculation:**
```javascript
// From three-scene.js
const RUNNER_Z_OFFSET = 2.3;  // panel_half(0.5) + runner_half(1.0) + safety(0.8)
const RUNNER_DEPTH = 2;       // Minimum depth for stable rendering

// Separation between surfaces:
// Runner near surface = RUNNER_Z_OFFSET - RUNNER_DEPTH/2 = 2.3 - 1.0 = 1.3
// Panel far surface = THK/2 = 0.5
// Gap = 1.3 - 0.5 = 0.8 > DEPTH_SORT_EPSILON (0.6) ✓
```

#### Layer 2: Adaptive Epsilon

Use tighter epsilon for thin objects to prevent false depth equivalence:

| Object Type | Epsilon | Use Case |
|-------------|---------|----------|
| Standard (any dim ≥ 2) | 0.6 | Panels, thick runners |
| Thin (min dim < 2) | 0.15 | N/A (no longer used with RUNNER_DEPTH=2) |

#### Layer 3: Stable Face Identification

Each face includes deterministic identifiers:

```javascript
{
    corners: [...],      // Screen coordinates
    depth: number,       // Weighted depth calculation
    renderOrder: number, // 0 = panels, 1 = runners
    meshId: number,      // Unique per mesh (monotonic counter)
    faceIndex: number,   // 0-5 for each face of box
    isThinObject: bool   // Affects epsilon selection
}
```

#### Layer 4: Weighted Depth Calculation

```javascript
// Use weighted depth: 70% max + 30% avg
// Biases toward "closest point" for better layering of tilted faces
const maxDepth = Math.max(...faceCorners.map(c => c.z));
const avgDepth = faceCorners.reduce((sum, c) => sum + c.z, 0) / 4;
const effectiveDepth = (maxDepth * 0.7) + (avgDepth * 0.3);
```

---

## Runner Placement Mathematics

### Side Runners

```
Side Panel (top view):

                     Box Interior
        ┌─────────────────────────────────────┐
        │                                     │
  -Z ───┤     ┌─┐                     ┌─┐     ├─── +Z
Runner  │     │R│                     │R│     │  Runner
        │     └─┘                     └─┘     │
        │                                     │
        └─────────────────────────────────────┘
                     Panel (THK=1)

Z-Position Calculation:
  zPosPanel = sideMultiplier * (sideZ_offset + RUNNER_Z_OFFSET)

Where:
  sideMultiplier = +1 or -1 (for +Z and -Z sides)
  sideZ_offset = (panelWidth / 2) ± (THK / 2)  // depends on box type
  RUNNER_Z_OFFSET = 2.3  // calculated safe offset
```

### KARA Runners (End Panels)

```
KARA Panel (side view):

        ┌───────────────────────┐
        │                       │
        │      KARA Panel       │
        │        (kThk)         │
        │                       │
  -X ───┤                       ├─── +X
        │                       │
Runner  │  ┌─┐             ┌─┐  │  Runner
        │  │ │             │ │  │
        └──┴─┴─────────────┴─┴──┘

X-Position Calculation:
  KARA_RUNNER_X_OFFSET = karaX_offset + (kThk / 2) + RUNNER_Z_OFFSET
  xPos = dirX * KARA_RUNNER_X_OFFSET

Where:
  dirX = +1 or -1 (for +X and -X ends)
  karaX_offset = panel center from box center
  kThk = KARA panel thickness (typically 1)
```

### Top Runners

```
Top Lid (bottom view):

        ┌───────────────────────────────────┐
        │         Top Lid Panel             │
        │                                   │
        │  ═══════════════════════════════  │  ← Runner
        │                                   │
        │  ═══════════════════════════════  │  ← Runner
        │                                   │
        └───────────────────────────────────┘

Y-Position Calculation:
  TOP_RUNNER_Y_OFFSET = (THK / 2) + (runnerHeight / 2) + 1.0
  trY = topY + TOP_RUNNER_Y_OFFSET

Where:
  topY = lid panel center Y position
  THK = lid thickness (1)
  runnerHeight = 3 (standard runner height)
  1.0 = safety margin for depth separation
```

---

## Back-face Culling

### Normal Transformation

Face normals are transformed through camera rotations:

```javascript
// Original normal (e.g., {0, 1, 0} for top face)
let nx = faceDef.normal.x;
let ny = faceDef.normal.y;
let nz = faceDef.normal.z;

// Rotate around Y axis (yaw)
const nx1 = nx * cosY - nz * sinY;
const nz1 = nx * sinY + nz * cosY;

// Rotate around X axis (pitch)
const nz2 = ny * sinX + nz1 * cosX;

// Face visible if nz2 > threshold
```

### Culling Thresholds

| Object Type | Threshold | Interpretation |
|-------------|-----------|----------------|
| Standard | -0.7 | Face culled if tilted > ~135° from camera |
| Thin | -0.95 | Face culled only if almost completely away |

```
                    Camera
                      │
                      ▼
    ┌─────────────────────────────────────────┐
    │                                         │
    │        VISIBLE RANGE (nz2 > -0.7)       │
    │                                         │
    │    ←─────── ~135° visible arc ─────→    │
    │                                         │
    └─────────────────────────────────────────┘
```

---

## Constants Reference

### From `libs/three-minimal.js`

| Constant | Value | Purpose |
|----------|-------|---------|
| `BACKFACE_CULL_THRESHOLD` | -0.7 | Standard face culling |
| `THIN_OBJECT_CULL_THRESHOLD` | -0.95 | Thin object culling |
| `THIN_OBJECT_DIMENSION_THRESHOLD` | 2 | Min dimension for "thin" |
| `DEPTH_SORT_EPSILON` | 0.6 | Standard depth tolerance |
| `THIN_DEPTH_SORT_EPSILON` | 0.15 | Thin object depth tolerance |
| `DEFAULT_RENDER_ORDER_VALUE` | 0 | Panels render order |
| `MAX_PITCH` | π/2 - 0.1 | Camera pitch limit |
| `MIN_PITCH` | -π/2 + 0.1 | Camera pitch limit |

### From `js/three-scene.js`

| Constant | Value | Purpose |
|----------|-------|---------|
| `THK` | 1 | Panel thickness |
| `RUNNER_Z_OFFSET` | 2.3 | Side runner offset from panel |
| `RUNNER_DEPTH` | 2 | Runner depth dimension |
| `RUNNER_RENDER_ORDER` | 1 | Runners render on top |
| `DEFAULT_RENDER_ORDER` | 0 | Panels render first |

---

## Troubleshooting Guide

### Symptom: Runner Not Visible

**Possible Causes:**
1. Runner position inside panel volume → Check Z-offset calculation
2. Back-face culling threshold too aggressive → Check normal transformation
3. Depth sorting placing runner behind panel → Check render order

**Diagnostic:**
```javascript
// Add to getMeshFaces() for debugging
console.log('Face:', faceIndex, 'nz2:', nz2, 'depth:', effectiveDepth);
```

### Symptom: Flickering During Rotation

**Possible Causes:**
1. Depth epsilon too large → Two faces flip-flopping
2. Non-deterministic sort fallback → Check meshId assignment
3. Floating-point precision in depth calculation

**Diagnostic:**
```javascript
// Add to sort callback for debugging
console.log('Sorting:', a.meshId, a.faceIndex, 'vs', b.meshId, b.faceIndex,
            'depths:', a.depth.toFixed(3), b.depth.toFixed(3));
```

### Symptom: Faces Drawn in Wrong Order

**Possible Causes:**
1. Depth calculation using wrong coordinate
2. Painter's algorithm direction inverted
3. Render order values incorrect

**Diagnostic:**
```javascript
// Log final sort order before drawing
console.log('Draw order:', allFaces.map(f =>
    `${f.meshId}-${f.faceIndex}:${f.depth.toFixed(2)}`
).join(' → '));
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Initial | Basic painter's algorithm |
| 2.0 | Current | Stable face sorting, adaptive epsilon, geometry fixes |

### v2.0 Changes Summary

1. **Stable Face Identification**
   - Added `meshId` (unique per mesh)
   - Added `faceIndex` (0-5 per face)
   - Deterministic tie-breaking in sort

2. **Geometry-Aware Depth**
   - `THIN_DEPTH_SORT_EPSILON = 0.15` for thin objects
   - Weighted depth: 70% max + 30% avg

3. **Runner Positioning**
   - `RUNNER_Z_OFFSET = 2.3` ensures separation > epsilon
   - `RUNNER_DEPTH = 2` prevents thin-object instability

4. **Documentation**
   - All changes annotated with `// PREVIOUS:` and `// IMPROVED:`
   - Constants documented with rationale
