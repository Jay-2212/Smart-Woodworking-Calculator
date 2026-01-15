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

            // Draw a simple 3D representation
            ctx.save();
            ctx.translate(width / 2, height / 2);

            // Draw all meshes in the scene
            this.renderObject(scene, ctx, camera);

            ctx.restore();
        }

        renderObject(object, ctx, camera) {
            if (object instanceof Mesh && object.geometry instanceof BoxGeometry) {
                const geo = object.geometry;
                const mat = object.material;

                // Simple isometric projection
                const x = object.position.x * 8;
                const y = object.position.y * 8;
                const z = object.position.z * 8;

                const w = geo.width * 8;
                const h = geo.height * 8;
                const d = geo.depth * 8;

                // Draw box in isometric view
                ctx.fillStyle = mat.color.getStyle();
                ctx.globalAlpha = 0.8;

                // Front face
                ctx.fillRect(x - w/2, y - h/2 - z, w, h);
                
                // Top face (darker)
                ctx.fillStyle = this.adjustBrightness(mat.color.getStyle(), -20);
                ctx.beginPath();
                ctx.moveTo(x - w/2, y - h/2 - z);
                ctx.lineTo(x, y - h/2 - z - d/2);
                ctx.lineTo(x + w/2, y - h/2 - z);
                ctx.lineTo(x - w/2, y - h/2 - z);
                ctx.fill();

                // Right face (lighter)
                ctx.fillStyle = this.adjustBrightness(mat.color.getStyle(), 10);
                ctx.beginPath();
                ctx.moveTo(x + w/2, y - h/2 - z);
                ctx.lineTo(x + w/2, y + h/2 - z);
                ctx.lineTo(x + w/2 + d/3, y + h/2 - z + d/3);
                ctx.lineTo(x + w/2 + d/3, y - h/2 - z + d/3);
                ctx.fill();

                ctx.globalAlpha = 1.0;
            }

            // Render children
            object.children.forEach(child => {
                this.renderObject(child, ctx, camera);
            });
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
