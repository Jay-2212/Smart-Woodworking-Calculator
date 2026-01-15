/**
 * Minimal Three.js implementation for Smart Woodworking Calculator
 * This is a lightweight alternative that provides basic 3D rendering using Canvas 2D
 * It implements only the Three.js API features used by this specific app
 */

(function(global) {
    'use strict';

    // Vector3 class
    class Vector3 {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        set(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        }

        copy(v) {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
            return this;
        }
    }

    // Color class
    class Color {
        constructor(color) {
            this.r = 1;
            this.g = 1;
            this.b = 1;
            this.setHex(color);
        }

        setHex(hex) {
            hex = Math.floor(hex);
            this.r = (hex >> 16 & 255) / 255;
            this.g = (hex >> 8 & 255) / 255;
            this.b = (hex & 255) / 255;
            return this;
        }

        getStyle() {
            const r = Math.round(this.r * 255);
            const g = Math.round(this.g * 255);
            const b = Math.round(this.b * 255);
            return `rgb(${r}, ${g}, ${b})`;
        }
    }

    // Material classes
    class Material {
        constructor(params = {}) {
            this.color = params.color ? new Color(params.color) : new Color(0xffffff);
        }
    }

    class MeshStandardMaterial extends Material {
        constructor(params = {}) {
            super(params);
            this.roughness = params.roughness !== undefined ? params.roughness : 0.5;
        }
    }

    // Geometry classes
    class BoxGeometry {
        constructor(width, height, depth) {
            this.width = width;
            this.height = height;
            this.depth = depth;
        }
    }

    // Object3D base class
    class Object3D {
        constructor() {
            this.position = new Vector3();
            this.rotation = new Vector3();
            this.children = [];
        }

        add(object) {
            this.children.push(object);
        }

        remove(object) {
            const index = this.children.indexOf(object);
            if (index !== -1) {
                this.children.splice(index, 1);
            }
        }
    }

    // Mesh class
    class Mesh extends Object3D {
        constructor(geometry, material) {
            super();
            this.geometry = geometry;
            this.material = material;
            this.castShadow = false;
            this.receiveShadow = false;
        }
    }

    // Group class
    class Group extends Object3D {
        constructor() {
            super();
        }
    }

    // Scene class
    class Scene extends Object3D {
        constructor() {
            super();
            this.background = new Color(0xffffff);
        }
    }

    // Light classes
    class Light extends Object3D {
        constructor(color, intensity) {
            super();
            this.color = color ? new Color(color) : new Color(0xffffff);
            this.intensity = intensity !== undefined ? intensity : 1;
        }
    }

    class AmbientLight extends Light {
        constructor(color, intensity) {
            super(color, intensity);
        }
    }

    class DirectionalLight extends Light {
        constructor(color, intensity) {
            super(color, intensity);
            this.castShadow = false;
        }
    }

    // Camera class
    class PerspectiveCamera extends Object3D {
        constructor(fov, aspect, near, far) {
            super();
            this.fov = fov;
            this.aspect = aspect;
            this.near = near;
            this.far = far;
        }
    }

    // WebGL Renderer (using Canvas 2D)
    class WebGLRenderer {
        constructor(params = {}) {
            this.domElement = document.createElement('canvas');
            this.context = this.domElement.getContext('2d');
            this.shadowMap = { enabled: false };
        }

        setSize(width, height) {
            this.domElement.width = width;
            this.domElement.height = height;
            this.domElement.style.width = width + 'px';
            this.domElement.style.height = height + 'px';
        }

        render(scene, camera) {
            const ctx = this.context;
            const width = this.domElement.width;
            const height = this.domElement.height;

            // Clear canvas
            ctx.fillStyle = scene.background.getStyle();
            ctx.fillRect(0, 0, width, height);

            // Collect all meshes with their positions
            const meshes = [];
            this.collectMeshes(scene, meshes);

            // Sort by depth for proper rendering order (painter's algorithm)
            // For isometric projection, depth = x + z - y ensures objects further back
            // (higher x, higher z) are drawn first, while objects higher up (higher y) 
            // are drawn later to appear on top
            meshes.sort((a, b) => {
                const depthA = a.position.x + a.position.z - a.position.y;
                const depthB = b.position.x + b.position.z - b.position.y;
                return depthA - depthB;
            });

            // Draw a simple 3D representation
            ctx.save();
            ctx.translate(width / 2, height / 2 + 50);

            // Render each mesh
            meshes.forEach(mesh => {
                this.renderMesh(mesh, ctx);
            });

            ctx.restore();
        }

        collectMeshes(object, meshes) {
            if (object instanceof Mesh && object.geometry instanceof BoxGeometry) {
                meshes.push(object);
            }
            object.children.forEach(child => {
                this.collectMeshes(child, meshes);
            });
        }

        renderMesh(mesh, ctx) {
            const geo = mesh.geometry;
            const mat = mesh.material;

            // Scale factor for visualization
            const scale = 3;

            // Isometric projection angles
            const isoAngle = Math.PI / 6; // 30 degrees

            // Get position and dimensions
            const px = mesh.position.x * scale;
            const py = mesh.position.y * scale;
            const pz = mesh.position.z * scale;

            const w = geo.width * scale;
            const h = geo.height * scale;
            const d = geo.depth * scale;

            // Convert 3D coordinates to 2D isometric
            const toIso = (x, y, z) => {
                return {
                    x: (x - z) * Math.cos(isoAngle),
                    y: (x + z) * Math.sin(isoAngle) - y
                };
            };

            // Calculate the 8 corners of the box
            const corners = [
                toIso(px - w/2, py - h/2, pz - d/2), // 0: front-bottom-left
                toIso(px + w/2, py - h/2, pz - d/2), // 1: front-bottom-right
                toIso(px + w/2, py + h/2, pz - d/2), // 2: front-top-right
                toIso(px - w/2, py + h/2, pz - d/2), // 3: front-top-left
                toIso(px - w/2, py - h/2, pz + d/2), // 4: back-bottom-left
                toIso(px + w/2, py - h/2, pz + d/2), // 5: back-bottom-right
                toIso(px + w/2, py + h/2, pz + d/2), // 6: back-top-right
                toIso(px - w/2, py + h/2, pz + d/2)  // 7: back-top-left
            ];

            const baseColor = mat.color.getStyle();

            // Draw top face (lighter)
            ctx.fillStyle = this.adjustBrightness(baseColor, 30);
            ctx.beginPath();
            ctx.moveTo(corners[3].x, corners[3].y);
            ctx.lineTo(corners[2].x, corners[2].y);
            ctx.lineTo(corners[6].x, corners[6].y);
            ctx.lineTo(corners[7].x, corners[7].y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = this.adjustBrightness(baseColor, -40);
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Draw left face (medium)
            ctx.fillStyle = this.adjustBrightness(baseColor, -10);
            ctx.beginPath();
            ctx.moveTo(corners[0].x, corners[0].y);
            ctx.lineTo(corners[3].x, corners[3].y);
            ctx.lineTo(corners[7].x, corners[7].y);
            ctx.lineTo(corners[4].x, corners[4].y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Draw right face (darker)
            ctx.fillStyle = this.adjustBrightness(baseColor, -30);
            ctx.beginPath();
            ctx.moveTo(corners[1].x, corners[1].y);
            ctx.lineTo(corners[2].x, corners[2].y);
            ctx.lineTo(corners[6].x, corners[6].y);
            ctx.lineTo(corners[5].x, corners[5].y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        adjustBrightness(color, amount) {
            // Simple color adjustment
            const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                const r = Math.min(255, Math.max(0, parseInt(match[1]) + amount));
                const g = Math.min(255, Math.max(0, parseInt(match[2]) + amount));
                const b = Math.min(255, Math.max(0, parseInt(match[3]) + amount));
                return `rgb(${r}, ${g}, ${b})`;
            }
            return color;
        }

        dispose() {
            // Clean up resources
            this.context = null;
        }
    }

    // OrbitControls (simplified)
    class OrbitControls {
        constructor(camera, domElement) {
            this.camera = camera;
            this.domElement = domElement;
            this.enabled = true;
            this.enableDamping = false;
            this.dampingFactor = 0.05;
            this.enableZoom = true;
            this.zoomSpeed = 1.0;
            this.minDistance = 0;
            this.maxDistance = Infinity;

            // Simple mouse interaction
            let isDragging = false;
            let previousMousePosition = { x: 0, y: 0 };

            domElement.addEventListener('mousedown', (e) => {
                isDragging = true;
                previousMousePosition = { x: e.clientX, y: e.clientY };
            });

            domElement.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const deltaX = e.clientX - previousMousePosition.x;
                    const deltaY = e.clientY - previousMousePosition.y;
                    camera.position.x += deltaX * 0.1;
                    camera.position.y -= deltaY * 0.1;
                    previousMousePosition = { x: e.clientX, y: e.clientY };
                }
            });

            domElement.addEventListener('mouseup', () => {
                isDragging = false;
            });

            domElement.addEventListener('wheel', (e) => {
                if (this.enableZoom) {
                    e.preventDefault();
                    camera.position.z += e.deltaY * 0.01 * this.zoomSpeed;
                    camera.position.z = Math.max(this.minDistance, Math.min(this.maxDistance, camera.position.z));
                }
            });
        }

        update() {
            // Animation frame update
        }
    }

    // Export THREE namespace
    global.THREE = {
        Vector3,
        Color,
        Material,
        MeshStandardMaterial,
        BoxGeometry,
        Object3D,
        Mesh,
        Group,
        Scene,
        Light,
        AmbientLight,
        DirectionalLight,
        PerspectiveCamera,
        WebGLRenderer,
        OrbitControls
    };

})(window);
