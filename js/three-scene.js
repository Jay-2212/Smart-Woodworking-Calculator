/**
 * Interactive structural preview. It deliberately models calculated panels and
 * supports only; it is not a cut list or a crate-slat layout.
 */
if (!window.AppCalculations) console.error('ERROR: js/calculations.js must be loaded before js/three-scene.js');
if (typeof THREE === 'undefined') console.error('ERROR: Three.js must be loaded before js/three-scene.js');

if (!window.AppThreeScene) {
const { getSizeDims } = window.AppCalculations;
const { useEffect, useRef, useState } = React;

const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const count = value => Math.max(0, Math.floor(Number(value) || 0));
const distributeAcrossPairs = total => [Math.ceil(count(total) / 2), Math.floor(count(total) / 2)];
const evenlySpaced = (total, span) => {
    if (total < 1) return [];
    if (total === 1) return [0];
    return Array.from({ length: total }, (_, index) => -span / 2 + (span * index) / (total - 1));
};

class SceneController {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xfff8ef);
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.materials = {
            panel: new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.8 }),
            side: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.8 }),
            support: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
        };
        this.addLights();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.shadowMap.enabled = true;
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.enablePan = false;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 500;
        this.controls.addEventListener('change', () => this.scheduleRender());
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.defaultTarget = new THREE.Vector3();
        this.debug = { supportCounts: {}, supportCrossSections: {} };
        this.renderPending = false;
        this.disposed = false;
    }

    addLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.05));
        [[60, 100, 60, 1.2], [-60, 50, 60, 0.8], [60, 40, -60, 0.6], [0, -50, 0, 0.4]].forEach(([x, y, z, intensity]) => {
            const light = new THREE.DirectionalLight(0xffffff, intensity);
            light.position.set(x, y, z);
            this.scene.add(light);
        });
    }

    attach(container) {
        if (!container || this.disposed) return;
        if (this.container !== container) {
            this.resizeObserver.disconnect();
            this.container = container;
            if (this.renderer.domElement.parentNode !== container) {
                container.replaceChildren(this.renderer.domElement);
            }
            this.resizeObserver.observe(container);
        }
        this.resize();
    }

    resize() {
        if (!this.container || this.disposed) return;
        const width = Math.max(1, this.container.clientWidth);
        const height = Math.max(1, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.scheduleRender();
    }

    scheduleRender() {
        if (this.renderPending || this.disposed) return;
        this.renderPending = true;
        requestAnimationFrame(() => {
            this.renderPending = false;
            if (this.disposed) return;
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        });
    }

    clearGeometry() {
        while (this.group.children.length) {
            const child = this.group.children[0];
            this.group.remove(child);
            child.geometry.dispose();
        }
    }

    box(x, y, z, material, position) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(number(x, 0.01), number(y, 0.01), number(z, 0.01)), material);
        mesh.position.set(...position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);
    }

    update(props) {
        this.clearGeometry();
        const { mainRows, supps, runnerConfig, boxType, crateType } = props;
        const top = mainRows.top;
        const bottom = mainRows.bottom;
        const sides = mainRows.sides;
        const kara = mainRows.kara;
        const bottomSize = getSizeDims(supps.bottom.size);
        const sideSize = getSizeDims(supps.sides.size);
        const topSize = getSizeDims(supps.top.size);
        const karaHorizontalSize = getSizeDims(supps.karaHorz.size);
        const karaVerticalSize = getSizeDims(supps.karaVert.size);
        const isBottom = boxType === 'bottom' || (boxType === 'crate' && crateType === 'bottom');
        const baseL = number(bottom.l);
        const baseW = number(bottom.w);
        const baseT = number(bottom.t, 1);
        const sideL = number(sides.l);
        const sideH = number(sides.w);
        const sideT = number(sides.t, 1);
        const karaL = number(kara.l);
        const karaH = number(kara.w);
        const karaT = number(kara.t, 1);
        const topL = number(top.l);
        const topW = number(top.w);
        const topT = number(top.t, 1);
        const supportCounts = {
            bottom: count(supps.bottom.count), sides: count(supps.sides.count), top: count(supps.top.count),
            karaHorz: count(supps.karaHorz.count), karaVert: count(supps.karaVert.count)
        };
        this.debug = {
            supportCounts,
            supportCrossSections: {
                bottom: { width: bottomSize.w, thickness: bottomSize.t },
                sides: { width: sideSize.w, thickness: sideSize.t },
                top: { width: topSize.w, thickness: topSize.t },
                karaHorz: { width: karaHorizontalSize.w, thickness: karaHorizontalSize.t },
                karaVert: { width: karaVerticalSize.w, thickness: karaVerticalSize.t }
            }
        };

        // Bottom runners keep the selected direction, with their real cross-section.
        const bottomPositions = [];
        if (runnerConfig.bottomDir === 'width') {
            evenlySpaced(supportCounts.bottom, baseL).forEach(x => {
                this.box(bottomSize.t, bottomSize.w, number(supps.bottom.dim), this.materials.support, [x, bottomSize.w / 2, 0]);
                bottomPositions.push(x);
            });
        } else {
            evenlySpaced(supportCounts.bottom, baseW).forEach(z => {
                this.box(number(supps.bottom.dim), bottomSize.w, bottomSize.t, this.materials.support, [0, bottomSize.w / 2, z]);
                bottomPositions.push(z);
            });
        }

        const floor = bottomSize.w + baseT;
        this.box(baseL, baseT, baseW, this.materials.panel, [0, bottomSize.w + baseT / 2, 0]);
        const sideY = (isBottom ? bottomSize.w : floor) + sideH / 2;
        const sideOffset = isBottom ? baseW / 2 + sideT / 2 : baseW / 2 - sideT / 2;
        const karaY = (isBottom ? bottomSize.w : floor) + karaH / 2;
        const karaOffset = isBottom ? baseL / 2 + karaT / 2 : baseL / 2 - karaT / 2;
        [1, -1].forEach(sign => this.box(sideL, sideH, sideT, this.materials.side, [0, sideY, sign * sideOffset]));
        [1, -1].forEach(sign => this.box(karaT, karaH, karaL, this.materials.side, [sign * karaOffset, karaY, 0]));

        // Odd totals are intentionally split ceil/floor across the two matching faces.
        const [frontSideCount, backSideCount] = distributeAcrossPairs(supportCounts.sides);
        [[1, frontSideCount], [-1, backSideCount]].forEach(([sign, faceCount]) => {
            const z = sign * (sideOffset + sideT / 2 + sideSize.t / 2);
            if (runnerConfig.sideDir === 'horizontal' || isBottom) {
                evenlySpaced(faceCount, Math.max(0, sideH - sideSize.w)).forEach(offset =>
                    this.box(number(supps.sides.dim), sideSize.w, sideSize.t, this.materials.support, [0, (isBottom ? bottomSize.w : floor) + sideSize.w / 2 + offset + (sideH - sideSize.w) / 2, z]));
            } else {
                evenlySpaced(faceCount, sideL).forEach(x =>
                    this.box(sideSize.w, number(supps.sides.dim), sideSize.t, this.materials.support, [x, floor + number(supps.sides.dim) / 2, z]));
            }
        });

        if (isBottom) {
            const [leftCount, rightCount] = distributeAcrossPairs(supportCounts.karaVert);
            [[1, leftCount], [-1, rightCount]].forEach(([sign, faceCount]) => {
                const x = sign * (karaOffset + karaT / 2 + karaVerticalSize.t / 2);
                evenlySpaced(faceCount, karaL).forEach(z =>
                    this.box(karaVerticalSize.t, number(supps.karaVert.dim), karaVerticalSize.w, this.materials.support, [x, bottomSize.w + number(supps.karaVert.dim) / 2, z]));
            });
        } else {
            const [leftHorizontal, rightHorizontal] = distributeAcrossPairs(supportCounts.karaHorz);
            const [leftVertical, rightVertical] = distributeAcrossPairs(supportCounts.karaVert);
            [[1, leftHorizontal, leftVertical], [-1, rightHorizontal, rightVertical]].forEach(([sign, horizontalCount, verticalCount]) => {
                const x = sign * (karaOffset + karaT / 2 + karaHorizontalSize.t / 2);
                evenlySpaced(horizontalCount, karaH).forEach(offset =>
                    this.box(karaHorizontalSize.t, karaHorizontalSize.w, number(supps.karaHorz.dim), this.materials.support, [x, floor + karaHorizontalSize.w / 2 + offset + (karaH - karaHorizontalSize.w) / 2, 0]));
                evenlySpaced(verticalCount, karaL).forEach(z =>
                    this.box(karaVerticalSize.t, number(supps.karaVert.dim), karaVerticalSize.w, this.materials.support, [x, floor + number(supps.karaVert.dim) / 2, z]));
            });
        }

        const topY = (isBottom ? bottomSize.w : floor) + sideH + topT / 2;
        this.box(topL, topT, topW, this.materials.panel, [0, topY, 0]);
        const topPositions = runnerConfig.bottomDir === 'width'
            ? evenlySpaced(supportCounts.top, topL)
            : evenlySpaced(supportCounts.top, topW);
        topPositions.forEach(position => {
            const y = topY + topT / 2 + topSize.w / 2;
            if (runnerConfig.bottomDir === 'width') this.box(topSize.t, topSize.w, number(supps.top.dim), this.materials.support, [position, y, 0]);
            else this.box(number(supps.top.dim), topSize.w, topSize.t, this.materials.support, [0, y, position]);
        });
        this.fitCamera();
    }

    fitCamera() {
        const bounds = new THREE.Box3().setFromObject(this.group);
        if (bounds.isEmpty()) return;
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const distance = Math.max(size.x, size.y, size.z) * 1.8 || 50;
        this.defaultTarget.copy(center);
        this.camera.position.set(center.x + distance, center.y + distance * 0.7, center.z + distance);
        this.controls.target.copy(center);
        this.controls.minDistance = Math.max(8, distance * 0.35);
        this.controls.maxDistance = Math.max(100, distance * 4);
        this.camera.near = Math.max(0.1, distance / 100);
        this.camera.far = Math.max(1000, distance * 10);
        this.camera.updateProjectionMatrix();
        this.controls.update();
        this.scheduleRender();
    }

    resetView() { this.fitCamera(); }

    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        this.resizeObserver.disconnect();
        this.clearGeometry();
        this.controls.dispose();
        Object.values(this.materials).forEach(material => material.dispose());
        this.renderer.dispose();
    }
}

let controller = null;
const getController = () => {
    if (!controller) controller = new SceneController();
    return controller;
};
window.addEventListener('pagehide', () => { if (controller) controller.dispose(); });

const ThreeScene = props => {
    const containerRef = useRef(null);
    const [unavailable, setUnavailable] = useState(false);

    // The vendored renderer replaces the full app root for every state change.
    // Reattach after every render, but leave geometry updates to the input effect.
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            if (unavailable) return;
            try {
                getController().attach(containerRef.current || document.getElementById('three-scene-container'));
            } catch (error) {
                console.warn('3D preview is unavailable', error);
                setUnavailable(true);
            }
        });
        return () => cancelAnimationFrame(frame);
    });

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            try {
                const sceneController = getController();
                sceneController.update(props);
            } catch (error) {
                console.warn('3D preview is unavailable', error);
                setUnavailable(true);
            }
        });
        return () => cancelAnimationFrame(frame);
    }, [props.dims, props.boxType, props.crateType, props.mainRows, props.supps, props.runnerConfig]);
    if (unavailable) return React.createElement('p', { className: 'three-scene-unavailable', role: 'alert' }, '3D preview is unavailable on this device. Your calculation is still available below.');
    return React.createElement('div', { id: 'three-scene-container', ref: containerRef, className: 'three-scene-container' });
};

const resetThreeSceneView = () => { if (controller) controller.resetView(); };
const getSceneDebugSnapshot = () => controller ? controller.debug : null;
window.AppThreeScene = { ThreeScene, resetThreeSceneView, getSceneDebugSnapshot };
}
