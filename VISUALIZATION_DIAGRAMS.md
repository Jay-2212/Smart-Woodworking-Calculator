# Visual Diagrams - 3D Positioning Issues

This document uses ASCII art and diagrams to illustrate the visualization bugs.

## Bug #1: Kara Frame Position Error

### Top View (Looking down at X-Z plane)

#### CURRENT (WRONG) - Frame Hidden Inside Panel

```
                Front of Box (Positive X)
                         ↓
    
         ┌──────────────────────────────┐
         │                              │
         │     Bottom Panel             │
         │     (Main Box Floor)         │
         │                              │
         └──────────────────────────────┘
                         │
            ╔════════════╪════════════╗
            ║            │            ║  ← Kara Panel (End Wall)
            ║            │            ║     Position: karaX_offset
            ║   ┃┃┃←─────┤            ║
            ║   ┃┃┃      │            ║     ┃┃┃ = Frame (WRONG position)
            ╚════════════╪════════════╝         Hidden INSIDE panel
                         │
                         │
                    Panel Center

Position Calculation (WRONG):
xPos = karaX_offset - kThk - 1.5
     = 22 - 1 - 1.5
     = 19.5

Frame at X=19.5, but panel center at X=22
→ Frame is BEHIND/INSIDE the box structure!
```

#### FIXED (CORRECT) - Frame Visible Outside Panel

```
                Front of Box (Positive X)
                         ↓
    
         ┌──────────────────────────────┐
         │                              │
         │     Bottom Panel             │
         │     (Main Box Floor)         │
         │                              │
         └──────────────────────────────┘
                         │
            ╔════════════╪════════════╗
            ║            │            ║  ← Kara Panel (End Wall)
            ║            │            ║     Position: karaX_offset
            ║            │────→┃┃┃    ║
            ║            │      ┃┃┃   ║     ┃┃┃ = Frame (CORRECT position)
            ╚════════════╪════════════╝         Visible OUTSIDE panel
                         │      ↑
                         │      Frame clearly visible
                    Panel Center

Position Calculation (CORRECT):
xPos = karaX_offset + kThk + 1.5
     = 22 + 1 + 1.5
     = 24.5

Frame at X=24.5, panel center at X=22
→ Frame is OUTSIDE the box, clearly visible!
```

### Side View (Looking at Y-Z plane)

Shows the square frame structure on Kara panel:

```
        Top of Box
            ↑
            │
    ════════╪════════  ← Top horizontal beam
    ║       │       ║
    ║       │       ║  Left & Right vertical beams
    ║       │       ║
    ║       │       ║
    ════════╪════════  ← Bottom horizontal beam
            │
         Floor Level

Legend:
════ Horizontal beams (run along width of box)
║   Vertical beams (run along height of box)
```

## Bug #2: Top Runner Position Issue

### Side View (Looking at X-Y plane) - Simple Type

#### CURRENT (WRONG) - Runner Too Close to Panel

```
            Top Lid Panel
    ┌──────────────────────────┐  ← Y = 25.5 (top surface)
    │                          │
    ├──────────────────────────┤  ← Y = 25 (center)
    │                          │
    └──────────────────────────┘  ← Y = 24.5 (bottom surface)
           ║║ ← Runner             Y = 23.75 (center)
           ║║    Too close!        Y = 23 to 24.5 (span)
           ╨╨

Problem: Runner touches bottom of panel at Y=24.5
         Very thin (1.5 units) makes it nearly invisible
         May be in shadow of panel
```

#### FIXED (CORRECT) - Runner Clearly Separated

```
            Top Lid Panel
    ┌──────────────────────────┐  ← Y = 25.5 (top surface)
    │                          │
    ├──────────────────────────┤  ← Y = 25 (center)
    │                          │
    └──────────────────────────┘  ← Y = 24.5 (bottom surface)
    
              ← 0.5 gap
    
        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓          ← Y = 22 (center)
        ▓▓▓ Runner ▓▓▓             Thicker (3 units)
        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓             Y = 20.5 to 23.5

Benefits: 
- Clear gap (0.5 units) from panel
- Thicker (3 units) more visible
- Distinct from panel structure
```

### Top View (Looking down at X-Z plane) - Runner Placement

#### Bottom Type Configuration

```
         Width of Box (Z-axis)
    ←────────────────────────────→
    
    ┌──────────────────────────────┐
    │                              │
    │  ══════════════════════════  │ ← Runner 1 (at z1)
    │                              │
    │                              │
    │                              │
    │  ══════════════════════════  │ ← Runner 2 (at z2)
    │                              │
    └──────────────────────────────┘
    
    Runners run length-wise (along X)
    Positioned at Z coordinates from runnerPositions[]
```

#### Simple Type Configuration

```
         Length of Box (X-axis)
    ←────────────────────────────→
    
    ┌──────────────────────────────┐
    │     ║║         ║║           │
    │     ║║         ║║           │
    │     ║║         ║║           │
    │     ║║         ║║           │
    │     ║║         ║║           │
    │     ║║         ║║           │
    └─────╨╨─────────╨╨───────────┘
         Runner 1   Runner 2
         (at x1)    (at x2)
    
    Runners run width-wise (along Z)
    Positioned at X coordinates from runnerPositions[]
```

## Component Size Comparison

Visual representation of relative sizes:

```
Component Thickness/Height (in 3D units):

Bottom Panel:        ▓ (1 unit - THK)
Top Panel:           ▓ (1 unit - THK)
Side Panel:          ▓ (1 unit - THK)
Kara Panel:          ▓ (1 unit - THK)

Bottom Runners:      ▓▓▓▓ (4 units - variable by size)
Side Runners:        ▓▓▓ (3 units)

Kara Frame (BEFORE): ▓▓ (2.5 units) ← TOO SMALL!
Kara Frame (AFTER):  ▓▓▓▓ (4 units) ← VISIBLE

Top Runners (BEFORE): ▓ (1.5 units) ← TOO SMALL!
Top Runners (AFTER):  ▓▓▓ (3 units) ← VISIBLE
```

## Material Color Palette

Visual representation of wood materials:

```
┌────────────────────┬──────────┬─────────────┐
│ Component          │ Color    │ Visual      │
├────────────────────┼──────────┼─────────────┤
│ Main Panels        │ #fcd34d  │ ████ Light  │
│ (Top/Bottom)       │          │      Yellow │
├────────────────────┼──────────┼─────────────┤
│ Side/Kara Panels   │ #f59e0b  │ ████ Orange │
│                    │          │      Medium │
├────────────────────┼──────────┼─────────────┤
│ Bottom Runners     │ #78350f  │ ████ Brown  │
│ Side Runners       │          │      Dark   │
├────────────────────┼──────────┼─────────────┤
│ Kara Frame (NEW)   │ #92400e  │ ████ Brown  │
│                    │          │      Darker │
├────────────────────┼──────────┼─────────────┤
│ Top Runners (NEW)  │ #a16207  │ ████ Amber  │
│                    │          │      Medium │
└────────────────────┴──────────┴─────────────┘

The color differentiation helps users distinguish:
- Main structure (light)
- Walls (medium)
- Support runners (dark shades)
```

## 3D Box Assembly View

Shows how all components fit together:

```
                    Top Lid Panel
                    ┌─────────────────┐
    Top Runners →   ═════════════════
                    │                 │
                    │   ┌─────────┐   │
    Side Panel →    │   │         │   │ ← Side Panel
                    │   │  Cargo  │   │
    Side Runners →  ║   │  Space  │   ║
                    │   │         │   │
    Kara Frame →   ╔╗   └─────────┘  ╔╗ ← Kara Frame
    Kara Panel →   ║║                ║║ ← Kara Panel
                   ╚╝                ╚╝
                    ════════════════════
                    Bottom Panel
                    ║       ║       ║
    Bottom Runners → (spaced evenly)

Legend:
═══ Horizontal runners
║   Vertical runners/posts
╔╗  Frame structure
```

## Position Coordinate Example

For a box with dimensions L=40, W=20, H=20:

```
Coordinate System (Center at origin):

Y (height)
↑
│         Z (width)
│        ↗
│       /
│      /
│     /
│    /
│   /
│  /
│ /
│/─────────────→ X (length)
0

Component Positions:
──────────────────────────────────────────
Bottom Panel:
  Center: (0, 2, 0)  // baseY = 2 for 4x2 runner
  Extends: X[-22, +22], Z[-11, +11]

Kara Panel (Right):
  Center: (22.5, 12, 0)  // karaX_offset
  Extends: Y[2, 22], Z[-10, +10]

Kara Frame (Right) - WRONG:
  Center: (19.5, ?, 0)  // karaX_offset - kThk - 1.5
  Status: INSIDE the box! ❌

Kara Frame (Right) - FIXED:
  Center: (24.5, ?, 0)  // karaX_offset + kThk + 1.5
  Status: OUTSIDE, visible! ✅

Top Panel:
  Center: (0, 23, 0)  // baseY + sH + THK/2
  Extends: X[-22, +22], Z[-11, +11]

Top Runners (WRONG):
  Center Y: 22.25  // Too close to panel
  Height: 1.5      // Too thin ❌

Top Runners (FIXED):
  Center Y: 21.5   // Clear gap from panel
  Height: 3        // Clearly visible ✅
```

## Dependency Graph

Shows the problematic dependency for top runners:

### Before Fix (WRONG)

```
┌─────────────────────┐
│ Bottom Runners      │
│ (STEP 1)            │
└──────────┬──────────┘
           │ populates
           ↓
    runnerPositions[]
           │
           │ depends on
           ↓
┌─────────────────────┐
│ Top Runners         │
│ (STEP 8)            │◄─── ❌ Hidden dependency!
└─────────────────────┘     If bottom count = 0,
                            top won't render!
```

### After Fix (CORRECT)

```
┌─────────────────────┐
│ Bottom Runners      │
│ (STEP 1)            │
└──────────┬──────────┘
           │ populates
           ↓
    runnerPositions[]
           │
           │ uses if available
           ↓
┌─────────────────────┐     ┌──────────────────┐
│ Top Runners         │◄────│ supps.top.count  │
│ (STEP 8)            │     └──────────────────┘
└─────────────────────┘          ↑
     ↑                           │
     │                           │
     │ fallback creates          │
     │ positions if needed       │
     │                           │
     └───────────────────────────┘
     ✅ Independent configuration!
```

## Runner Direction Configurations

Visual representation of different configurations:

### Simple Type - Width-wise Bottom Runners

```
Top View:

    ┌──────────────────────┐
    │   ║         ║        │
    │   ║         ║        │ ← Bottom runners run
    │   ║         ║        │   along Z-axis (width)
    │   ║         ║        │
    └───╨─────────╨────────┘
       x1        x2

Positioned at X coordinates
Top runners ALSO at same X positions
```

### Simple Type - Horizontal Bottom Runners

```
Top View:

    ┌──────────────────────┐
    │  ══════════════════  │ ← z1
    │                      │
    │                      │
    │  ══════════════════  │ ← z2
    └──────────────────────┘

Positioned at Z coordinates
Top runners at calculated X positions
```

### Bottom Type - Always Horizontal

```
Top View:

    ┌──────────────────────┐
    │  ══════════════════  │ ← Runner spans length
    │         │            │   at Z position z1
    │  ══════════════════  │ ← Runner at z2
    │         │            │
    └─────────┼────────────┘
             │
        Kara posts align
        at these Z positions
```

## Visual Testing Checklist

After implementing fixes, verify from these angles:

### Camera Position 1: Isometric View
```
    ↗ Camera
   /
  /    ┌─────┐
 /     │ Box │
       └─────┘

Should see:
✓ All panels
✓ Kara frames on ends
✓ Top runners
✓ Side runners
✓ No overlapping
```

### Camera Position 2: Side View
```
Camera ←──────→ Box Side

Should see:
✓ Side panel
✓ Side runners (horizontal or vertical)
✓ Distinct wood colors
✓ Clear structure
```

### Camera Position 3: Top View
```
        Camera
          ↓
      ┌───────┐
      │  Box  │
      └───────┘

Should see:
✓ Top lid
✓ Top runners
✓ Runner alignment
✓ Kara frames at ends
```

### Camera Position 4: End View
```
      Box End ←──────→ Camera

Should see:
✓ Kara panel
✓ Kara frame (4 beams forming rectangle)
✓ Frame OUTSIDE panel (not inside)
✓ Distinct color
```

## Summary Diagram

Complete box structure with all components:

```
    Legend:
    ▓ Panels (light)
    ║ Vertical runners
    ═ Horizontal runners
    ╔ Frame corners

                Top View
    ╔═══════════════════════════╗
    ║ Top Lid                   ║
    ╚═══════════════════════════╝
           ═══ ═══  Top runners

    ┌───────────────────────────┐
    │ ║                     ║   │ Side runners
    │ ║                     ║   │
    │ ║                     ║   │
    │ ║                     ║   │
╔═══╡ ╟═══════════════════╢ ╞═══╗ Kara frames
║   │ ║                     ║   │ ║
║   └─╨─────────────────────╨───┘ ║
║    ═══════════════════════════  ║ Bottom runners
║   ┌─────────────────────────┐   ║
║   │ Bottom Panel            │   ║
╚═══╧═════════════════════════╧═══╝

All components visible and distinguishable!
```

---

**Note:** These diagrams use ASCII art for clarity. In the actual 3D visualization:
- Components have depth (3D, not 2D)
- Materials have texture and lighting
- Users can rotate and zoom the view
- Colors are more nuanced than shown here

The diagrams illustrate the **positioning logic** and **relative relationships** between components.
