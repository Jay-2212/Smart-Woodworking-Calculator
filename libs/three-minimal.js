/**
 * Minimal Three.js implementation for Smart Woodworking Calculator
 * This is a lightweight alternative that provides basic 3D rendering using Canvas 2D
 * It implements only the Three.js API features used by this specific app
 * 
 * Features:
 * - Interactive rotation via mouse/touch drag
 * - Zoom via mouse wheel or pinch gesture
 * - Proper 3D box rendering with all visible faces
 * - Depth-sorted rendering (painter's algorithm)
 */

(function(global) {
    'use strict';

    // ================================================================================
    // CONSTANTS
    // ================================================================================
    
    // Threshold for back-face culling to avoid z-fighting artifacts
    // Using a lenient threshold (-0.5) to prevent thin runners from disappearing
    // at glancing angles during rotation
    const BACKFACE_CULL_THRESHOLD = -0.3;
    
    // Threshold for damping velocity cutoff
    const DAMPING_VELOCITY_THRESHOLD = 0.0001;
    
    // Maximum rotation angle limits (radians) to prevent flipping
    const MAX_PITCH = Math.PI / 2 - 0.1;
    const MIN_PITCH = -Math.PI / 2 + 0.1;

    // Depth sort epsilon prevents face order flicker when depths are nearly identical.
    // Using 0.6 scene units to ensure runners (renderOrder=1) appear in front of
    // nearby panel faces (renderOrder=0) during rotation at various angles, while
    // still allowing legitimate depth differences to be respected.
    const DEPTH_SORT_EPSILON = 0.6;
    const DEFAULT_RENDER_ORDER_VALUE = 0;

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
            if (color !== undefined) {
                this.setHex(color);
            }
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

    // Camera class - Using orthographic projection for static box visualization
    class PerspectiveCamera extends Object3D {
        constructor(fov, aspect, near, far) {
            super();
            this.fov = fov;
            this.aspect = aspect;
            this.near = near;
            this.far = far;
            // Rotation angles for orbit control (in radians)
            this.rotationX = Math.PI / 6;  // Vertical angle (pitch) - looking down
            this.rotationY = Math.PI / 4;  // Horizontal angle (yaw) - 45 degrees
            this.distance = 150;           // Distance from origin (used as scale factor for orthographic)
            this.useOrthographic = true;   // Use orthographic projection for static box visualization
        }
    }

    // WebGL Renderer (using Canvas 2D with proper 3D projection)
    class WebGLRenderer {
        constructor(params = {}) {
            this.domElement = document.createElement('canvas');
            this.context = this.domElement.getContext('2d');
            this.shadowMap = { enabled: false };
            this.width = 400;
            this.height = 400;
        }

        setSize(width, height) {
            this.width = width;
            this.height = height;
            // Use device pixel ratio for sharper rendering
            const dpr = window.devicePixelRatio || 1;
            this.domElement.width = width * dpr;
            this.domElement.height = height * dpr;
            this.domElement.style.width = width + 'px';
            this.domElement.style.height = height + 'px';
            this.context.scale(dpr, dpr);
        }

        render(scene, camera) {
            const ctx = this.context;
            const width = this.width;
            const height = this.height;
            const dpr = window.devicePixelRatio || 1;

            // Reset transform for clearing (use stored dpr)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            
            // Clear canvas
            ctx.fillStyle = scene.background.getStyle();
            ctx.fillRect(0, 0, width, height);

            // Collect all meshes
            const meshes = [];
            this.collectMeshes(scene, meshes);

            // Create faces array for all visible faces of all meshes
            const allFaces = [];

            meshes.forEach(mesh => {
                const faces = this.getMeshFaces(mesh, camera);
                allFaces.push(...faces);
            });

            allFaces.forEach((face, index) => {
                face.sortIndex = index;
            });

            // Sort faces by depth (painter's algorithm - draw furthest first)
            allFaces.sort((a, b) => {
                const depthDiff = a.depth - b.depth;
                if (Math.abs(depthDiff) > DEPTH_SORT_EPSILON) {
                    return depthDiff;
                }
                if (a.renderOrder !== b.renderOrder) {
                    return a.renderOrder - b.renderOrder;
                }
                return a.sortIndex - b.sortIndex;
            });

            // Draw each face
            ctx.save();
            ctx.translate(width / 2, height / 2 + 30);

            allFaces.forEach(face => {
                this.drawFace(ctx, face);
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

        // Get all visible faces of a mesh with their projected coordinates
        getMeshFaces(mesh, camera) {
            const geo = mesh.geometry;
            const mat = mesh.material;

            // Use orthographic projection for static box visualization
            // The box will appear the same size regardless of rotation (no FOV distortion)
            const useOrthographic = camera.useOrthographic !== false;

            // Use camera distance as scale factor for orthographic projection
            const cameraDistance = camera.distance || 150;

            // Base scale for the projection (adjusts overall size)
            // For orthographic: use a fixed scale based on viewport and distance
            const orthographicScale = this.height / (cameraDistance * 0.7);

            // Get camera rotation angles
            const rotX = camera.rotationX;
            const rotY = camera.rotationY;

            // Get position and dimensions
            const px = mesh.position.x;
            const py = mesh.position.y;
            const pz = mesh.position.z;

            const hw = geo.width / 2;   // half width (X axis)
            const hh = geo.height / 2;  // half height (Y axis)
            const hd = geo.depth / 2;   // half depth (Z axis)

            // 8 corners of the box in local coordinates
            const localCorners = [
                { x: -hw, y: -hh, z: -hd }, // 0: front-bottom-left
                { x:  hw, y: -hh, z: -hd }, // 1: front-bottom-right
                { x:  hw, y:  hh, z: -hd }, // 2: front-top-right
                { x: -hw, y:  hh, z: -hd }, // 3: front-top-left
                { x: -hw, y: -hh, z:  hd }, // 4: back-bottom-left
                { x:  hw, y: -hh, z:  hd }, // 5: back-bottom-right
                { x:  hw, y:  hh, z:  hd }, // 6: back-top-right
                { x: -hw, y:  hh, z:  hd }  // 7: back-top-left
            ];

            // Transform corners to world space and then to screen space
            const transformedCorners = localCorners.map(corner => {
                // Add mesh position
                let x = corner.x + px;
                let y = corner.y + py;
                let z = corner.z + pz;

                // Rotate around Y axis (horizontal rotation)
                const cosY = Math.cos(rotY);
                const sinY = Math.sin(rotY);
                const x1 = x * cosY - z * sinY;
                const z1 = x * sinY + z * cosY;

                // Rotate around X axis (vertical rotation - pitch)
                const cosX = Math.cos(rotX);
                const sinX = Math.sin(rotX);
                const y1 = y * cosX - z1 * sinX;
                const z2 = y * sinX + z1 * cosX;

                // Apply orthographic projection (no perspective distortion)
                // Box dimensions stay constant regardless of rotation
                const screenX = x1 * orthographicScale;
                const screenY = -y1 * orthographicScale;  // Flip Y for screen coordinates

                return { x: screenX, y: screenY, z: z2 };
            });

            // Define the 6 faces with their corner indices and normal directions
            const faceDefinitions = [
                { corners: [3, 2, 6, 7], normal: { x: 0, y: 1, z: 0 }, brightness: 40 },   // Top (Y+)
                { corners: [0, 1, 5, 4], normal: { x: 0, y: -1, z: 0 }, brightness: -30 }, // Bottom (Y-)
                { corners: [0, 3, 7, 4], normal: { x: -1, y: 0, z: 0 }, brightness: -10 }, // Left (X-)
                { corners: [1, 2, 6, 5], normal: { x: 1, y: 0, z: 0 }, brightness: -20 },  // Right (X+)
                { corners: [0, 1, 2, 3], normal: { x: 0, y: 0, z: -1 }, brightness: 0 },   // Front (Z-)
                { corners: [4, 5, 6, 7], normal: { x: 0, y: 0, z: 1 }, brightness: -25 }   // Back (Z+)
            ];

            const faces = [];
            const baseColor = mat.color.getStyle();
            const renderOrder = mesh.renderOrder ?? DEFAULT_RENDER_ORDER_VALUE;

            faceDefinitions.forEach(faceDef => {
                // Transform normal vector to check visibility
                let nx = faceDef.normal.x;
                let ny = faceDef.normal.y;
                let nz = faceDef.normal.z;

                // Rotate normal around Y axis
                const cosY = Math.cos(rotY);
                const sinY = Math.sin(rotY);
                const nx1 = nx * cosY - nz * sinY;
                const nz1 = nx * sinY + nz * cosY;

                // Rotate normal around X axis
                const cosX = Math.cos(rotX);
                const sinX = Math.sin(rotX);
                const nz2 = ny * sinX + nz1 * cosX;

                // Face is visible if normal points toward camera (positive Z after rotation)
                // Uses BACKFACE_CULL_THRESHOLD to avoid z-fighting artifacts
                if (nz2 > BACKFACE_CULL_THRESHOLD) {
                    const faceCorners = faceDef.corners.map(i => transformedCorners[i]);
                    
                    // Calculate average depth for sorting
                    const avgDepth = faceCorners.reduce((sum, c) => sum + c.z, 0) / 4;

                    faces.push({
                        corners: faceCorners,
                        color: this.adjustBrightness(baseColor, faceDef.brightness),
                        depth: avgDepth,
                        strokeColor: this.adjustBrightness(baseColor, -50),
                        renderOrder
                    });
                }
            });

            return faces;
        }

        drawFace(ctx, face) {
            ctx.fillStyle = face.color;
            ctx.strokeStyle = face.strokeColor;
            ctx.lineWidth = 0.5;

            ctx.beginPath();
            ctx.moveTo(face.corners[0].x, face.corners[0].y);
            for (let i = 1; i < face.corners.length; i++) {
                ctx.lineTo(face.corners[i].x, face.corners[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        adjustBrightness(color, amount) {
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
            this.context = null;
        }
    }

    // OrbitControls - enables interactive rotation and zoom
    class OrbitControls {
        constructor(camera, domElement) {
            this.camera = camera;
            this.domElement = domElement;
            this.enabled = true;
            this.enableDamping = true;
            this.dampingFactor = 0.05;
            this.enableZoom = true;
            this.zoomSpeed = 1.0;
            this.minDistance = 50;
            this.maxDistance = 300;

            // Rotation velocity for smooth damping
            this.rotationVelocityX = 0;
            this.rotationVelocityY = 0;

            // Mouse/touch state
            let isDragging = false;
            let previousPosition = { x: 0, y: 0 };

            // Helper function to clamp camera pitch angle
            const clampPitch = () => {
                camera.rotationX = Math.max(MIN_PITCH, Math.min(MAX_PITCH, camera.rotationX));
            };

            // Mouse events
            const onMouseDown = (e) => {
                isDragging = true;
                previousPosition = { x: e.clientX, y: e.clientY };
                this.rotationVelocityX = 0;
                this.rotationVelocityY = 0;
            };

            const onMouseMove = (e) => {
                if (isDragging && this.enabled) {
                    const deltaX = e.clientX - previousPosition.x;
                    const deltaY = e.clientY - previousPosition.y;
                    
                    // Update rotation based on mouse movement
                    camera.rotationY += deltaX * 0.01;
                    camera.rotationX += deltaY * 0.01;
                    
                    // Clamp vertical rotation to avoid flipping
                    clampPitch();
                    
                    // Store velocity for damping
                    this.rotationVelocityY = deltaX * 0.01;
                    this.rotationVelocityX = deltaY * 0.01;
                    
                    previousPosition = { x: e.clientX, y: e.clientY };
                }
            };

            const onMouseUp = () => {
                isDragging = false;
            };

            const onMouseLeave = () => {
                isDragging = false;
            };

            // Touch events for mobile
            const onTouchStart = (e) => {
                if (e.touches.length === 1) {
                    isDragging = true;
                    previousPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    this.rotationVelocityX = 0;
                    this.rotationVelocityY = 0;
                }
            };

            const onTouchMove = (e) => {
                if (isDragging && this.enabled && e.touches.length === 1) {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const deltaX = touch.clientX - previousPosition.x;
                    const deltaY = touch.clientY - previousPosition.y;
                    
                    camera.rotationY += deltaX * 0.01;
                    camera.rotationX += deltaY * 0.01;
                    clampPitch();
                    
                    this.rotationVelocityY = deltaX * 0.01;
                    this.rotationVelocityX = deltaY * 0.01;
                    
                    previousPosition = { x: touch.clientX, y: touch.clientY };
                }
            };

            const onTouchEnd = () => {
                isDragging = false;
            };

            // Wheel event for zoom
            const onWheel = (e) => {
                if (this.enableZoom && this.enabled) {
                    e.preventDefault();
                    camera.distance += e.deltaY * 0.5 * this.zoomSpeed;
                    camera.distance = Math.max(this.minDistance, Math.min(this.maxDistance, camera.distance));
                }
            };

            // Attach event listeners
            domElement.addEventListener('mousedown', onMouseDown);
            domElement.addEventListener('mousemove', onMouseMove);
            domElement.addEventListener('mouseup', onMouseUp);
            domElement.addEventListener('mouseleave', onMouseLeave);
            domElement.addEventListener('touchstart', onTouchStart, { passive: false });
            domElement.addEventListener('touchmove', onTouchMove, { passive: false });
            domElement.addEventListener('touchend', onTouchEnd);
            domElement.addEventListener('wheel', onWheel, { passive: false });

            // Store reference for cleanup
            this._cleanup = () => {
                domElement.removeEventListener('mousedown', onMouseDown);
                domElement.removeEventListener('mousemove', onMouseMove);
                domElement.removeEventListener('mouseup', onMouseUp);
                domElement.removeEventListener('mouseleave', onMouseLeave);
                domElement.removeEventListener('touchstart', onTouchStart);
                domElement.removeEventListener('touchmove', onTouchMove);
                domElement.removeEventListener('touchend', onTouchEnd);
                domElement.removeEventListener('wheel', onWheel);
            };
        }

        update() {
            // Apply damping to rotation velocity
            if (this.enableDamping) {
                if (Math.abs(this.rotationVelocityX) > DAMPING_VELOCITY_THRESHOLD) {
                    this.rotationVelocityX *= (1 - this.dampingFactor);
                } else {
                    this.rotationVelocityX = 0;
                }
                if (Math.abs(this.rotationVelocityY) > DAMPING_VELOCITY_THRESHOLD) {
                    this.rotationVelocityY *= (1 - this.dampingFactor);
                } else {
                    this.rotationVelocityY = 0;
                }
            }
        }

        dispose() {
            if (this._cleanup) {
                this._cleanup();
            }
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
        OrbitControls,
        DEFAULT_RENDER_ORDER: DEFAULT_RENDER_ORDER_VALUE
    };

})(window);
