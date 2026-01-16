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

// Guard against multiple loads
if (!window.AppThreeScene) {

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
// ================================================================================
// GLOBAL SCENE STATE
// We store scene objects globally to persist across React re-renders
// This is necessary because our simple React implementation does full DOM replacement
// ================================================================================

let globalSceneState = null;
let sceneInitialized = false;
let lastProps = null;
let containerWatcherInterval = null;

// Watch for container changes and re-attach canvas when needed
// Uses MutationObserver for efficiency, with setInterval as fallback
function setupContainerWatcher() {
    // Use MutationObserver if available for better performance
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(() => {
            const container = document.getElementById('three-scene-container');
            if (container && globalSceneState && globalSceneState.renderer) {
                if (!container.contains(globalSceneState.renderer.domElement)) {
                    container.innerHTML = '';
                    container.appendChild(globalSceneState.renderer.domElement);
                    if (lastProps) {
                        updateSceneGeometry(globalSceneState, lastProps.dims, lastProps.boxType, 
                            lastProps.crateType, lastProps.mainRows, lastProps.supps, lastProps.runnerConfig);
                    }
                }
            }
        });
        
        // Start observing once DOM is ready
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                observer.observe(document.body, { childList: true, subtree: true });
            });
        }
    } else {
        // Fallback to setInterval for older browsers
        containerWatcherInterval = setInterval(() => {
            const container = document.getElementById('three-scene-container');
            if (container && globalSceneState && globalSceneState.renderer) {
                if (!container.contains(globalSceneState.renderer.domElement)) {
                    container.innerHTML = '';
                    container.appendChild(globalSceneState.renderer.domElement);
                    if (lastProps) {
                        updateSceneGeometry(globalSceneState, lastProps.dims, lastProps.boxType, 
                            lastProps.crateType, lastProps.mainRows, lastProps.supps, lastProps.runnerConfig);
                    }
                }
            }
        }, 100);
    }
}

// Start the watcher when the script loads
setupContainerWatcher();

// Initialize the scene once the container is available in the DOM
const MAX_INIT_RETRIES = 100; // Maximum retries (~1.6 seconds at 60fps)
let initRetryCount = 0;

function initializeThreeScene(dims, boxType, crateType, mainRows, supps, runnerConfig) {
    // Store props for later use
    lastProps = { dims, boxType, crateType, mainRows, supps, runnerConfig };
    
    // Find the container div by a unique attribute we'll set
    const container = document.getElementById('three-scene-container');
    if (!container) {
        // Container not ready yet, try again on next frame (with retry limit)
        initRetryCount++;
        if (initRetryCount < MAX_INIT_RETRIES) {
            requestAnimationFrame(() => initializeThreeScene(dims, boxType, crateType, mainRows, supps, runnerConfig));
        }
        return;
    }
    
    // Reset retry count on success
    initRetryCount = 0;

    // Get container dimensions
    const w = container.clientWidth || 400;
    const h = container.clientHeight || 400;

    // If we have an existing scene, just re-attach the canvas and update
    if (globalSceneState && globalSceneState.renderer) {
        // Check if canvas is not already in this container
        if (!container.contains(globalSceneState.renderer.domElement)) {
            container.innerHTML = '';
            container.appendChild(globalSceneState.renderer.domElement);
        }
        // Update the scene geometry
        updateSceneGeometry(globalSceneState, dims, boxType, crateType, mainRows, supps, runnerConfig);
        return;
    }

    // ============================================================
    // SCENE SETUP (only runs once)
    // ============================================================
    
    // Create scene with warm background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfff8ef);

    // Setup camera (perspective view)
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(60, 50, 80);

    // Setup WebGL renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    
    // Add canvas to container
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // ============================================================
    // LIGHTING SETUP
    // ============================================================
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(50, 60, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // ============================================================
    // CAMERA CONTROLS (Orbit)
    // ============================================================
    
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Create group for box parts
    const group = new THREE.Group();
    scene.add(group);

    // Store global state
    globalSceneState = {
        scene,
        camera,
        renderer,
        controls,
        group
    };
    sceneInitialized = true;

    // Build initial geometry
    updateSceneGeometry(globalSceneState, dims, boxType, crateType, mainRows, supps, runnerConfig);

    // ============================================================
    // ANIMATION LOOP
    // ============================================================

    const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };
    animate();
}

const ThreeScene = ({ dims, boxType, crateType, mainRows, supps, runnerConfig }) => {
    useEffect(() => {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            initializeThreeScene(dims, boxType, crateType, mainRows, supps, runnerConfig);
        });
    }, [dims, boxType, crateType, mainRows, supps, runnerConfig]);

    // Return the container div with an ID so we can find it later
    return React.createElement('div', { 
        id: 'three-scene-container',
        style: { width: '100%', height: '100%' } 
    });
};

/**
 * Update the scene geometry based on current props
 */
function updateSceneGeometry(state, dims, boxType, crateType, mainRows, supps, runnerConfig) {
    const { group } = state;
    
    // Clear existing geometry
    while (group.children.length > 0) {
        group.remove(group.children[0]);
    }
    
    // ============================================================
    // MATERIALS (Wood Colors)
    // ============================================================
    
    const woodMat = new THREE.MeshStandardMaterial({ 
        color: 0xfcd34d,  // Light yellow for panels
        roughness: 0.8 
    });
    const woodMatSide = new THREE.MeshStandardMaterial({ 
        color: 0xf59e0b,  // Orange for sides
        roughness: 0.8 
    });
    const woodMatDark = new THREE.MeshStandardMaterial({ 
        color: 0x78350f,  // Dark brown for runners
        roughness: 0.9 
    });

    // ============================================================
    // HELPER FUNCTION: Create Box Geometry
    // ============================================================
    
    const createBox = (w, h, d, colorMat, x, y, z) => {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, colorMat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    };

    // ============================================================
    // CONSTANTS
    // ============================================================
    
    const THK = 1;  // Panel thickness
    const isBottomType = (boxType === 'bottom' || (boxType === 'crate' && crateType === 'bottom'));

    // ============================================================
    // BOTTOM RUNNERS (Foundation)
    // ============================================================
    
    const bSize = getSizeDims(supps.bottom.size);
    const bH = bSize.w;
    const bW = bSize.t;
    const bLen = supps.bottom.dim;
    const bCount = supps.bottom.count;
    let runnerPositions = [];

    if (bCount > 0) {
        if (isBottomType) {
            const spreadW = mainRows.bottom.w;
            for (let i = 0; i < bCount; i++) {
                let zPos;
                if (bCount === 1) {
                    zPos = 0;
                } else {
                    const maxOffset = (spreadW / 2) - (bW / 2);
                    const pct = i / (bCount - 1);
                    zPos = -maxOffset + (pct * 2 * maxOffset);
                }
                runnerPositions.push(zPos);
                group.add(createBox(bLen, bH, bW, woodMatDark, 0, bH / 2, zPos));
            }
        } else {
            if (runnerConfig.bottomDir === 'width') {
                const spreadL = mainRows.bottom.l;
                const stepX = spreadL / (bCount + 1);
                for (let i = 1; i <= bCount; i++) {
                    const xPos = -spreadL / 2 + (i * stepX);
                    runnerPositions.push(xPos);
                    group.add(createBox(bW, bH, bLen, woodMatDark, xPos, bH / 2, 0));
                }
            } else {
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

    const baseY = bH;

    // ============================================================
    // BOTTOM PANEL
    // ============================================================
    
    const botL = mainRows.bottom.l;
    const botW = mainRows.bottom.w;
    group.add(createBox(botL, THK, botW, woodMat, 0, baseY + THK / 2, 0));

    const floorLevel = baseY + THK;

    // ============================================================
    // SIDE PANELS
    // ============================================================
    
    const sL = mainRows.sides.l;
    const sH = mainRows.sides.w;
    let sideY, sideZ_offset;

    if (isBottomType) {
        sideY = baseY + sH / 2;
        sideZ_offset = (mainRows.bottom.w / 2) + (THK / 2);
    } else {
        sideY = floorLevel + sH / 2;
        sideZ_offset = (botW / 2) - (THK / 2);
    }

    group.add(createBox(sL, sH, THK, woodMatSide, 0, sideY, sideZ_offset));
    group.add(createBox(sL, sH, THK, woodMatSide, 0, sideY, -sideZ_offset));

    // ============================================================
    // KARA PANELS (End Panels)
    // ============================================================
    
    const kL = mainRows.kara.l;
    const kH = mainRows.kara.w;
    const kThk = THK;
    let karaY, karaX_offset;

    if (isBottomType) {
        karaY = baseY + kH / 2;
        karaX_offset = (mainRows.bottom.l / 2) + (kThk / 2);
    } else {
        karaY = floorLevel + kH / 2;
        karaX_offset = (parseFloat(dims.l) / 2) + (kThk / 2);
    }

    group.add(createBox(kThk, kH, kL, woodMatSide, karaX_offset, karaY, 0));
    group.add(createBox(kThk, kH, kL, woodMatSide, -karaX_offset, karaY, 0));

    // ============================================================
    // SIDE RUNNERS
    // ============================================================
    
    const srLen = supps.sides.dim;
    const srCount = Math.round(supps.sides.count / 2);

    const drawSideRunners = (sideMultiplier) => {
        const zPosPanel = sideMultiplier * (sideZ_offset + THK + 0.5);

        if (isBottomType || runnerConfig.sideDir === 'horizontal') {
            if (isBottomType && srCount > 0) {
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
                const stepY = sH / (srCount + 1);
                for (let i = 1; i <= srCount; i++) {
                    const yPos = (isBottomType ? baseY : floorLevel) + (i * stepY);
                    group.add(createBox(srLen, 3, 1, woodMatDark, 0, yPos, zPosPanel));
                }
            }
        } else {
            let positions = [];
            if (runnerConfig.bottomDir === 'width' && runnerPositions.length > 0) {
                positions = runnerPositions;
            } else {
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
        drawSideRunners(1);
        drawSideRunners(-1);
    }

    // ============================================================
    // KARA RUNNERS
    // ============================================================
    
    if (isBottomType) {
        const kVertLen = supps.karaVert.dim;
        const kVertSize = getSizeDims(supps.karaVert.size);
        const kVertW = kVertSize.w;
        const kV_Y = baseY + (kVertLen / 2);

        [1, -1].forEach(dirX => {
            const xPos = dirX * (karaX_offset + kThk + 1.5);
            if (runnerPositions.length > 0) {
                runnerPositions.forEach(zPos => {
                    group.add(createBox(kVertW, kVertLen, kVertW, woodMatDark, xPos, kV_Y, zPos));
                });
            } else {
                const kPostZ = (kL / 2) - 1.5;
                group.add(createBox(kVertW, kVertLen, kVertW, woodMatDark, xPos, kV_Y, kPostZ));
                group.add(createBox(kVertW, kVertLen, kVertW, woodMatDark, xPos, kV_Y, -kPostZ));
            }
        });
    } else {
        const kHorzLen = supps.karaHorz.dim;
        const kVertLen = supps.karaVert.dim;
        const suppW = getSizeDims(supps.karaHorz.size).w;
        const frameThickness = 4;

        const kY_Top = floorLevel + kH - (suppW / 2);
        const kY_Bot = floorLevel + (suppW / 2);
        const kY_Mid = floorLevel + (kH / 2);
        const kZ_Left = (kL / 2) - (suppW / 2);
        const kZ_Right = -((kL / 2) - (suppW / 2));

        [1, -1].forEach(dirX => {
            const xPos = dirX * (karaX_offset + kThk + 1.5);
            group.add(createBox(frameThickness, suppW + 1, kHorzLen, woodMatDark, xPos, kY_Top, 0));
            group.add(createBox(frameThickness, suppW + 1, kHorzLen, woodMatDark, xPos, kY_Bot, 0));
            if (kVertLen > 0) {
                group.add(createBox(frameThickness, kVertLen, suppW + 1, woodMatDark, xPos, kY_Mid, kZ_Left));
                group.add(createBox(frameThickness, kVertLen, suppW + 1, woodMatDark, xPos, kY_Mid, kZ_Right));
            }
        });
    }

    // ============================================================
    // TOP LID
    // ============================================================
    
    const tL = mainRows.top.l;
    const tW = mainRows.top.w;
    const topY = (isBottomType ? baseY : floorLevel) + sH + THK / 2;
    group.add(createBox(tL, THK, tW, woodMat, 0, topY, 0));

    // ============================================================
    // TOP LID RUNNERS
    // ============================================================
    
    if (supps.top.count > 0) {
        const trH = 3;
        const trY = topY + (THK / 2) + trH / 2 + 0.5;

        let topRunnerPositions = [];
        if (runnerPositions.length > 0) {
            topRunnerPositions = runnerPositions;
        } else {
            const count = supps.top.count;
            if (isBottomType) {
                const spreadW = tW;
                const step = spreadW / (count + 1);
                for (let i = 1; i <= count; i++) {
                    topRunnerPositions.push(-spreadW / 2 + (i * step));
                }
            } else {
                const spreadL = tL;
                const step = spreadL / (count + 1);
                for (let i = 1; i <= count; i++) {
                    topRunnerPositions.push(-spreadL / 2 + (i * step));
                }
            }
        }

        if (isBottomType) {
            const trW = 4;
            const trLen = tL;
            topRunnerPositions.forEach(zPos => {
                group.add(createBox(trLen, trH, trW, woodMatDark, 0, trY, zPos));
            });
        } else {
            const trLen = tW;
            const topSize = getSizeDims(supps.top.size);
            const trW = topSize.w + 0.5;
            topRunnerPositions.forEach(xPos => {
                group.add(createBox(trW, trH, trLen, woodMatDark, xPos, trY, 0));
            });
        }
    }
}

// ================================================================================
// EXPORTS
// Make ThreeScene available globally for other modules
// ================================================================================

window.AppThreeScene = {
    ThreeScene
};

} // End guard
