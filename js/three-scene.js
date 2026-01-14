/**
 * ================================================================================
 * AMBICA WOODEN WORKS - SMART CFT CALCULATOR
 * 3D VISUALIZATION ENGINE
 * ================================================================================
 * 
 * PURPOSE:
 * Contains the Three.js scene for rendering an interactive 3D preview of the box.
 * Users can rotate and view the box from any angle to understand construction.
 * 
 * FILE LOCATION: js/three-scene.js
 * 
 * DEPENDENCIES:
 * - Three.js (loaded via CDN in index.html)
 * - OrbitControls (loaded via CDN in index.html)
 * - React (loaded via CDN in index.html)
 * - js/calculations.js (must be loaded first)
 *   - Uses: getSizeDims for wood dimensions
 * 
 * USED BY:
 * - js/app.js (renders ThreeScene inside ErrorBoundary)
 * 
 * EXPORTS (via window.AppThreeScene):
 * - ThreeScene: React component for 3D box visualization
 * 
 * PROPS (ThreeScene):
 * - dims: {l, w, h} - Internal box dimensions
 * - boxType: 'simple' | 'bottom' | 'crate'
 * - crateType: 'simple' | 'bottom' (only if boxType is 'crate')
 * - mainRows: Object with top, bottom, sides, kara dimensions
 * - supps: Object with support runner configurations
 * - runnerConfig: {bottomDir, sideDir} - Runner orientation settings
 * 
 * 3D MODEL STRUCTURE:
 * The box is built from bottom up in this order:
 * 1. Bottom Runners (foundation support beams)
 * 2. Bottom Panel (base of the box)
 * 3. Side Panels (left and right walls)
 * 4. Kara Panels (front and back end walls)
 * 5. Side Runners (support beams on side panels)
 * 6. Kara Runners (support beams on end panels - frames or posts)
 * 7. Top Lid Panel
 * 8. Top Lid Runners
 * 
 * ================================================================================
 */

// ================================================================================
// DEPENDENCY CHECK
// ================================================================================

if (!window.AppCalculations) {
    console.error('ERROR: js/calculations.js must be loaded before js/three-scene.js');
}

if (typeof THREE === 'undefined') {
    console.error('ERROR: Three.js must be loaded before js/three-scene.js');
}

// Get calculation functions
const { getSizeDims } = window.AppCalculations;

// Get React hooks
const { useRef, useEffect } = React;

// ================================================================================
// THREE.JS SCENE COMPONENT
// ================================================================================

/**
 * ThreeScene Component
 * 
 * Creates a 3D visualization of the wooden box with all its parts.
 * Uses Three.js for WebGL rendering and OrbitControls for interaction.
 * 
 * COLOR SCHEME:
 * - woodMat (light): #fcd34d - Panels (top, bottom)
 * - woodMatSide (medium): #f59e0b - Side and Kara panels
 * - woodMatDark (dark): #78350f - Runners and supports
 * 
 * @param {object} props - Component props
 * @param {object} props.dims - {l, w, h} internal dimensions
 * @param {string} props.boxType - 'simple', 'bottom', or 'crate'
 * @param {string} props.crateType - 'simple' or 'bottom' (for crates)
 * @param {object} props.mainRows - Panel dimensions
 * @param {object} props.supps - Support runner settings
 * @param {object} props.runnerConfig - Runner orientation config
 */
const ThreeScene = ({ dims, boxType, crateType, mainRows, supps, runnerConfig }) => {
    // Reference to the DOM container for the 3D canvas
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // ============================================================
        // SCENE SETUP
        // ============================================================
        
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        
        // Create scene with warm background
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xfff8ef);

        // Setup camera (perspective view)
        const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
        camera.position.set(60, 50, 80); // Positioned to see the box at an angle

        // Setup WebGL renderer with antialiasing
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(w, h);
        renderer.shadowMap.enabled = true; // Enable shadows
        
        // Clear and add canvas to container
        mountRef.current.innerHTML = '';
        mountRef.current.appendChild(renderer.domElement);

        // ============================================================
        // LIGHTING SETUP
        // ============================================================
        
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        // Directional light for shadows and depth
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
        dirLight.position.set(50, 60, 50);
        dirLight.castShadow = true;
        scene.add(dirLight);

        // ============================================================
        // CAMERA CONTROLS (Orbit)
        // Allows user to rotate and zoom the view
        // ============================================================
        
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;  // Smooth rotation
        controls.dampingFactor = 0.05;

        // ============================================================
        // MATERIALS (Wood Colors)
        // ============================================================
        
        const woodMat = new THREE.MeshStandardMaterial({ 
            color: 0xfcd34d,   // Light wood (amber-300)
            roughness: 0.8 
        });
        
        const woodMatSide = new THREE.MeshStandardMaterial({ 
            color: 0xf59e0b,   // Medium wood (amber-500)
            roughness: 0.8 
        });
        
        const woodMatDark = new THREE.MeshStandardMaterial({ 
            color: 0x78350f,   // Dark wood (amber-900) - for runners
            roughness: 0.9 
        });

        // ============================================================
        // HELPER FUNCTION: Create a box mesh
        // ============================================================
        
        /**
         * Creates a Three.js box mesh with specified dimensions and position.
         * 
         * @param {number} w - Width (X axis)
         * @param {number} h - Height (Y axis)
         * @param {number} d - Depth (Z axis)
         * @param {THREE.Material} colorMat - Material to apply
         * @param {number} x - X position
         * @param {number} y - Y position
         * @param {number} z - Z position
         * @returns {THREE.Mesh} The created mesh
         */
        const createBox = (w, h, d, colorMat, x, y, z) => {
            const geo = new THREE.BoxGeometry(w, h, d);
            const mesh = new THREE.Mesh(geo, colorMat);
            mesh.position.set(x, y, z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        };

        // Create a group to hold all box parts
        const group = new THREE.Group();
        scene.add(group);

        // ============================================================
        // VISUALIZATION PARAMETERS
        // ============================================================
        
        const THK = 1; // Panel thickness in 3D units
        const isBottomType = (boxType === 'bottom' || (boxType === 'crate' && crateType === 'bottom'));

        // ============================================================
        // STEP 1: BOTTOM RUNNERS (Foundation support beams)
        // These are the beams the box sits on
        // ============================================================

        const bSize = getSizeDims(supps.bottom.size);
        const bH = bSize.w;  // Height of runner in 3D (width becomes height when laid)
        const bW = bSize.t;  // Width of runner in 3D
        const bLen = supps.bottom.dim;
        const bCount = supps.bottom.count;

        let runnerPositions = []; // Store positions for alignment with other parts

        if (bCount > 0) {
            if (isBottomType) {
                // BOTTOM TYPE: Runners run horizontally (length-wise)
                // Distributed along the width of the box
                const spreadW = mainRows.bottom.w;

                for (let i = 0; i < bCount; i++) {
                    let zPos;
                    if (bCount === 1) {
                        zPos = 0; // Single runner at center
                    } else {
                        // Distribute runners evenly, with first and last near edges
                        const maxOffset = (spreadW / 2) - (bW / 2);
                        const pct = i / (bCount - 1);
                        zPos = -maxOffset + (pct * 2 * maxOffset);
                    }

                    runnerPositions.push(zPos);
                    group.add(createBox(bLen, bH, bW, woodMatDark, 0, bH / 2, zPos));
                }
            } else {
                // SIMPLE TYPE: Can run width-wise or horizontally based on config
                if (runnerConfig.bottomDir === 'width') {
                    // Standard: Width-wise runners, spaced along Length
                    const spreadL = mainRows.bottom.l;
                    const stepX = spreadL / (bCount + 1);
                    
                    for (let i = 1; i <= bCount; i++) {
                        const xPos = -spreadL / 2 + (i * stepX);
                        runnerPositions.push(xPos);
                        group.add(createBox(bW, bH, bLen, woodMatDark, xPos, bH / 2, 0));
                    }
                } else {
                    // Horizontal Override: Length-wise runners
                    const spreadW = mainRows.bottom.w;
                    const stepZ = spreadW / (bCount + 1);
                    
                    for (let i = 1; i <= bCount; i++) {
                        const zPos = -spreadW / 2 + (i * stepZ);
                        runnerPositions.push(zPos);
                        group.add(createBox(bLen, bH, bW, woodMatDark, 0, bH / 2, zPos));
                    }
                }
            }
        }

        const baseY = bH; // Y position after bottom runners

        // ============================================================
        // STEP 2: BOTTOM PANEL
        // The base/floor of the box
        // ============================================================

        const botL = mainRows.bottom.l;
        const botW = mainRows.bottom.w;
        group.add(createBox(botL, THK, botW, woodMat, 0, baseY + THK / 2, 0));

        const floorLevel = baseY + THK;

        // ============================================================
        // STEP 3: SIDE PANELS (Left and Right walls)
        // ============================================================

        const sL = mainRows.sides.l;
        const sH = mainRows.sides.w;
        let sideY, sideZ_offset;

        if (isBottomType) {
            // Bottom type: Sides sit at base level, outside the bottom panel
            sideY = baseY + sH / 2;
            sideZ_offset = (mainRows.bottom.w / 2) + (THK / 2);
        } else {
            // Simple type: Sides sit on top of floor, inside the base dimensions
            sideY = floorLevel + sH / 2;
            sideZ_offset = (botW / 2) - (THK / 2);
        }

        // Add left and right side panels
        group.add(createBox(sL, sH, THK, woodMatSide, 0, sideY, sideZ_offset));
        group.add(createBox(sL, sH, THK, woodMatSide, 0, sideY, -sideZ_offset));

        // ============================================================
        // STEP 4: KARA PANELS (Front and Back end walls)
        // ============================================================

        const kL = mainRows.kara.l;
        const kH = mainRows.kara.w;
        const kThk = THK;

        let karaY, karaX_offset;

        if (isBottomType) {
            // Bottom type: Kara sits at base level, outside bottom panel
            karaY = baseY + kH / 2;
            karaX_offset = (mainRows.bottom.l / 2) + (kThk / 2);
        } else {
            // Simple type: Kara sits on floor, at box length edges
            karaY = floorLevel + kH / 2;
            karaX_offset = (parseFloat(dims.l) / 2) + (kThk / 2);
        }

        // Add front and back kara panels
        group.add(createBox(kThk, kH, kL, woodMatSide, karaX_offset, karaY, 0));
        group.add(createBox(kThk, kH, kL, woodMatSide, -karaX_offset, karaY, 0));

        // ============================================================
        // STEP 5: SIDE RUNNERS (Support beams on side panels)
        // ============================================================

        const srLen = supps.sides.dim;
        const srCount = Math.round(supps.sides.count / 2); // Divide by 2 for each side

        /**
         * Draws runners on one side panel.
         * @param {number} sideMultiplier - 1 for right side, -1 for left side
         */
        const drawSideRunners = (sideMultiplier) => {
            const zPosPanel = sideMultiplier * (sideZ_offset + THK + 0.5);

            if (isBottomType || runnerConfig.sideDir === 'horizontal') {
                // HORIZONTAL RUNNERS (run along length of box)
                if (isBottomType && srCount > 0) {
                    // Bottom Type: One runner at top, rest distributed
                    const topY = baseY + sH - 1.5;
                    group.add(createBox(srLen, 3, 1, woodMatDark, 0, topY, zPosPanel));

                    if (srCount > 1) {
                        const remainingSpace = sH - 3;
                        const step = remainingSpace / srCount;
                        for (let i = 1; i < srCount; i++) {
                            const yPos = baseY + (i * step);
                            group.add(createBox(srLen, 3, 1, woodMatDark, 0, yPos, zPosPanel));
                        }
                    }
                } else {
                    // Simple type horizontal
                    const stepY = sH / (srCount + 1);
                    for (let i = 1; i <= srCount; i++) {
                        const yPos = (isBottomType ? baseY : floorLevel) + (i * stepY);
                        group.add(createBox(srLen, 3, 1, woodMatDark, 0, yPos, zPosPanel));
                    }
                }
            } else {
                // VERTICAL RUNNERS (run up/down) - ALIGNED with Bottom Runners
                let positions = [];
                if (runnerConfig.bottomDir === 'width' && runnerPositions.length > 0) {
                    positions = runnerPositions; // Align with bottom runners
                } else {
                    // Create evenly distributed positions
                    const totalL = mainRows.sides.l;
                    const step = totalL / (srCount + 1);
                    for (let i = 1; i <= srCount; i++) {
                        positions.push(-totalL / 2 + i * step);
                    }
                }

                const vCenterY = srLen / 2;

                positions.forEach(xPos => {
                    group.add(createBox(3, srLen, 1, woodMatDark, xPos, vCenterY, zPosPanel));
                });
            }
        };

        if (supps.sides.count > 0) {
            drawSideRunners(1);   // Right side
            drawSideRunners(-1);  // Left side
        }

        // ============================================================
        // STEP 6: KARA RUNNERS (Support beams on end panels)
        // Different structure for Simple vs Bottom types
        // ============================================================

        if (isBottomType) {
            // BOTTOM TYPE: Vertical Posts at corners
            const kVertLen = supps.karaVert.dim;
            const kVertSize = getSizeDims(supps.karaVert.size);
            const kVertW = kVertSize.w;
            const kV_Y = baseY + (kVertLen / 2);

            [1, -1].forEach(dirX => {
                const xPos = dirX * (karaX_offset + kThk + 1.5);

                if (runnerPositions.length > 0) {
                    // Place posts at bottom runner positions
                    runnerPositions.forEach(zPos => {
                        group.add(createBox(kVertW, kVertLen, kVertW, woodMatDark, xPos, kV_Y, zPos));
                    });
                } else {
                    // Default: posts at corners
                    const kPostZ = (kL / 2) - 1.5;
                    group.add(createBox(kVertW, kVertLen, kVertW, woodMatDark, xPos, kV_Y, kPostZ));
                    group.add(createBox(kVertW, kVertLen, kVertW, woodMatDark, xPos, kV_Y, -kPostZ));
                }
            });
        } else {
            // SIMPLE TYPE: SQUARE FRAME (top, bottom, left, right beams)
            const kHorzLen = supps.karaHorz.dim;
            const kVertLen = supps.karaVert.dim;
            const suppW = getSizeDims(supps.karaHorz.size).w;
            const frameThickness = 4; // Frame beam thickness

            const kY_Top = floorLevel + kH - (suppW / 2);
            const kY_Bot = floorLevel + (suppW / 2);
            const kY_Mid = floorLevel + (kH / 2);

            const kZ_Left = (kL / 2) - (suppW / 2);
            const kZ_Right = -((kL / 2) - (suppW / 2));

            [1, -1].forEach(dirX => {
                const xPos = dirX * (karaX_offset + kThk + 1.5);

                // Top horizontal beam
                group.add(createBox(frameThickness, suppW + 1, kHorzLen, woodMatDark, xPos, kY_Top, 0));
                // Bottom horizontal beam
                group.add(createBox(frameThickness, suppW + 1, kHorzLen, woodMatDark, xPos, kY_Bot, 0));

                // Left and right vertical beams
                if (kVertLen > 0) {
                    group.add(createBox(frameThickness, kVertLen, suppW + 1, woodMatDark, xPos, kY_Mid, kZ_Left));
                    group.add(createBox(frameThickness, kVertLen, suppW + 1, woodMatDark, xPos, kY_Mid, kZ_Right));
                }
            });
        }

        // ============================================================
        // STEP 7: TOP LID PANEL
        // ============================================================

        const tL = mainRows.top.l;
        const tW = mainRows.top.w;
        const topY = (isBottomType ? baseY : floorLevel) + sH + THK / 2;
        group.add(createBox(tL, THK, tW, woodMat, 0, topY, 0));

        // ============================================================
        // STEP 8: TOP LID RUNNERS
        // ============================================================

        if (supps.top.count > 0) {
            const trH = 3; // Runner height
            const trY = topY + (THK / 2) + trH / 2 + 0.5; // Position on top of lid

            // Determine positions with fallback logic
            let topRunnerPositions = [];

            if (runnerPositions.length > 0) {
                // Use existing bottom runner positions if available
                topRunnerPositions = runnerPositions;
            } else {
                // Fallback: create positions based on top support count
                const count = supps.top.count;
                if (isBottomType) {
                    // For bottom type, distribute along width
                    const spreadW = tW;
                    const step = spreadW / (count + 1);
                    for (let i = 1; i <= count; i++) {
                        topRunnerPositions.push(-spreadW / 2 + (i * step));
                    }
                } else {
                    // For simple type, distribute along length
                    const spreadL = tL;
                    const step = spreadL / (count + 1);
                    for (let i = 1; i <= count; i++) {
                        topRunnerPositions.push(-spreadL / 2 + (i * step));
                    }
                }
            }

            if (isBottomType) {
                // BOTTOM TYPE: Runners run length-wise
                const trW = 4;
                const trLen = tL;

                topRunnerPositions.forEach(zPos => {
                    group.add(createBox(trLen, trH, trW, woodMatDark, 0, trY, zPos));
                });
            } else {
                // SIMPLE TYPE: Runners run width-wise
                const trLen = tW;
                const topSize = getSizeDims(supps.top.size);
                const trW = topSize.w + 0.5;

                topRunnerPositions.forEach(xPos => {
                    group.add(createBox(trW, trH, trLen, woodMatDark, xPos, trY, 0));
                });
            }
        }

        // ============================================================
        // ANIMATION LOOP
        // ============================================================

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // ============================================================
        // CLEANUP
        // Runs when component unmounts or props change
        // ============================================================

        return () => {
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [dims, boxType, crateType, mainRows, supps, runnerConfig]);

    // Return the container div that will hold the 3D canvas
    return React.createElement('div', { 
        ref: mountRef, 
        style: { width: '100%', height: '100%' } 
    });
};

// ================================================================================
// EXPORTS
// Make ThreeScene available globally for other modules
// ================================================================================

window.AppThreeScene = {
    ThreeScene
};
