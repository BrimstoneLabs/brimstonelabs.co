/**
 * 3D Globe module
 * Handles Three.js globe with animated connections
 */

export class GlobeManager {
    constructor(containerId = 'globe-container') {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.globeGroup = null;
        this.animationId = null;
        this.dynamicPoints = [];
        this.connectionId = 0;
        this.particlePositions = null;
        this.lastTime = 0;
        this.pointSpawnTimer = 0;
        this.pointSpawnInterval = this.isMobile ? 2.5 : 1.2;
        this.maxDynamicPoints = this.isMobile ? 3 : 10;
        this.threeLoaded = false;
        
        // Performance settings
        this.isMobile = window.innerWidth < 768;
        this.isLowEndDevice = this.detectLowEndDevice();
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.frameSkip = 0;
        this.targetFPS = this.isMobile ? 30 : 60;
        this.fpsHistory = [];
        this.adaptiveQuality = true;
        
        this.init();
    }
    
    detectLowEndDevice() {
        // Check for low-end device indicators
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return true;
        
        // Check max texture size (low-end devices typically have smaller limits)
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        
        // Check device memory if available
        const deviceMemory = navigator.deviceMemory || 4;
        
        // Check hardware concurrency (CPU cores)
        const cores = navigator.hardwareConcurrency || 4;
        
        // More aggressive detection for performance
        return maxTextureSize < 4096 || deviceMemory < 4 || cores < 4;
    }
    
    async init() {
        // Don't initialize on mobile at all
        if (this.isMobile || this.prefersReducedMotion || this.isLowEndDevice) {
            return;
        }
        
        // Lazy load Three.js
        if (typeof THREE === 'undefined') {
            try {
                await this.loadThreeJS();
            } catch (error) {
                console.error('Failed to load Three.js:', error);
                return;
            }
        }
        
        try {
            this.setupScene();
            this.createGlobe();
            this.startAnimation();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize globe:', error);
            if (this.container) {
                this.container.style.display = 'none';
            }
        }
    }
    
    loadThreeJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.async = true;
            script.onload = () => {
                this.threeLoaded = true;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2000);
        
        const maxSize = window.innerHeight * 1.2;
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: !this.isMobile,
            powerPreference: this.isMobile ? 'low-power' : 'high-performance',
            precision: this.isMobile ? 'lowp' : 'highp'
        });
        this.renderer.setSize(maxSize, maxSize);
        this.renderer.setPixelRatio(this.isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        
        this.camera.position.set(0, 0, 1000);
        
        this.globeGroup = new THREE.Group();
        this.globeGroup.rotation.x = 0.3;
        this.scene.add(this.globeGroup);
    }
    
    createGlobe() {
        // Reduce geometry complexity on mobile
        const segments = this.isMobile ? 24 : 32;
        const rings = this.isMobile ? 12 : 16;
        const sphereGeometry = new THREE.SphereGeometry(532, segments, rings);
        
        // Lower opacity on mobile in dark mode
        const baseOpacity = this.isMobile ? 0.03 : 0.08;
        
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xf97316,
            wireframe: true,
            transparent: true,
            opacity: baseOpacity
        });
        
        const wireframeSphere = new THREE.Mesh(sphereGeometry, wireframeMaterial);
        this.globeGroup.add(wireframeSphere);
        
        this.createParticles();
        this.setupLighting();
    }
    
    createParticles() {
        // Reduce particle count on mobile
        const particleCount = this.isMobile ? 60 : 120;
        const particlePositions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            
            const radius = 532;
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            particlePositions[i * 3] = x;
            particlePositions[i * 3 + 1] = y;
            particlePositions[i * 3 + 2] = z;
        }
        
        this.particlePositions = particlePositions;
    }
    
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(-300, -300, 400);
        this.scene.add(directionalLight);
    }
    
    createDynamicConnection() {
        const particleCount = this.particlePositions.length / 3;
        const startParticleIndex = Math.floor(Math.random() * particleCount);
        const startX = this.particlePositions[startParticleIndex * 3];
        const startY = this.particlePositions[startParticleIndex * 3 + 1];
        const startZ = this.particlePositions[startParticleIndex * 3 + 2];
        
        const connectionLines = [];
        const connectionMaterials = [];
        const connectionSpheres = [];
        const connectionSphereMaterials = [];
        const connectionPoints = [];
        
        // Reduce connection complexity on mobile
        const maxConnections = this.isMobile ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 3) + 3;
        let currentPos = { x: startX, y: startY, z: startZ };
        let currentParticleIndex = startParticleIndex;
        
        for (let i = 0; i < maxConnections; i++) {
            const nearbyParticles = [];
            for (let j = 0; j < particleCount; j++) {
                if (j === currentParticleIndex) continue;
                
                const px = this.particlePositions[j * 3];
                const py = this.particlePositions[j * 3 + 1];
                const pz = this.particlePositions[j * 3 + 2];
                
                const distance = Math.sqrt(
                    Math.pow(currentPos.x - px, 2) + 
                    Math.pow(currentPos.y - py, 2) + 
                    Math.pow(currentPos.z - pz, 2)
                );
                
                if (distance < 250) {
                    nearbyParticles.push({ index: j, distance: distance, pos: [px, py, pz] });
                }
            }
            
            if (nearbyParticles.length === 0) break;
            
            const nextParticle = nearbyParticles[Math.floor(Math.random() * nearbyParticles.length)];
            const nextPos = { x: nextParticle.pos[0], y: nextParticle.pos[1], z: nextParticle.pos[2] };
            
            const { line, lineMat, sphere, sphereMat } = this.createConnectionElements(currentPos, nextPos, i);
            
            connectionLines.push(line);
            connectionMaterials.push(lineMat);
            connectionSpheres.push(sphere);
            connectionSphereMaterials.push(sphereMat);
            connectionPoints.push({
                start: { ...currentPos },
                end: { ...nextPos },
                startIndex: currentParticleIndex,
                endIndex: nextParticle.index
            });
            
            currentPos = nextPos;
            currentParticleIndex = nextParticle.index;
        }
        
        const dynamicConnection = {
            id: this.connectionId++,
            connections: connectionLines,
            connectionMaterials: connectionMaterials,
            connectionSpheres: connectionSpheres,
            connectionSphereMaterials: connectionSphereMaterials,
            connectionPoints: connectionPoints,
            life: 0,
            maxLife: 5 + Math.random() * 3,
            fadeInDuration: 0.3,
            fadeOutDuration: 0.5,
            growthDuration: 0.6
        };
        
        this.dynamicPoints.push(dynamicConnection);
        return dynamicConnection;
    }
    
    createConnectionElements(startPos, endPos, connectionIndex) {
        const startPosVec = new THREE.Vector3(startPos.x, startPos.y, startPos.z);
        const endPosVec = new THREE.Vector3(endPos.x, endPos.y, endPos.z);
        
        const arcPoints = [];
        const segments = this.isMobile ? 10 : 20;
        
        for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            const lerpPos = new THREE.Vector3().lerpVectors(startPosVec, endPosVec, t);
            const sphereRadius = 542;
            lerpPos.normalize().multiplyScalar(sphereRadius);
            arcPoints.push(lerpPos);
        }
        
        const curve = new THREE.CatmullRomCurve3(arcPoints);
        const fullPoints = curve.getPoints(this.isMobile ? 20 : 40);
        
        const lineGeom = new THREE.BufferGeometry().setFromPoints([fullPoints[0], fullPoints[0]]);
        const lineMat = new THREE.LineBasicMaterial({
            color: new THREE.Color(1, 0.8, 0.2),
            transparent: true,
            opacity: 0
        });
        
        const line = new THREE.Line(lineGeom, lineMat);
        line.userData = {
            fullPoints: fullPoints,
            connectionIndex: connectionIndex,
            animationDelay: 0,
            isActive: connectionIndex === 0
        };
        this.globeGroup.add(line);
        
        const sphereGeom = new THREE.SphereGeometry(1.5, 8, 8);
        const sphereMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(1, 1, 0.3),
            transparent: true,
            opacity: 0
        });
        const sphere = new THREE.Mesh(sphereGeom, sphereMat);
        sphere.position.copy(arcPoints[0]);
        this.globeGroup.add(sphere);
        
        return { line, lineMat, sphere, sphereMat };
    }
    
    updateDynamicPoints(deltaTime) {
        for (let i = this.dynamicPoints.length - 1; i >= 0; i--) {
            const connection = this.dynamicPoints[i];
            connection.life += deltaTime;
            
            let opacity = 0;
            
            if (connection.life < connection.fadeInDuration) {
                opacity = connection.life / connection.fadeInDuration;
            } else if (connection.life < connection.maxLife - connection.fadeOutDuration) {
                opacity = 1;
            } else if (connection.life < connection.maxLife) {
                const fadeProgress = (connection.maxLife - connection.life) / connection.fadeOutDuration;
                opacity = fadeProgress;
            } else {
                connection.connections.forEach(line => this.globeGroup.remove(line));
                connection.connectionSpheres.forEach(sphere => this.globeGroup.remove(sphere));
                if (connection.endSphere) {
                    this.globeGroup.remove(connection.endSphere);
                }
                this.dynamicPoints.splice(i, 1);
                continue;
            }
            
            this.updateConnectionElements(connection, opacity);
        }
    }
    
    updateConnectionElements(connection, opacity) {
        connection.connections.forEach((line, connectionIndex) => {
            if (line.userData.isActive) {
                const connectionAge = connection.life - line.userData.animationDelay;
                
                if (connectionAge > 0) {
                    const sphereOpacity = Math.min(1, connectionAge / 0.2) * opacity;
                    connection.connectionSphereMaterials[connectionIndex].opacity = sphereOpacity;
                    
                    const growthProgress = Math.min(1, connectionAge / connection.growthDuration);
                    const fullPoints = line.userData.fullPoints;
                    const currentPointCount = Math.floor(growthProgress * fullPoints.length);
                    
                    if (currentPointCount > 1) {
                        const currentPoints = fullPoints.slice(0, currentPointCount);
                        line.geometry.setFromPoints(currentPoints);
                        connection.connectionMaterials[connectionIndex].opacity = opacity * 0.8;
                        
                        if (growthProgress >= 1.0) {
                            const nextIndex = connectionIndex + 1;
                            if (nextIndex < connection.connections.length) {
                                const nextLine = connection.connections[nextIndex];
                                if (!nextLine.userData.isActive) {
                                    nextLine.userData.isActive = true;
                                    nextLine.userData.animationDelay = connection.life;
                                }
                            } else if (!line.userData.endPointCreated) {
                                this.createEndSphere(connection, line, fullPoints, opacity);
                            }
                        }
                    }
                } else {
                    connection.connectionSphereMaterials[connectionIndex].opacity = opacity * 0.5;
                    connection.connectionMaterials[connectionIndex].opacity = 0;
                }
            } else {
                connection.connectionMaterials[connectionIndex].opacity = 0;
                connection.connectionSphereMaterials[connectionIndex].opacity = 0;
            }
        });
        
        if (connection.endSphere && connection.endSphereMaterial) {
            connection.endSphereMaterial.opacity = opacity;
        }
    }
    
    createEndSphere(connection, line, fullPoints, opacity) {
        const endSphereGeom = new THREE.SphereGeometry(2, 8, 8);
        const endSphereMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(1, 0.9, 0.4),
            transparent: true,
            opacity: opacity
        });
        const endSphere = new THREE.Mesh(endSphereGeom, endSphereMat);
        endSphere.position.copy(fullPoints[fullPoints.length - 1]);
        this.globeGroup.add(endSphere);
        
        connection.endSphere = endSphere;
        connection.endSphereMaterial = endSphereMat;
        line.userData.endPointCreated = true;
    }
    
    startAnimation() {
        let targetRotationY = 0;
        let currentRotationY = 0;
        
        const animate = (currentTime) => {
            this.animationId = requestAnimationFrame(animate);
            
            // FPS monitoring and frame skipping for mobile
            const deltaTime = (currentTime - this.lastTime) / 1000;
            const fps = 1 / deltaTime;
            
            if (this.isMobile && this.adaptiveQuality) {
                this.fpsHistory.push(fps);
                if (this.fpsHistory.length > 30) {
                    this.fpsHistory.shift();
                }
                
                // Skip frames on mobile if performance is poor
                if (this.fpsHistory.length > 10) {
                    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
                    if (avgFPS < 25) {
                        this.frameSkip++;
                        if (this.frameSkip % 2 === 0) {
                            this.lastTime = currentTime;
                            return;
                        }
                    } else {
                        this.frameSkip = 0;
                    }
                }
            }
            
            this.lastTime = currentTime;
            
            // Slower rotation on mobile for better performance
            targetRotationY += this.isMobile ? 0.001 : 0.0015;
            currentRotationY = targetRotationY;
            this.globeGroup.rotation.y = currentRotationY;
            
            this.updateDynamicPoints(deltaTime);
            
            this.pointSpawnTimer += deltaTime;
            if (this.pointSpawnTimer >= this.pointSpawnInterval && this.dynamicPoints.length < this.maxDynamicPoints) {
                this.createDynamicConnection();
                this.pointSpawnTimer = 0;
            }
            
            this.renderer.render(this.scene, this.camera);
        };
        
        animate(0);
    }
    
    setupEventListeners() {
        const handleResize = () => {
            const newMaxSize = window.innerHeight * 1.2;
            if (this.renderer) {
                this.renderer.setSize(newMaxSize, newMaxSize);
                // Update mobile detection on resize
                this.isMobile = window.innerWidth < 768;
                // Adjust quality settings based on new viewport
                this.renderer.setPixelRatio(this.isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
            }
        };
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 250);
        });
        
        window.addEventListener('beforeunload', () => this.destroy());
        
        // Pause animation when tab is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.animationId) {
                    cancelAnimationFrame(this.animationId);
                    this.animationId = null;
                }
            } else {
                if (!this.animationId) {
                    this.startAnimation();
                }
            }
        });
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.scene?.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        this.renderer?.dispose();
        
        if (this.container && this.renderer) {
            this.container.removeChild(this.renderer.domElement);
        }
    }
}