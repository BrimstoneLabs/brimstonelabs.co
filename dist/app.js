/* BrimstoneLabs Website - Built with esbuild */
var BrimstoneApp = (() => {
  // src/js/theme.js
  var ThemeManager = class {
    constructor() {
      this.themeToggle = document.getElementById("theme-toggle");
      this.moonIcon = document.getElementById("moon-icon");
      this.sunIcon = document.getElementById("sun-icon");
      this.html = document.documentElement;
      this.init();
    }
    init() {
      const currentTheme = localStorage.getItem("theme") || "dark";
      this.setTheme(currentTheme);
      if (this.themeToggle) {
        this.themeToggle.addEventListener("click", () => this.toggleTheme());
        this.themeToggle.setAttribute("aria-label", "Toggle theme");
        this.themeToggle.setAttribute("aria-pressed", currentTheme === "light");
      }
    }
    setTheme(theme) {
      if (theme === "light") {
        this.html.classList.add("light");
        this.moonIcon?.classList.add("hidden");
        this.sunIcon?.classList.remove("hidden");
      } else {
        this.html.classList.remove("light");
        this.moonIcon?.classList.remove("hidden");
        this.sunIcon?.classList.add("hidden");
      }
      localStorage.setItem("theme", theme);
      if (this.themeToggle) {
        this.themeToggle.setAttribute("aria-pressed", theme === "light");
      }
    }
    toggleTheme() {
      const currentTheme = this.html.classList.contains("light") ? "light" : "dark";
      const newTheme = currentTheme === "light" ? "dark" : "light";
      this.setTheme(newTheme);
    }
    getCurrentTheme() {
      return this.html.classList.contains("light") ? "light" : "dark";
    }
  };

  // src/js/animations.js
  var AnimationManager = class {
    constructor() {
      this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.splitCompleted = 0;
      this.showContentCallback = null;
      this.lenis = null;
      this.init();
    }
    init() {
      if (this.prefersReducedMotion) {
        this.showContentImmediately();
        return;
      }
      gsap.registerPlugin(ScrollTrigger);
      this.initLenis();
      this.initTextAnimations();
      this.initScrollAnimations();
      this.initFeatureCards();
      this.showContentCallback = this.showContent.bind(this);
      setTimeout(() => ScrollTrigger.refresh(), 100);
    }
    initLenis() {
      const isMobile = window.innerWidth < 768;
      if (isMobile)
        return;
      if (typeof Lenis === "undefined") {
        console.warn("Lenis not available, falling back to native scroll");
        return;
      }
      this.lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: "vertical",
        gestureDirection: "vertical",
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false
      });
      this.lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => {
        this.lenis.raf(time * 1e3);
      });
      gsap.ticker.lagSmoothing(0);
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
          e.preventDefault();
          const target = document.querySelector(anchor.getAttribute("href"));
          if (target && this.lenis) {
            this.lenis.scrollTo(target, {
              offset: -80,
              // Account for fixed header
              duration: 1.5
            });
          }
        });
      });
      let resizeTimer;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (this.lenis) {
            this.lenis.resize();
          }
        }, 250);
      });
    }
    showContentImmediately() {
      document.querySelectorAll(".reveal-type").forEach((el) => {
        el.classList.add("split-ready");
        el.style.opacity = "1";
        el.querySelectorAll("*").forEach((child) => {
          child.style.opacity = "1";
        });
      });
      document.querySelectorAll(".feature-card").forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      this.showContent();
    }
    showContent() {
      document.body.classList.add("loaded");
      const loadingOverlay = document.querySelector(".loading-overlay");
      if (loadingOverlay) {
        loadingOverlay.classList.add("fade-out");
        setTimeout(() => loadingOverlay.remove(), 500);
      }
    }
    initTextAnimations() {
      const splitTypes = document.querySelectorAll(".reveal-type");
      this.splitCompleted = 0;
      if (splitTypes.length === 0) {
        setTimeout(() => this.showContent(), 500);
        return;
      }
      if (typeof SplitType === "undefined" || typeof gsap === "undefined") {
        console.warn("SplitType or GSAP not available, showing content immediately");
        splitTypes.forEach((element) => {
          element.classList.add("split-ready");
          element.style.opacity = "1";
        });
        setTimeout(() => this.showContent(), 200);
        return;
      }
      splitTypes.forEach((element, index) => {
        try {
          const splitText = new SplitType(element, {
            types: "words, chars"
          });
          element.classList.add("split-ready");
          this.splitCompleted++;
          if (this.splitCompleted === splitTypes.length) {
            setTimeout(() => this.showContent(), 200);
          }
          const isFirstSection = element.closest("section")?.classList.contains("relative");
          const isFastReveal = element.dataset.revealSpeed === "fast";
          const animationDuration = isFastReveal ? 0.2 : isFirstSection ? 0.4 : 0.8;
          const animationStagger = isFastReveal ? 0.02 : isFirstSection ? 0.05 : 0.1;
          gsap.set(splitText.chars, { opacity: 0.2 });
          gsap.to(splitText.chars, {
            scrollTrigger: {
              trigger: element,
              start: "top 80%",
              toggleActions: "play none none none",
              markers: false,
              scroller: window
            },
            opacity: 1,
            stagger: animationStagger,
            duration: animationDuration,
            ease: "power2.out"
          });
        } catch (error) {
          console.error("Error initializing text animation for element:", element, error);
          element.classList.add("split-ready");
          element.style.opacity = "1";
          this.splitCompleted++;
          if (this.splitCompleted === splitTypes.length) {
            setTimeout(() => this.showContent(), 200);
          }
        }
      });
    }
    initScrollAnimations() {
      const paragraphs = document.querySelectorAll(
        "p:not(.feature-card p):not(.careers-cta p):not(button p):not(a p):not(footer p)"
      );
      paragraphs.forEach((p) => {
        gsap.set(p, { opacity: 0, y: 30 });
        gsap.to(p, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: p,
            start: "top 85%",
            once: false,
            toggleActions: "play none none none",
            scroller: window
          }
        });
      });
    }
    initFeatureCards() {
      if (typeof gsap === "undefined")
        return;
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        document.querySelectorAll(".feature-card").forEach((card) => {
          card.style.opacity = "1";
          card.style.transform = "none";
        });
        const careersCta2 = document.querySelector(".careers-cta");
        if (careersCta2) {
          careersCta2.style.opacity = "1";
          careersCta2.style.transform = "none";
        }
        return;
      }
      this.initFounderCards();
      const careerCards = document.querySelectorAll("#careers .feature-card");
      careerCards.forEach((card, index) => {
        gsap.set(card, { opacity: 0, y: 50 });
        gsap.to(card, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: index * 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            once: false,
            toggleActions: "play none none none",
            scroller: window
          }
        });
      });
      const careersCta = document.querySelector(".careers-cta");
      if (careersCta) {
        gsap.set(careersCta, { opacity: 0, y: 50 });
        gsap.to(careersCta, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 1.2,
          // After the 3 career cards
          ease: "power2.out",
          scrollTrigger: {
            trigger: careerCards[0] || careersCta,
            start: "top 85%",
            once: false,
            toggleActions: "play none none none",
            scroller: window
          }
        });
      }
      const serviceCards = document.querySelectorAll("#services .feature-card");
      if (serviceCards.length > 0) {
        serviceCards.forEach((card) => {
          gsap.set(card, { opacity: 0, y: 50 });
        });
        gsap.to(serviceCards, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#services",
            start: "top 70%",
            once: false,
            toggleActions: "play none none none",
            scroller: window
          }
        });
      }
      const processSection = document.querySelector("#process");
      if (processSection) {
        const processCards = processSection.querySelectorAll(".feature-card");
        if (processCards.length > 0) {
          processCards.forEach((card) => {
            gsap.set(card, { opacity: 0, y: 50 });
          });
          gsap.to(processCards, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: processSection,
              start: "top 70%",
              once: false,
              toggleActions: "play none none none",
              scroller: window
            }
          });
        }
      }
      const otherCards = document.querySelectorAll(".feature-card:not(#careers .feature-card):not(#services .feature-card):not(#process .feature-card)");
      otherCards.forEach((card, index) => {
        gsap.set(card, { opacity: 0, y: 50 });
        gsap.to(card, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: index * 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            once: false,
            toggleActions: "play none none none",
            scroller: window
          }
        });
      });
    }
    initFounderCards() {
      const founderCards = document.querySelectorAll(".founder-card");
      if (founderCards.length === 0)
        return;
      const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1
      };
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);
      founderCards.forEach((card) => {
        observer.observe(card);
      });
      this.initFounderParallax();
    }
    initFounderParallax() {
      if (typeof gsap === "undefined")
        return;
      const isMobile = window.innerWidth < 768;
      if (isMobile)
        return;
      const founderPhotos = document.querySelectorAll(".founder-card > div:first-child > img");
      founderPhotos.forEach((photo) => {
        gsap.set(photo, {
          scale: 1.2,
          transformOrigin: "center top",
          yPercent: 0
        });
        gsap.fromTo(
          photo,
          {
            yPercent: 0
          },
          {
            yPercent: -15,
            ease: "none",
            scrollTrigger: {
              trigger: photo.closest(".founder-card"),
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
              invalidateOnRefresh: true
            }
          }
        );
      });
    }
    destroy() {
      if (this.lenis) {
        this.lenis.destroy();
        this.lenis = null;
      }
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    }
  };

  // src/js/globe.js
  var GlobeManager = class {
    constructor(containerId = "globe-container") {
      this.container = document.getElementById(containerId);
      if (!this.container)
        return;
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
      this.isMobile = window.innerWidth < 768;
      this.isLowEndDevice = this.detectLowEndDevice();
      this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.frameSkip = 0;
      this.targetFPS = this.isMobile ? 30 : 60;
      this.fpsHistory = [];
      this.adaptiveQuality = true;
      this.init();
    }
    detectLowEndDevice() {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl)
        return true;
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const deviceMemory = navigator.deviceMemory || 4;
      const cores = navigator.hardwareConcurrency || 4;
      return maxTextureSize < 4096 || deviceMemory < 4 || cores < 4;
    }
    init() {
      if (this.isMobile || this.prefersReducedMotion || this.isLowEndDevice) {
        return;
      }
      if (typeof THREE === "undefined") {
        console.error("Three.js not available");
        return;
      }
      try {
        this.setupScene();
        this.createGlobe();
        this.startAnimation();
        this.setupEventListeners();
      } catch (error) {
        console.error("Failed to initialize globe:", error);
        if (this.container) {
          this.container.style.display = "none";
        }
      }
    }
    setupScene() {
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2e3);
      const maxSize = window.innerHeight * 1.2;
      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !this.isMobile,
        powerPreference: this.isMobile ? "low-power" : "high-performance",
        precision: this.isMobile ? "lowp" : "highp"
      });
      this.renderer.setSize(maxSize, maxSize);
      this.renderer.setPixelRatio(this.isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0, 0);
      this.container.appendChild(this.renderer.domElement);
      this.camera.position.set(0, 0, 1e3);
      this.globeGroup = new THREE.Group();
      this.globeGroup.rotation.x = 0.3;
      this.scene.add(this.globeGroup);
    }
    createGlobe() {
      const segments = this.isMobile ? 24 : 32;
      const rings = this.isMobile ? 12 : 16;
      const sphereGeometry = new THREE.SphereGeometry(532, segments, rings);
      const baseOpacity = this.isMobile ? 0.03 : 0.08;
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 16347926,
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
      const particleCount = this.isMobile ? 60 : 120;
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const phi = Math.acos(-1 + 2 * i / particleCount);
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
      const ambientLight = new THREE.AmbientLight(4210752, 0.4);
      this.scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(16777215, 0.6);
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
      const maxConnections = this.isMobile ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 3) + 3;
      let currentPos = { x: startX, y: startY, z: startZ };
      let currentParticleIndex = startParticleIndex;
      for (let i = 0; i < maxConnections; i++) {
        const nearbyParticles = [];
        for (let j = 0; j < particleCount; j++) {
          if (j === currentParticleIndex)
            continue;
          const px = this.particlePositions[j * 3];
          const py = this.particlePositions[j * 3 + 1];
          const pz = this.particlePositions[j * 3 + 2];
          const distance = Math.sqrt(
            Math.pow(currentPos.x - px, 2) + Math.pow(currentPos.y - py, 2) + Math.pow(currentPos.z - pz, 2)
          );
          if (distance < 250) {
            nearbyParticles.push({ index: j, distance, pos: [px, py, pz] });
          }
        }
        if (nearbyParticles.length === 0)
          break;
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
        connectionMaterials,
        connectionSpheres,
        connectionSphereMaterials,
        connectionPoints,
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
        fullPoints,
        connectionIndex,
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
          connection.connections.forEach((line) => this.globeGroup.remove(line));
          connection.connectionSpheres.forEach((sphere) => this.globeGroup.remove(sphere));
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
              if (growthProgress >= 1) {
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
        opacity
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
        const deltaTime = (currentTime - this.lastTime) / 1e3;
        const fps = 1 / deltaTime;
        if (this.isMobile && this.adaptiveQuality) {
          this.fpsHistory.push(fps);
          if (this.fpsHistory.length > 30) {
            this.fpsHistory.shift();
          }
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
        targetRotationY += this.isMobile ? 1e-3 : 15e-4;
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
          this.isMobile = window.innerWidth < 768;
          this.renderer.setPixelRatio(this.isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
        }
      };
      let resizeTimeout;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 250);
      });
      window.addEventListener("beforeunload", () => this.destroy());
      document.addEventListener("visibilitychange", () => {
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
        if (object.geometry)
          object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
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
  };

  // src/js/main.js
  var App = class {
    constructor() {
      this.themeManager = null;
      this.animationManager = null;
      this.globeManager = null;
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.init());
      } else {
        this.init();
      }
    }
    init() {
      this.setupScrollRestoration();
      this.handleLoading();
      this.themeManager = new ThemeManager();
      this.animationManager = new AnimationManager();
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        this.globeManager = new GlobeManager();
      }
      this.setCurrentYear();
      this.setupSmoothScrolling();
      this.setupMobileMenu();
      this.improveAccessibility();
      document.body.style.overflow = "auto";
      window.scrollTo(0, 0);
      if (typeof gsap !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
      }
    }
    handleLoading() {
      const loadingOverlay = document.querySelector(".loading-overlay");
      const maxLoadTime = 3e3;
      let loadingComplete = false;
      const hideLoader = () => {
        if (loadingComplete)
          return;
        loadingComplete = true;
        if (loadingOverlay) {
          loadingOverlay.classList.add("fade-out");
          setTimeout(() => {
            loadingOverlay.style.display = "none";
          }, 500);
        }
        document.body.classList.add("loaded");
      };
      window.addEventListener("load", hideLoader);
      setTimeout(hideLoader, maxLoadTime);
    }
    setupScrollRestoration() {
      if (history.scrollRestoration) {
        history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }
    setCurrentYear() {
      const yearElement = document.getElementById("current-year");
      if (yearElement) {
        yearElement.textContent = (/* @__PURE__ */ new Date()).getFullYear();
        console.log("Year set to:", (/* @__PURE__ */ new Date()).getFullYear());
      } else {
        console.log("current-year element not found");
      }
    }
    setupSmoothScrolling() {
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
          e.preventDefault();
          const target = document.querySelector(anchor.getAttribute("href"));
          if (target) {
            const headerHeight = document.querySelector("header").offsetHeight;
            const targetPosition = target.offsetTop - headerHeight - 20;
            window.scrollTo({
              top: targetPosition,
              behavior: "smooth"
            });
          }
        });
      });
    }
    setupMobileMenu() {
      const mobileMenuButton = document.querySelector('button[onclick*="mobile-menu"]');
      const mobileMenu = document.getElementById("mobile-menu");
      if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.removeAttribute("onclick");
        mobileMenuButton.addEventListener("click", () => {
          const isHidden = mobileMenu.classList.contains("hidden");
          mobileMenu.classList.toggle("hidden");
          mobileMenuButton.setAttribute("aria-expanded", isHidden);
          mobileMenuButton.setAttribute("aria-label", isHidden ? "Close menu" : "Open menu");
        });
        mobileMenu.querySelectorAll("a").forEach((link) => {
          link.addEventListener("click", () => {
            mobileMenu.classList.add("hidden");
            mobileMenuButton.setAttribute("aria-expanded", "false");
          });
        });
      }
    }
    improveAccessibility() {
      const skipLink = document.createElement("a");
      skipLink.href = "#main-content";
      skipLink.className = "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-gray-800 text-white px-4 py-2 rounded z-50";
      skipLink.textContent = "Skip to main content";
      document.body.insertBefore(skipLink, document.body.firstChild);
      const mainSection = document.querySelector("section.relative");
      if (mainSection) {
        mainSection.setAttribute("id", "main-content");
        mainSection.setAttribute("role", "main");
      }
      const nav = document.querySelector("nav");
      if (nav) {
        nav.setAttribute("aria-label", "Main navigation");
      }
      document.querySelectorAll('a[href*="linkedin"]').forEach((link) => {
        link.setAttribute("aria-label", "LinkedIn profile");
      });
      document.querySelectorAll("svg").forEach((svg) => {
        if (!svg.closest("button") && !svg.closest("a")) {
          svg.setAttribute("aria-hidden", "true");
        }
      });
      const partnerLogos = document.querySelectorAll(".partner-logo").forEach((logo, index) => {
        const parent = logo.closest("svg");
        if (parent) {
          parent.setAttribute("role", "img");
          parent.setAttribute("aria-label", `Partner logo ${index + 1}`);
        }
      });
    }
    // Clean up resources when needed
    destroy() {
      this.animationManager?.destroy();
      this.globeManager?.destroy();
    }
  };
  var app = new App();
  window.BrimstoneApp = app;
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2pzL3RoZW1lLmpzIiwgIi4uL3NyYy9qcy9hbmltYXRpb25zLmpzIiwgIi4uL3NyYy9qcy9nbG9iZS5qcyIsICIuLi9zcmMvanMvbWFpbi5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBUaGVtZSBtYW5hZ2VtZW50IG1vZHVsZVxuICogSGFuZGxlcyBkYXJrL2xpZ2h0IG1vZGUgc3dpdGNoaW5nIHdpdGggbG9jYWxTdG9yYWdlIHBlcnNpc3RlbmNlXG4gKi9cblxuZXhwb3J0IGNsYXNzIFRoZW1lTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMudGhlbWVUb2dnbGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGhlbWUtdG9nZ2xlJyk7XG4gICAgICAgIHRoaXMubW9vbkljb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9vbi1pY29uJyk7XG4gICAgICAgIHRoaXMuc3VuSWNvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdW4taWNvbicpO1xuICAgICAgICB0aGlzLmh0bWwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG4gICAgXG4gICAgaW5pdCgpIHtcbiAgICAgICAgLy8gQ2hlY2sgZm9yIHNhdmVkIHRoZW1lIHByZWZlcmVuY2Ugb3IgZGVmYXVsdCB0byBkYXJrXG4gICAgICAgIGNvbnN0IGN1cnJlbnRUaGVtZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0aGVtZScpIHx8ICdkYXJrJztcbiAgICAgICAgdGhpcy5zZXRUaGVtZShjdXJyZW50VGhlbWUpO1xuICAgICAgICBcbiAgICAgICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVyIGZvciB0aGVtZSB0b2dnbGVcbiAgICAgICAgaWYgKHRoaXMudGhlbWVUb2dnbGUpIHtcbiAgICAgICAgICAgIHRoaXMudGhlbWVUb2dnbGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnRvZ2dsZVRoZW1lKCkpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBBZGQgQVJJQSBhdHRyaWJ1dGVzIGZvciBhY2Nlc3NpYmlsaXR5XG4gICAgICAgICAgICB0aGlzLnRoZW1lVG9nZ2xlLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsICdUb2dnbGUgdGhlbWUnKTtcbiAgICAgICAgICAgIHRoaXMudGhlbWVUb2dnbGUuc2V0QXR0cmlidXRlKCdhcmlhLXByZXNzZWQnLCBjdXJyZW50VGhlbWUgPT09ICdsaWdodCcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHNldFRoZW1lKHRoZW1lKSB7XG4gICAgICAgIGlmICh0aGVtZSA9PT0gJ2xpZ2h0Jykge1xuICAgICAgICAgICAgdGhpcy5odG1sLmNsYXNzTGlzdC5hZGQoJ2xpZ2h0Jyk7XG4gICAgICAgICAgICB0aGlzLm1vb25JY29uPy5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcbiAgICAgICAgICAgIHRoaXMuc3VuSWNvbj8uY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmh0bWwuY2xhc3NMaXN0LnJlbW92ZSgnbGlnaHQnKTtcbiAgICAgICAgICAgIHRoaXMubW9vbkljb24/LmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpO1xuICAgICAgICAgICAgdGhpcy5zdW5JY29uPy5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3RoZW1lJywgdGhlbWUpO1xuICAgICAgICBcbiAgICAgICAgLy8gVXBkYXRlIEFSSUEgYXR0cmlidXRlXG4gICAgICAgIGlmICh0aGlzLnRoZW1lVG9nZ2xlKSB7XG4gICAgICAgICAgICB0aGlzLnRoZW1lVG9nZ2xlLnNldEF0dHJpYnV0ZSgnYXJpYS1wcmVzc2VkJywgdGhlbWUgPT09ICdsaWdodCcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHRvZ2dsZVRoZW1lKCkge1xuICAgICAgICBjb25zdCBjdXJyZW50VGhlbWUgPSB0aGlzLmh0bWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdsaWdodCcpID8gJ2xpZ2h0JyA6ICdkYXJrJztcbiAgICAgICAgY29uc3QgbmV3VGhlbWUgPSBjdXJyZW50VGhlbWUgPT09ICdsaWdodCcgPyAnZGFyaycgOiAnbGlnaHQnO1xuICAgICAgICB0aGlzLnNldFRoZW1lKG5ld1RoZW1lKTtcbiAgICB9XG4gICAgXG4gICAgZ2V0Q3VycmVudFRoZW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5odG1sLmNsYXNzTGlzdC5jb250YWlucygnbGlnaHQnKSA/ICdsaWdodCcgOiAnZGFyayc7XG4gICAgfVxufSIsICIvKipcbiAqIEFuaW1hdGlvbiBtYW5hZ2VtZW50IG1vZHVsZVxuICogSGFuZGxlcyBHU0FQIGFuaW1hdGlvbnMgYW5kIFNjcm9sbFRyaWdnZXIgZWZmZWN0c1xuICovXG5cbmV4cG9ydCBjbGFzcyBBbmltYXRpb25NYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5wcmVmZXJzUmVkdWNlZE1vdGlvbiA9IHdpbmRvdy5tYXRjaE1lZGlhKCcocHJlZmVycy1yZWR1Y2VkLW1vdGlvbjogcmVkdWNlKScpLm1hdGNoZXM7XG4gICAgICAgIHRoaXMuc3BsaXRDb21wbGV0ZWQgPSAwO1xuICAgICAgICB0aGlzLnNob3dDb250ZW50Q2FsbGJhY2sgPSBudWxsO1xuICAgICAgICB0aGlzLmxlbmlzID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuICAgIFxuICAgIGluaXQoKSB7XG4gICAgICAgIGlmICh0aGlzLnByZWZlcnNSZWR1Y2VkTW90aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dDb250ZW50SW1tZWRpYXRlbHkoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gUmVnaXN0ZXIgU2Nyb2xsVHJpZ2dlciBwbHVnaW5cbiAgICAgICAgZ3NhcC5yZWdpc3RlclBsdWdpbihTY3JvbGxUcmlnZ2VyKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgTGVuaXMgc21vb3RoIHNjcm9sbGluZ1xuICAgICAgICB0aGlzLmluaXRMZW5pcygpO1xuICAgICAgICBcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBhbmltYXRpb25zXG4gICAgICAgIHRoaXMuaW5pdFRleHRBbmltYXRpb25zKCk7XG4gICAgICAgIHRoaXMuaW5pdFNjcm9sbEFuaW1hdGlvbnMoKTtcbiAgICAgICAgdGhpcy5pbml0RmVhdHVyZUNhcmRzKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBTZXR1cCBzaG93IGNvbnRlbnQgY2FsbGJhY2sgZm9yIGxvYWRpbmcgc2VxdWVuY2VcbiAgICAgICAgdGhpcy5zaG93Q29udGVudENhbGxiYWNrID0gdGhpcy5zaG93Q29udGVudC5iaW5kKHRoaXMpO1xuICAgICAgICBcbiAgICAgICAgLy8gUmVmcmVzaCBTY3JvbGxUcmlnZ2VyIGFmdGVyIHNldHVwXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gU2Nyb2xsVHJpZ2dlci5yZWZyZXNoKCksIDEwMCk7XG4gICAgfVxuICAgIFxuICAgIGluaXRMZW5pcygpIHtcbiAgICAgICAgLy8gU2tpcCBvbiBtb2JpbGUgZm9yIHBlcmZvcm1hbmNlXG4gICAgICAgIGNvbnN0IGlzTW9iaWxlID0gd2luZG93LmlubmVyV2lkdGggPCA3Njg7XG4gICAgICAgIGlmIChpc01vYmlsZSkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgLy8gQ2hlY2sgaWYgTGVuaXMgaXMgYXZhaWxhYmxlXG4gICAgICAgIGlmICh0eXBlb2YgTGVuaXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0xlbmlzIG5vdCBhdmFpbGFibGUsIGZhbGxpbmcgYmFjayB0byBuYXRpdmUgc2Nyb2xsJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIENyZWF0ZSBMZW5pcyBpbnN0YW5jZVxuICAgICAgICB0aGlzLmxlbmlzID0gbmV3IExlbmlzKHtcbiAgICAgICAgICAgIGR1cmF0aW9uOiAxLjIsXG4gICAgICAgICAgICBlYXNpbmc6ICh0KSA9PiBNYXRoLm1pbigxLCAxLjAwMSAtIE1hdGgucG93KDIsIC0xMCAqIHQpKSxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ3ZlcnRpY2FsJyxcbiAgICAgICAgICAgIGdlc3R1cmVEaXJlY3Rpb246ICd2ZXJ0aWNhbCcsXG4gICAgICAgICAgICBzbW9vdGg6IHRydWUsXG4gICAgICAgICAgICBtb3VzZU11bHRpcGxpZXI6IDEsXG4gICAgICAgICAgICBzbW9vdGhUb3VjaDogZmFsc2UsXG4gICAgICAgICAgICB0b3VjaE11bHRpcGxpZXI6IDIsXG4gICAgICAgICAgICBpbmZpbml0ZTogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBDb25uZWN0IExlbmlzIHRvIEdTQVAgU2Nyb2xsVHJpZ2dlclxuICAgICAgICB0aGlzLmxlbmlzLm9uKCdzY3JvbGwnLCBTY3JvbGxUcmlnZ2VyLnVwZGF0ZSk7XG4gICAgICAgIFxuICAgICAgICBnc2FwLnRpY2tlci5hZGQoKHRpbWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubGVuaXMucmFmKHRpbWUgKiAxMDAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBnc2FwLnRpY2tlci5sYWdTbW9vdGhpbmcoMCk7XG4gICAgICAgIFxuICAgICAgICAvLyBIYW5kbGUgYW5jaG9yIGxpbmtzXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2FbaHJlZl49XCIjXCJdJykuZm9yRWFjaChhbmNob3IgPT4ge1xuICAgICAgICAgICAgYW5jaG9yLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihhbmNob3IuZ2V0QXR0cmlidXRlKCdocmVmJykpO1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQgJiYgdGhpcy5sZW5pcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxlbmlzLnNjcm9sbFRvKHRhcmdldCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiAtODAsIC8vIEFjY291bnQgZm9yIGZpeGVkIGhlYWRlclxuICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IDEuNVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBSZWZyZXNoIExlbmlzIG9uIHdpbmRvdyByZXNpemVcbiAgICAgICAgbGV0IHJlc2l6ZVRpbWVyO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHJlc2l6ZVRpbWVyKTtcbiAgICAgICAgICAgIHJlc2l6ZVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGVuaXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sZW5pcy5yZXNpemUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAyNTApO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgc2hvd0NvbnRlbnRJbW1lZGlhdGVseSgpIHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJldmVhbC10eXBlJykuZm9yRWFjaChlbCA9PiB7XG4gICAgICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKCdzcGxpdC1yZWFkeScpO1xuICAgICAgICAgICAgZWwuc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgICAgICAgIC8vIEVuc3VyZSBhbnkgY2hpbGQgZWxlbWVudHMgYXJlIGFsc28gdmlzaWJsZVxuICAgICAgICAgICAgZWwucXVlcnlTZWxlY3RvckFsbCgnKicpLmZvckVhY2goY2hpbGQgPT4ge1xuICAgICAgICAgICAgICAgIGNoaWxkLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5mZWF0dXJlLWNhcmQnKS5mb3JFYWNoKGVsID0+IHtcbiAgICAgICAgICAgIGVsLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICBlbC5zdHlsZS50cmFuc2Zvcm0gPSAnbm9uZSc7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnNob3dDb250ZW50KCk7XG4gICAgfVxuICAgIFxuICAgIHNob3dDb250ZW50KCkge1xuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2xvYWRlZCcpO1xuICAgICAgICBjb25zdCBsb2FkaW5nT3ZlcmxheSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5sb2FkaW5nLW92ZXJsYXknKTtcbiAgICAgICAgaWYgKGxvYWRpbmdPdmVybGF5KSB7XG4gICAgICAgICAgICBsb2FkaW5nT3ZlcmxheS5jbGFzc0xpc3QuYWRkKCdmYWRlLW91dCcpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBsb2FkaW5nT3ZlcmxheS5yZW1vdmUoKSwgNTAwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpbml0VGV4dEFuaW1hdGlvbnMoKSB7XG4gICAgICAgIGNvbnN0IHNwbGl0VHlwZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLnJldmVhbC10eXBlXCIpO1xuICAgICAgICB0aGlzLnNwbGl0Q29tcGxldGVkID0gMDtcbiAgICAgICAgXG4gICAgICAgIGlmIChzcGxpdFR5cGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnNob3dDb250ZW50KCksIDUwMCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIENoZWNrIGlmIHJlcXVpcmVkIGxpYnJhcmllcyBhcmUgYXZhaWxhYmxlXG4gICAgICAgIGlmICh0eXBlb2YgU3BsaXRUeXBlID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgZ3NhcCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignU3BsaXRUeXBlIG9yIEdTQVAgbm90IGF2YWlsYWJsZSwgc2hvd2luZyBjb250ZW50IGltbWVkaWF0ZWx5Jyk7XG4gICAgICAgICAgICBzcGxpdFR5cGVzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdzcGxpdC1yZWFkeScpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnNob3dDb250ZW50KCksIDIwMCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHNwbGl0VHlwZXMuZm9yRWFjaCgoZWxlbWVudCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRUZXh0ID0gbmV3IFNwbGl0VHlwZShlbGVtZW50LCB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVzOiBcIndvcmRzLCBjaGFyc1wiXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIGVsZW1lbnQgaXMgdmlzaWJsZSBmaXJzdFxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnc3BsaXQtcmVhZHknKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNwbGl0Q29tcGxldGVkKys7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3BsaXRDb21wbGV0ZWQgPT09IHNwbGl0VHlwZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5zaG93Q29udGVudCgpLCAyMDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBpc0ZpcnN0U2VjdGlvbiA9IGVsZW1lbnQuY2xvc2VzdCgnc2VjdGlvbicpPy5jbGFzc0xpc3QuY29udGFpbnMoJ3JlbGF0aXZlJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0UmV2ZWFsID0gZWxlbWVudC5kYXRhc2V0LnJldmVhbFNwZWVkID09PSAnZmFzdCc7XG4gICAgICAgICAgICAgICAgY29uc3QgYW5pbWF0aW9uRHVyYXRpb24gPSBpc0Zhc3RSZXZlYWwgPyAwLjIgOiAoaXNGaXJzdFNlY3Rpb24gPyAwLjQgOiAwLjgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFuaW1hdGlvblN0YWdnZXIgPSBpc0Zhc3RSZXZlYWwgPyAwLjAyIDogKGlzRmlyc3RTZWN0aW9uID8gMC4wNSA6IDAuMSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gU2V0IGluaXRpYWwgc3RhdGUgZm9yIGNoYXJhY3RlcnNcbiAgICAgICAgICAgICAgICBnc2FwLnNldChzcGxpdFRleHQuY2hhcnMsIHsgb3BhY2l0eTogMC4yIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGdzYXAudG8oc3BsaXRUZXh0LmNoYXJzLCB7XG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbFRyaWdnZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyaWdnZXI6IGVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogXCJ0b3AgODAlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVBY3Rpb25zOiBcInBsYXkgbm9uZSBub25lIG5vbmVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlcnM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsZXI6IHdpbmRvd1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgICAgICAgICBzdGFnZ2VyOiBhbmltYXRpb25TdGFnZ2VyLFxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogYW5pbWF0aW9uRHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IFwicG93ZXIyLm91dFwiXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluaXRpYWxpemluZyB0ZXh0IGFuaW1hdGlvbiBmb3IgZWxlbWVudDonLCBlbGVtZW50LCBlcnJvcik7XG4gICAgICAgICAgICAgICAgLy8gRmFsbGJhY2s6IHNob3cgZWxlbWVudCBpbW1lZGlhdGVseVxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnc3BsaXQtcmVhZHknKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICAgICAgdGhpcy5zcGxpdENvbXBsZXRlZCsrO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNwbGl0Q29tcGxldGVkID09PSBzcGxpdFR5cGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuc2hvd0NvbnRlbnQoKSwgMjAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBpbml0U2Nyb2xsQW5pbWF0aW9ucygpIHtcbiAgICAgICAgLy8gQW5pbWF0ZSBwYXJhZ3JhcGhzIChleGNsdWRpbmcgc3BlY2lmaWMgYXJlYXMpXG4gICAgICAgIGNvbnN0IHBhcmFncmFwaHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFxuICAgICAgICAgICAgJ3A6bm90KC5mZWF0dXJlLWNhcmQgcCk6bm90KC5jYXJlZXJzLWN0YSBwKTpub3QoYnV0dG9uIHApOm5vdChhIHApOm5vdChmb290ZXIgcCknXG4gICAgICAgICk7XG4gICAgICAgIFxuICAgICAgICBwYXJhZ3JhcGhzLmZvckVhY2gocCA9PiB7XG4gICAgICAgICAgICBnc2FwLnNldChwLCB7IG9wYWNpdHk6IDAsIHk6IDMwIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBnc2FwLnRvKHAsIHtcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDEsXG4gICAgICAgICAgICAgICAgZWFzZTogXCJwb3dlcjIub3V0XCIsXG4gICAgICAgICAgICAgICAgc2Nyb2xsVHJpZ2dlcjoge1xuICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyOiBwLFxuICAgICAgICAgICAgICAgICAgICBzdGFydDogXCJ0b3AgODUlXCIsXG4gICAgICAgICAgICAgICAgICAgIG9uY2U6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB0b2dnbGVBY3Rpb25zOiBcInBsYXkgbm9uZSBub25lIG5vbmVcIixcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsZXI6IHdpbmRvd1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgaW5pdEZlYXR1cmVDYXJkcygpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBnc2FwID09PSAndW5kZWZpbmVkJykgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgLy8gU2tpcCBjYXJkIGFuaW1hdGlvbnMgb24gbW9iaWxlIGRldmljZXNcbiAgICAgICAgY29uc3QgaXNNb2JpbGUgPSB3aW5kb3cuaW5uZXJXaWR0aCA8IDc2ODtcbiAgICAgICAgaWYgKGlzTW9iaWxlKSB7XG4gICAgICAgICAgICAvLyBTaG93IGNhcmRzIGltbWVkaWF0ZWx5IG9uIG1vYmlsZVxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmZlYXR1cmUtY2FyZCcpLmZvckVhY2goY2FyZCA9PiB7XG4gICAgICAgICAgICAgICAgY2FyZC5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgICAgIGNhcmQuc3R5bGUudHJhbnNmb3JtID0gJ25vbmUnO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBjYXJlZXJzQ3RhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmNhcmVlcnMtY3RhJyk7XG4gICAgICAgICAgICBpZiAoY2FyZWVyc0N0YSkge1xuICAgICAgICAgICAgICAgIGNhcmVlcnNDdGEuc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgICAgICAgICAgICBjYXJlZXJzQ3RhLnN0eWxlLnRyYW5zZm9ybSA9ICdub25lJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBmb3VuZGVyIGNhcmQgYW5pbWF0aW9uc1xuICAgICAgICB0aGlzLmluaXRGb3VuZGVyQ2FyZHMoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEFuaW1hdGUgY2FyZWVyIGNhcmRzIHNwZWNpZmljYWxseVxuICAgICAgICBjb25zdCBjYXJlZXJDYXJkcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNjYXJlZXJzIC5mZWF0dXJlLWNhcmQnKTtcbiAgICAgICAgY2FyZWVyQ2FyZHMuZm9yRWFjaCgoY2FyZCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGdzYXAuc2V0KGNhcmQsIHsgb3BhY2l0eTogMCwgeTogNTAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGdzYXAudG8oY2FyZCwge1xuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogMC44LFxuICAgICAgICAgICAgICAgIGRlbGF5OiBpbmRleCAqIDAuMSxcbiAgICAgICAgICAgICAgICBlYXNlOiBcInBvd2VyMi5vdXRcIixcbiAgICAgICAgICAgICAgICBzY3JvbGxUcmlnZ2VyOiB7XG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXI6IGNhcmQsXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBcInRvcCA4NSVcIixcbiAgICAgICAgICAgICAgICAgICAgb25jZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHRvZ2dsZUFjdGlvbnM6IFwicGxheSBub25lIG5vbmUgbm9uZVwiLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxlcjogd2luZG93XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gQW5pbWF0ZSBjYXJlZXJzIENUQSB3aXRoIGNhcmVlciBjYXJkc1xuICAgICAgICBjb25zdCBjYXJlZXJzQ3RhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmNhcmVlcnMtY3RhJyk7XG4gICAgICAgIGlmIChjYXJlZXJzQ3RhKSB7XG4gICAgICAgICAgICBnc2FwLnNldChjYXJlZXJzQ3RhLCB7IG9wYWNpdHk6IDAsIHk6IDUwIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBnc2FwLnRvKGNhcmVlcnNDdGEsIHtcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDAuOCxcbiAgICAgICAgICAgICAgICBkZWxheTogMS4yLCAvLyBBZnRlciB0aGUgMyBjYXJlZXIgY2FyZHNcbiAgICAgICAgICAgICAgICBlYXNlOiBcInBvd2VyMi5vdXRcIixcbiAgICAgICAgICAgICAgICBzY3JvbGxUcmlnZ2VyOiB7XG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXI6IGNhcmVlckNhcmRzWzBdIHx8IGNhcmVlcnNDdGEsXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBcInRvcCA4NSVcIixcbiAgICAgICAgICAgICAgICAgICAgb25jZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHRvZ2dsZUFjdGlvbnM6IFwicGxheSBub25lIG5vbmUgbm9uZVwiLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxlcjogd2luZG93XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEFuaW1hdGUgc2VydmljZSBjYXJkcyB0b2dldGhlciB3aXRoIHN0YWdnZXJcbiAgICAgICAgY29uc3Qgc2VydmljZUNhcmRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI3NlcnZpY2VzIC5mZWF0dXJlLWNhcmQnKTtcbiAgICAgICAgaWYgKHNlcnZpY2VDYXJkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzZXJ2aWNlQ2FyZHMuZm9yRWFjaChjYXJkID0+IHtcbiAgICAgICAgICAgICAgICBnc2FwLnNldChjYXJkLCB7IG9wYWNpdHk6IDAsIHk6IDUwIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGdzYXAudG8oc2VydmljZUNhcmRzLCB7XG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAwLjgsXG4gICAgICAgICAgICAgICAgc3RhZ2dlcjogMC4xLFxuICAgICAgICAgICAgICAgIGVhc2U6IFwicG93ZXIyLm91dFwiLFxuICAgICAgICAgICAgICAgIHNjcm9sbFRyaWdnZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcjogXCIjc2VydmljZXNcIixcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IFwidG9wIDcwJVwiLFxuICAgICAgICAgICAgICAgICAgICBvbmNlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdG9nZ2xlQWN0aW9uczogXCJwbGF5IG5vbmUgbm9uZSBub25lXCIsXG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbGVyOiB3aW5kb3dcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gQW5pbWF0ZSBwcm9jZXNzIGNhcmRzIHRvZ2V0aGVyXG4gICAgICAgIGNvbnN0IHByb2Nlc3NTZWN0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Byb2Nlc3MnKTtcbiAgICAgICAgaWYgKHByb2Nlc3NTZWN0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9jZXNzQ2FyZHMgPSBwcm9jZXNzU2VjdGlvbi5xdWVyeVNlbGVjdG9yQWxsKCcuZmVhdHVyZS1jYXJkJyk7XG4gICAgICAgICAgICBpZiAocHJvY2Vzc0NhcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzQ2FyZHMuZm9yRWFjaChjYXJkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC5zZXQoY2FyZCwgeyBvcGFjaXR5OiAwLCB5OiA1MCB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBnc2FwLnRvKHByb2Nlc3NDYXJkcywge1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogMC44LFxuICAgICAgICAgICAgICAgICAgICBzdGFnZ2VyOiAwLjEsXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IFwicG93ZXIyLm91dFwiLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxUcmlnZ2VyOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyOiBwcm9jZXNzU2VjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBcInRvcCA3MCVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uY2U6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlQWN0aW9uczogXCJwbGF5IG5vbmUgbm9uZSBub25lXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxlcjogd2luZG93XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gQW5pbWF0ZSBvdGhlciBmZWF0dXJlIGNhcmRzIChub3QgcHJvY2VzcywgY2FyZWVycywgb3Igc2VydmljZXMpXG4gICAgICAgIGNvbnN0IG90aGVyQ2FyZHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZmVhdHVyZS1jYXJkOm5vdCgjY2FyZWVycyAuZmVhdHVyZS1jYXJkKTpub3QoI3NlcnZpY2VzIC5mZWF0dXJlLWNhcmQpOm5vdCgjcHJvY2VzcyAuZmVhdHVyZS1jYXJkKScpO1xuICAgICAgICBvdGhlckNhcmRzLmZvckVhY2goKGNhcmQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBnc2FwLnNldChjYXJkLCB7IG9wYWNpdHk6IDAsIHk6IDUwIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBnc2FwLnRvKGNhcmQsIHtcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDAuOCxcbiAgICAgICAgICAgICAgICBkZWxheTogaW5kZXggKiAwLjEsXG4gICAgICAgICAgICAgICAgZWFzZTogXCJwb3dlcjIub3V0XCIsXG4gICAgICAgICAgICAgICAgc2Nyb2xsVHJpZ2dlcjoge1xuICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyOiBjYXJkLFxuICAgICAgICAgICAgICAgICAgICBzdGFydDogXCJ0b3AgODUlXCIsXG4gICAgICAgICAgICAgICAgICAgIG9uY2U6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB0b2dnbGVBY3Rpb25zOiBcInBsYXkgbm9uZSBub25lIG5vbmVcIixcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsZXI6IHdpbmRvd1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgaW5pdEZvdW5kZXJDYXJkcygpIHtcbiAgICAgICAgLy8gU2V0IHVwIEludGVyc2VjdGlvbiBPYnNlcnZlciBmb3IgZm91bmRlciBjYXJkc1xuICAgICAgICBjb25zdCBmb3VuZGVyQ2FyZHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZm91bmRlci1jYXJkJyk7XG4gICAgICAgIFxuICAgICAgICBpZiAoZm91bmRlckNhcmRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgY29uc3Qgb2JzZXJ2ZXJPcHRpb25zID0ge1xuICAgICAgICAgICAgcm9vdDogbnVsbCxcbiAgICAgICAgICAgIHJvb3RNYXJnaW46ICcwcHgnLFxuICAgICAgICAgICAgdGhyZXNob2xkOiAwLjFcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyKChlbnRyaWVzKSA9PiB7XG4gICAgICAgICAgICBlbnRyaWVzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlbnRyeS5pc0ludGVyc2VjdGluZykge1xuICAgICAgICAgICAgICAgICAgICBlbnRyeS50YXJnZXQuY2xhc3NMaXN0LmFkZCgnYW5pbWF0ZS1pbicpO1xuICAgICAgICAgICAgICAgICAgICBvYnNlcnZlci51bm9ic2VydmUoZW50cnkudGFyZ2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgb2JzZXJ2ZXJPcHRpb25zKTtcbiAgICAgICAgXG4gICAgICAgIGZvdW5kZXJDYXJkcy5mb3JFYWNoKGNhcmQgPT4ge1xuICAgICAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShjYXJkKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBBZGQgcGFyYWxsYXggZWZmZWN0IHRvIGZvdW5kZXIgcGhvdG9zXG4gICAgICAgIHRoaXMuaW5pdEZvdW5kZXJQYXJhbGxheCgpO1xuICAgIH1cbiAgICBcbiAgICBpbml0Rm91bmRlclBhcmFsbGF4KCkge1xuICAgICAgICBpZiAodHlwZW9mIGdzYXAgPT09ICd1bmRlZmluZWQnKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICAvLyBTa2lwIHBhcmFsbGF4IG9uIG1vYmlsZSBmb3IgcGVyZm9ybWFuY2VcbiAgICAgICAgY29uc3QgaXNNb2JpbGUgPSB3aW5kb3cuaW5uZXJXaWR0aCA8IDc2ODtcbiAgICAgICAgaWYgKGlzTW9iaWxlKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICAvLyBPbmx5IHNlbGVjdCB0aGUgYWN0dWFsIGltYWdlcywgbm90IGFueSBkaXZzIG9yIG92ZXJsYXlzXG4gICAgICAgIGNvbnN0IGZvdW5kZXJQaG90b3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZm91bmRlci1jYXJkID4gZGl2OmZpcnN0LWNoaWxkID4gaW1nJyk7XG4gICAgICAgIFxuICAgICAgICBmb3VuZGVyUGhvdG9zLmZvckVhY2goKHBob3RvKSA9PiB7XG4gICAgICAgICAgICAvLyBTY2FsZSB1cCB0aGUgcGhvdG8gdG8gaGF2ZSBleHRyYSBzcGFjZSBmb3IgcGFyYWxsYXggbW92ZW1lbnRcbiAgICAgICAgICAgIGdzYXAuc2V0KHBob3RvLCB7XG4gICAgICAgICAgICAgICAgc2NhbGU6IDEuMixcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm1PcmlnaW46IFwiY2VudGVyIHRvcFwiLFxuICAgICAgICAgICAgICAgIHlQZXJjZW50OiAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQXBwbHkgcGFyYWxsYXggZWZmZWN0IHRvIHRoZSBwaG90byBvbmx5XG4gICAgICAgICAgICAvLyBNb3ZlIGZyb20gMCB0byBuZWdhdGl2ZSB0byBjcmVhdGUgZG93bndhcmQgcGFyYWxsYXhcbiAgICAgICAgICAgIGdzYXAuZnJvbVRvKHBob3RvLCBcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHlQZXJjZW50OiAwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHlQZXJjZW50OiAtMTUsXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxUcmlnZ2VyOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyOiBwaG90by5jbG9zZXN0KCcuZm91bmRlci1jYXJkJyksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogXCJ0b3AgYm90dG9tXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IFwiYm90dG9tIHRvcFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NydWI6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnZhbGlkYXRlT25SZWZyZXNoOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgaWYgKHRoaXMubGVuaXMpIHtcbiAgICAgICAgICAgIHRoaXMubGVuaXMuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5sZW5pcyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgU2Nyb2xsVHJpZ2dlci5nZXRBbGwoKS5mb3JFYWNoKHRyaWdnZXIgPT4gdHJpZ2dlci5raWxsKCkpO1xuICAgIH1cbn0iLCAiLyoqXG4gKiAzRCBHbG9iZSBtb2R1bGVcbiAqIEhhbmRsZXMgVGhyZWUuanMgZ2xvYmUgd2l0aCBhbmltYXRlZCBjb25uZWN0aW9uc1xuICovXG5cbmV4cG9ydCBjbGFzcyBHbG9iZU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRhaW5lcklkID0gJ2dsb2JlLWNvbnRhaW5lcicpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjb250YWluZXJJZCk7XG4gICAgICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuc2NlbmUgPSBudWxsO1xuICAgICAgICB0aGlzLmNhbWVyYSA9IG51bGw7XG4gICAgICAgIHRoaXMucmVuZGVyZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmdsb2JlR3JvdXAgPSBudWxsO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbklkID0gbnVsbDtcbiAgICAgICAgdGhpcy5keW5hbWljUG9pbnRzID0gW107XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbklkID0gMDtcbiAgICAgICAgdGhpcy5wYXJ0aWNsZVBvc2l0aW9ucyA9IG51bGw7XG4gICAgICAgIHRoaXMubGFzdFRpbWUgPSAwO1xuICAgICAgICB0aGlzLnBvaW50U3Bhd25UaW1lciA9IDA7XG4gICAgICAgIHRoaXMucG9pbnRTcGF3bkludGVydmFsID0gdGhpcy5pc01vYmlsZSA/IDIuNSA6IDEuMjtcbiAgICAgICAgdGhpcy5tYXhEeW5hbWljUG9pbnRzID0gdGhpcy5pc01vYmlsZSA/IDMgOiAxMDtcbiAgICAgICAgXG4gICAgICAgIC8vIFBlcmZvcm1hbmNlIHNldHRpbmdzXG4gICAgICAgIHRoaXMuaXNNb2JpbGUgPSB3aW5kb3cuaW5uZXJXaWR0aCA8IDc2ODtcbiAgICAgICAgdGhpcy5pc0xvd0VuZERldmljZSA9IHRoaXMuZGV0ZWN0TG93RW5kRGV2aWNlKCk7XG4gICAgICAgIHRoaXMucHJlZmVyc1JlZHVjZWRNb3Rpb24gPSB3aW5kb3cubWF0Y2hNZWRpYSgnKHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSknKS5tYXRjaGVzO1xuICAgICAgICB0aGlzLmZyYW1lU2tpcCA9IDA7XG4gICAgICAgIHRoaXMudGFyZ2V0RlBTID0gdGhpcy5pc01vYmlsZSA/IDMwIDogNjA7XG4gICAgICAgIHRoaXMuZnBzSGlzdG9yeSA9IFtdO1xuICAgICAgICB0aGlzLmFkYXB0aXZlUXVhbGl0eSA9IHRydWU7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG4gICAgXG4gICAgZGV0ZWN0TG93RW5kRGV2aWNlKCkge1xuICAgICAgICAvLyBDaGVjayBmb3IgbG93LWVuZCBkZXZpY2UgaW5kaWNhdG9yc1xuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY29uc3QgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnKSB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJyk7XG4gICAgICAgIFxuICAgICAgICBpZiAoIWdsKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgXG4gICAgICAgIC8vIENoZWNrIG1heCB0ZXh0dXJlIHNpemUgKGxvdy1lbmQgZGV2aWNlcyB0eXBpY2FsbHkgaGF2ZSBzbWFsbGVyIGxpbWl0cylcbiAgICAgICAgY29uc3QgbWF4VGV4dHVyZVNpemUgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuTUFYX1RFWFRVUkVfU0laRSk7XG4gICAgICAgIFxuICAgICAgICAvLyBDaGVjayBkZXZpY2UgbWVtb3J5IGlmIGF2YWlsYWJsZVxuICAgICAgICBjb25zdCBkZXZpY2VNZW1vcnkgPSBuYXZpZ2F0b3IuZGV2aWNlTWVtb3J5IHx8IDQ7XG4gICAgICAgIFxuICAgICAgICAvLyBDaGVjayBoYXJkd2FyZSBjb25jdXJyZW5jeSAoQ1BVIGNvcmVzKVxuICAgICAgICBjb25zdCBjb3JlcyA9IG5hdmlnYXRvci5oYXJkd2FyZUNvbmN1cnJlbmN5IHx8IDQ7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbWF4VGV4dHVyZVNpemUgPCA0MDk2IHx8IGRldmljZU1lbW9yeSA8IDQgfHwgY29yZXMgPCA0O1xuICAgIH1cbiAgICBcbiAgICBpbml0KCkge1xuICAgICAgICAvLyBEb24ndCBpbml0aWFsaXplIG9uIG1vYmlsZSBhdCBhbGxcbiAgICAgICAgaWYgKHRoaXMuaXNNb2JpbGUgfHwgdGhpcy5wcmVmZXJzUmVkdWNlZE1vdGlvbiB8fCB0aGlzLmlzTG93RW5kRGV2aWNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgVEhSRUUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdUaHJlZS5qcyBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLnNldHVwU2NlbmUoKTtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlR2xvYmUoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRBbmltYXRpb24oKTtcbiAgICAgICAgICAgIHRoaXMuc2V0dXBFdmVudExpc3RlbmVycygpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGluaXRpYWxpemUgZ2xvYmU6JywgZXJyb3IpO1xuICAgICAgICAgICAgaWYgKHRoaXMuY29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBzZXR1cFNjZW5lKCkge1xuICAgICAgICB0aGlzLnNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gICAgICAgIHRoaXMuY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDc1LCAxLCAwLjEsIDIwMDApO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgbWF4U2l6ZSA9IHdpbmRvdy5pbm5lckhlaWdodCAqIDEuMjtcbiAgICAgICAgdGhpcy5yZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHsgXG4gICAgICAgICAgICBhbHBoYTogdHJ1ZSwgXG4gICAgICAgICAgICBhbnRpYWxpYXM6ICF0aGlzLmlzTW9iaWxlLFxuICAgICAgICAgICAgcG93ZXJQcmVmZXJlbmNlOiB0aGlzLmlzTW9iaWxlID8gJ2xvdy1wb3dlcicgOiAnaGlnaC1wZXJmb3JtYW5jZScsXG4gICAgICAgICAgICBwcmVjaXNpb246IHRoaXMuaXNNb2JpbGUgPyAnbG93cCcgOiAnaGlnaHAnXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFNpemUobWF4U2l6ZSwgbWF4U2l6ZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UGl4ZWxSYXRpbyh0aGlzLmlzTW9iaWxlID8gMSA6IE1hdGgubWluKHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvLCAyKSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0Q2xlYXJDb2xvcigweDAwMDAwMCwgMCk7XG4gICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMucmVuZGVyZXIuZG9tRWxlbWVudCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgMTAwMCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmdsb2JlR3JvdXAgPSBuZXcgVEhSRUUuR3JvdXAoKTtcbiAgICAgICAgdGhpcy5nbG9iZUdyb3VwLnJvdGF0aW9uLnggPSAwLjM7XG4gICAgICAgIHRoaXMuc2NlbmUuYWRkKHRoaXMuZ2xvYmVHcm91cCk7XG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZUdsb2JlKCkge1xuICAgICAgICAvLyBSZWR1Y2UgZ2VvbWV0cnkgY29tcGxleGl0eSBvbiBtb2JpbGVcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSB0aGlzLmlzTW9iaWxlID8gMjQgOiAzMjtcbiAgICAgICAgY29uc3QgcmluZ3MgPSB0aGlzLmlzTW9iaWxlID8gMTIgOiAxNjtcbiAgICAgICAgY29uc3Qgc3BoZXJlR2VvbWV0cnkgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoNTMyLCBzZWdtZW50cywgcmluZ3MpO1xuICAgICAgICBcbiAgICAgICAgLy8gTG93ZXIgb3BhY2l0eSBvbiBtb2JpbGUgaW4gZGFyayBtb2RlXG4gICAgICAgIGNvbnN0IGJhc2VPcGFjaXR5ID0gdGhpcy5pc01vYmlsZSA/IDAuMDMgOiAwLjA4O1xuICAgICAgICBcbiAgICAgICAgY29uc3Qgd2lyZWZyYW1lTWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgICAgICAgY29sb3I6IDB4Zjk3MzE2LFxuICAgICAgICAgICAgd2lyZWZyYW1lOiB0cnVlLFxuICAgICAgICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICAgICAgICBvcGFjaXR5OiBiYXNlT3BhY2l0eVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHdpcmVmcmFtZVNwaGVyZSA9IG5ldyBUSFJFRS5NZXNoKHNwaGVyZUdlb21ldHJ5LCB3aXJlZnJhbWVNYXRlcmlhbCk7XG4gICAgICAgIHRoaXMuZ2xvYmVHcm91cC5hZGQod2lyZWZyYW1lU3BoZXJlKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY3JlYXRlUGFydGljbGVzKCk7XG4gICAgICAgIHRoaXMuc2V0dXBMaWdodGluZygpO1xuICAgIH1cbiAgICBcbiAgICBjcmVhdGVQYXJ0aWNsZXMoKSB7XG4gICAgICAgIC8vIFJlZHVjZSBwYXJ0aWNsZSBjb3VudCBvbiBtb2JpbGVcbiAgICAgICAgY29uc3QgcGFydGljbGVDb3VudCA9IHRoaXMuaXNNb2JpbGUgPyA2MCA6IDEyMDtcbiAgICAgICAgY29uc3QgcGFydGljbGVQb3NpdGlvbnMgPSBuZXcgRmxvYXQzMkFycmF5KHBhcnRpY2xlQ291bnQgKiAzKTtcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydGljbGVDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwaGkgPSBNYXRoLmFjb3MoLTEgKyAoMiAqIGkpIC8gcGFydGljbGVDb3VudCk7XG4gICAgICAgICAgICBjb25zdCB0aGV0YSA9IE1hdGguc3FydChwYXJ0aWNsZUNvdW50ICogTWF0aC5QSSkgKiBwaGk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnN0IHJhZGl1cyA9IDUzMjtcbiAgICAgICAgICAgIGNvbnN0IHggPSByYWRpdXMgKiBNYXRoLnNpbihwaGkpICogTWF0aC5jb3ModGhldGEpO1xuICAgICAgICAgICAgY29uc3QgeSA9IHJhZGl1cyAqIE1hdGguc2luKHBoaSkgKiBNYXRoLnNpbih0aGV0YSk7XG4gICAgICAgICAgICBjb25zdCB6ID0gcmFkaXVzICogTWF0aC5jb3MocGhpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcGFydGljbGVQb3NpdGlvbnNbaSAqIDNdID0geDtcbiAgICAgICAgICAgIHBhcnRpY2xlUG9zaXRpb25zW2kgKiAzICsgMV0gPSB5O1xuICAgICAgICAgICAgcGFydGljbGVQb3NpdGlvbnNbaSAqIDMgKyAyXSA9IHo7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMucGFydGljbGVQb3NpdGlvbnMgPSBwYXJ0aWNsZVBvc2l0aW9ucztcbiAgICB9XG4gICAgXG4gICAgc2V0dXBMaWdodGluZygpIHtcbiAgICAgICAgY29uc3QgYW1iaWVudExpZ2h0ID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodCgweDQwNDA0MCwgMC40KTtcbiAgICAgICAgdGhpcy5zY2VuZS5hZGQoYW1iaWVudExpZ2h0KTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGRpcmVjdGlvbmFsTGlnaHQgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgMC42KTtcbiAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi5zZXQoLTMwMCwgLTMwMCwgNDAwKTtcbiAgICAgICAgdGhpcy5zY2VuZS5hZGQoZGlyZWN0aW9uYWxMaWdodCk7XG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZUR5bmFtaWNDb25uZWN0aW9uKCkge1xuICAgICAgICBjb25zdCBwYXJ0aWNsZUNvdW50ID0gdGhpcy5wYXJ0aWNsZVBvc2l0aW9ucy5sZW5ndGggLyAzO1xuICAgICAgICBjb25zdCBzdGFydFBhcnRpY2xlSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwYXJ0aWNsZUNvdW50KTtcbiAgICAgICAgY29uc3Qgc3RhcnRYID0gdGhpcy5wYXJ0aWNsZVBvc2l0aW9uc1tzdGFydFBhcnRpY2xlSW5kZXggKiAzXTtcbiAgICAgICAgY29uc3Qgc3RhcnRZID0gdGhpcy5wYXJ0aWNsZVBvc2l0aW9uc1tzdGFydFBhcnRpY2xlSW5kZXggKiAzICsgMV07XG4gICAgICAgIGNvbnN0IHN0YXJ0WiA9IHRoaXMucGFydGljbGVQb3NpdGlvbnNbc3RhcnRQYXJ0aWNsZUluZGV4ICogMyArIDJdO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgY29ubmVjdGlvbkxpbmVzID0gW107XG4gICAgICAgIGNvbnN0IGNvbm5lY3Rpb25NYXRlcmlhbHMgPSBbXTtcbiAgICAgICAgY29uc3QgY29ubmVjdGlvblNwaGVyZXMgPSBbXTtcbiAgICAgICAgY29uc3QgY29ubmVjdGlvblNwaGVyZU1hdGVyaWFscyA9IFtdO1xuICAgICAgICBjb25zdCBjb25uZWN0aW9uUG9pbnRzID0gW107XG4gICAgICAgIFxuICAgICAgICAvLyBSZWR1Y2UgY29ubmVjdGlvbiBjb21wbGV4aXR5IG9uIG1vYmlsZVxuICAgICAgICBjb25zdCBtYXhDb25uZWN0aW9ucyA9IHRoaXMuaXNNb2JpbGUgPyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKSArIDIgOiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAzKSArIDM7XG4gICAgICAgIGxldCBjdXJyZW50UG9zID0geyB4OiBzdGFydFgsIHk6IHN0YXJ0WSwgejogc3RhcnRaIH07XG4gICAgICAgIGxldCBjdXJyZW50UGFydGljbGVJbmRleCA9IHN0YXJ0UGFydGljbGVJbmRleDtcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4Q29ubmVjdGlvbnM7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgbmVhcmJ5UGFydGljbGVzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhcnRpY2xlQ291bnQ7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChqID09PSBjdXJyZW50UGFydGljbGVJbmRleCkgY29udGludWU7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3QgcHggPSB0aGlzLnBhcnRpY2xlUG9zaXRpb25zW2ogKiAzXTtcbiAgICAgICAgICAgICAgICBjb25zdCBweSA9IHRoaXMucGFydGljbGVQb3NpdGlvbnNbaiAqIDMgKyAxXTtcbiAgICAgICAgICAgICAgICBjb25zdCBweiA9IHRoaXMucGFydGljbGVQb3NpdGlvbnNbaiAqIDMgKyAyXTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBkaXN0YW5jZSA9IE1hdGguc3FydChcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3coY3VycmVudFBvcy54IC0gcHgsIDIpICsgXG4gICAgICAgICAgICAgICAgICAgIE1hdGgucG93KGN1cnJlbnRQb3MueSAtIHB5LCAyKSArIFxuICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyhjdXJyZW50UG9zLnogLSBweiwgMilcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZSA8IDI1MCkge1xuICAgICAgICAgICAgICAgICAgICBuZWFyYnlQYXJ0aWNsZXMucHVzaCh7IGluZGV4OiBqLCBkaXN0YW5jZTogZGlzdGFuY2UsIHBvczogW3B4LCBweSwgcHpdIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKG5lYXJieVBhcnRpY2xlcy5sZW5ndGggPT09IDApIGJyZWFrO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCBuZXh0UGFydGljbGUgPSBuZWFyYnlQYXJ0aWNsZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbmVhcmJ5UGFydGljbGVzLmxlbmd0aCldO1xuICAgICAgICAgICAgY29uc3QgbmV4dFBvcyA9IHsgeDogbmV4dFBhcnRpY2xlLnBvc1swXSwgeTogbmV4dFBhcnRpY2xlLnBvc1sxXSwgejogbmV4dFBhcnRpY2xlLnBvc1syXSB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCB7IGxpbmUsIGxpbmVNYXQsIHNwaGVyZSwgc3BoZXJlTWF0IH0gPSB0aGlzLmNyZWF0ZUNvbm5lY3Rpb25FbGVtZW50cyhjdXJyZW50UG9zLCBuZXh0UG9zLCBpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29ubmVjdGlvbkxpbmVzLnB1c2gobGluZSk7XG4gICAgICAgICAgICBjb25uZWN0aW9uTWF0ZXJpYWxzLnB1c2gobGluZU1hdCk7XG4gICAgICAgICAgICBjb25uZWN0aW9uU3BoZXJlcy5wdXNoKHNwaGVyZSk7XG4gICAgICAgICAgICBjb25uZWN0aW9uU3BoZXJlTWF0ZXJpYWxzLnB1c2goc3BoZXJlTWF0KTtcbiAgICAgICAgICAgIGNvbm5lY3Rpb25Qb2ludHMucHVzaCh7XG4gICAgICAgICAgICAgICAgc3RhcnQ6IHsgLi4uY3VycmVudFBvcyB9LFxuICAgICAgICAgICAgICAgIGVuZDogeyAuLi5uZXh0UG9zIH0sXG4gICAgICAgICAgICAgICAgc3RhcnRJbmRleDogY3VycmVudFBhcnRpY2xlSW5kZXgsXG4gICAgICAgICAgICAgICAgZW5kSW5kZXg6IG5leHRQYXJ0aWNsZS5pbmRleFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGN1cnJlbnRQb3MgPSBuZXh0UG9zO1xuICAgICAgICAgICAgY3VycmVudFBhcnRpY2xlSW5kZXggPSBuZXh0UGFydGljbGUuaW5kZXg7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGR5bmFtaWNDb25uZWN0aW9uID0ge1xuICAgICAgICAgICAgaWQ6IHRoaXMuY29ubmVjdGlvbklkKyssXG4gICAgICAgICAgICBjb25uZWN0aW9uczogY29ubmVjdGlvbkxpbmVzLFxuICAgICAgICAgICAgY29ubmVjdGlvbk1hdGVyaWFsczogY29ubmVjdGlvbk1hdGVyaWFscyxcbiAgICAgICAgICAgIGNvbm5lY3Rpb25TcGhlcmVzOiBjb25uZWN0aW9uU3BoZXJlcyxcbiAgICAgICAgICAgIGNvbm5lY3Rpb25TcGhlcmVNYXRlcmlhbHM6IGNvbm5lY3Rpb25TcGhlcmVNYXRlcmlhbHMsXG4gICAgICAgICAgICBjb25uZWN0aW9uUG9pbnRzOiBjb25uZWN0aW9uUG9pbnRzLFxuICAgICAgICAgICAgbGlmZTogMCxcbiAgICAgICAgICAgIG1heExpZmU6IDUgKyBNYXRoLnJhbmRvbSgpICogMyxcbiAgICAgICAgICAgIGZhZGVJbkR1cmF0aW9uOiAwLjMsXG4gICAgICAgICAgICBmYWRlT3V0RHVyYXRpb246IDAuNSxcbiAgICAgICAgICAgIGdyb3d0aER1cmF0aW9uOiAwLjZcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZHluYW1pY1BvaW50cy5wdXNoKGR5bmFtaWNDb25uZWN0aW9uKTtcbiAgICAgICAgcmV0dXJuIGR5bmFtaWNDb25uZWN0aW9uO1xuICAgIH1cbiAgICBcbiAgICBjcmVhdGVDb25uZWN0aW9uRWxlbWVudHMoc3RhcnRQb3MsIGVuZFBvcywgY29ubmVjdGlvbkluZGV4KSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0UG9zVmVjID0gbmV3IFRIUkVFLlZlY3RvcjMoc3RhcnRQb3MueCwgc3RhcnRQb3MueSwgc3RhcnRQb3Mueik7XG4gICAgICAgIGNvbnN0IGVuZFBvc1ZlYyA9IG5ldyBUSFJFRS5WZWN0b3IzKGVuZFBvcy54LCBlbmRQb3MueSwgZW5kUG9zLnopO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgYXJjUG9pbnRzID0gW107XG4gICAgICAgIGNvbnN0IHNlZ21lbnRzID0gdGhpcy5pc01vYmlsZSA/IDEwIDogMjA7XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8PSBzZWdtZW50czsgaisrKSB7XG4gICAgICAgICAgICBjb25zdCB0ID0gaiAvIHNlZ21lbnRzO1xuICAgICAgICAgICAgY29uc3QgbGVycFBvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCkubGVycFZlY3RvcnMoc3RhcnRQb3NWZWMsIGVuZFBvc1ZlYywgdCk7XG4gICAgICAgICAgICBjb25zdCBzcGhlcmVSYWRpdXMgPSA1NDI7XG4gICAgICAgICAgICBsZXJwUG9zLm5vcm1hbGl6ZSgpLm11bHRpcGx5U2NhbGFyKHNwaGVyZVJhZGl1cyk7XG4gICAgICAgICAgICBhcmNQb2ludHMucHVzaChsZXJwUG9zKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc3QgY3VydmUgPSBuZXcgVEhSRUUuQ2F0bXVsbFJvbUN1cnZlMyhhcmNQb2ludHMpO1xuICAgICAgICBjb25zdCBmdWxsUG9pbnRzID0gY3VydmUuZ2V0UG9pbnRzKHRoaXMuaXNNb2JpbGUgPyAyMCA6IDQwKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGxpbmVHZW9tID0gbmV3IFRIUkVFLkJ1ZmZlckdlb21ldHJ5KCkuc2V0RnJvbVBvaW50cyhbZnVsbFBvaW50c1swXSwgZnVsbFBvaW50c1swXV0pO1xuICAgICAgICBjb25zdCBsaW5lTWF0ID0gbmV3IFRIUkVFLkxpbmVCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgICAgIGNvbG9yOiBuZXcgVEhSRUUuQ29sb3IoMSwgMC44LCAwLjIpLFxuICAgICAgICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgbGluZSA9IG5ldyBUSFJFRS5MaW5lKGxpbmVHZW9tLCBsaW5lTWF0KTtcbiAgICAgICAgbGluZS51c2VyRGF0YSA9IHtcbiAgICAgICAgICAgIGZ1bGxQb2ludHM6IGZ1bGxQb2ludHMsXG4gICAgICAgICAgICBjb25uZWN0aW9uSW5kZXg6IGNvbm5lY3Rpb25JbmRleCxcbiAgICAgICAgICAgIGFuaW1hdGlvbkRlbGF5OiAwLFxuICAgICAgICAgICAgaXNBY3RpdmU6IGNvbm5lY3Rpb25JbmRleCA9PT0gMFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdsb2JlR3JvdXAuYWRkKGxpbmUpO1xuICAgICAgICBcbiAgICAgICAgY29uc3Qgc3BoZXJlR2VvbSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeSgxLjUsIDgsIDgpO1xuICAgICAgICBjb25zdCBzcGhlcmVNYXQgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgICAgICAgY29sb3I6IG5ldyBUSFJFRS5Db2xvcigxLCAxLCAwLjMpLFxuICAgICAgICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBzcGhlcmUgPSBuZXcgVEhSRUUuTWVzaChzcGhlcmVHZW9tLCBzcGhlcmVNYXQpO1xuICAgICAgICBzcGhlcmUucG9zaXRpb24uY29weShhcmNQb2ludHNbMF0pO1xuICAgICAgICB0aGlzLmdsb2JlR3JvdXAuYWRkKHNwaGVyZSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4geyBsaW5lLCBsaW5lTWF0LCBzcGhlcmUsIHNwaGVyZU1hdCB9O1xuICAgIH1cbiAgICBcbiAgICB1cGRhdGVEeW5hbWljUG9pbnRzKGRlbHRhVGltZSkge1xuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5keW5hbWljUG9pbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBjb25uZWN0aW9uID0gdGhpcy5keW5hbWljUG9pbnRzW2ldO1xuICAgICAgICAgICAgY29ubmVjdGlvbi5saWZlICs9IGRlbHRhVGltZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGV0IG9wYWNpdHkgPSAwO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5saWZlIDwgY29ubmVjdGlvbi5mYWRlSW5EdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIG9wYWNpdHkgPSBjb25uZWN0aW9uLmxpZmUgLyBjb25uZWN0aW9uLmZhZGVJbkR1cmF0aW9uO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb25uZWN0aW9uLmxpZmUgPCBjb25uZWN0aW9uLm1heExpZmUgLSBjb25uZWN0aW9uLmZhZGVPdXREdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIG9wYWNpdHkgPSAxO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb25uZWN0aW9uLmxpZmUgPCBjb25uZWN0aW9uLm1heExpZmUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmYWRlUHJvZ3Jlc3MgPSAoY29ubmVjdGlvbi5tYXhMaWZlIC0gY29ubmVjdGlvbi5saWZlKSAvIGNvbm5lY3Rpb24uZmFkZU91dER1cmF0aW9uO1xuICAgICAgICAgICAgICAgIG9wYWNpdHkgPSBmYWRlUHJvZ3Jlc3M7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uY29ubmVjdGlvbnMuZm9yRWFjaChsaW5lID0+IHRoaXMuZ2xvYmVHcm91cC5yZW1vdmUobGluZSkpO1xuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uY29ubmVjdGlvblNwaGVyZXMuZm9yRWFjaChzcGhlcmUgPT4gdGhpcy5nbG9iZUdyb3VwLnJlbW92ZShzcGhlcmUpKTtcbiAgICAgICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5lbmRTcGhlcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nbG9iZUdyb3VwLnJlbW92ZShjb25uZWN0aW9uLmVuZFNwaGVyZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZHluYW1pY1BvaW50cy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29ubmVjdGlvbkVsZW1lbnRzKGNvbm5lY3Rpb24sIG9wYWNpdHkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHVwZGF0ZUNvbm5lY3Rpb25FbGVtZW50cyhjb25uZWN0aW9uLCBvcGFjaXR5KSB7XG4gICAgICAgIGNvbm5lY3Rpb24uY29ubmVjdGlvbnMuZm9yRWFjaCgobGluZSwgY29ubmVjdGlvbkluZGV4KSA9PiB7XG4gICAgICAgICAgICBpZiAobGluZS51c2VyRGF0YS5pc0FjdGl2ZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbm5lY3Rpb25BZ2UgPSBjb25uZWN0aW9uLmxpZmUgLSBsaW5lLnVzZXJEYXRhLmFuaW1hdGlvbkRlbGF5O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChjb25uZWN0aW9uQWdlID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzcGhlcmVPcGFjaXR5ID0gTWF0aC5taW4oMSwgY29ubmVjdGlvbkFnZSAvIDAuMikgKiBvcGFjaXR5O1xuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmNvbm5lY3Rpb25TcGhlcmVNYXRlcmlhbHNbY29ubmVjdGlvbkluZGV4XS5vcGFjaXR5ID0gc3BoZXJlT3BhY2l0eTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyb3d0aFByb2dyZXNzID0gTWF0aC5taW4oMSwgY29ubmVjdGlvbkFnZSAvIGNvbm5lY3Rpb24uZ3Jvd3RoRHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmdWxsUG9pbnRzID0gbGluZS51c2VyRGF0YS5mdWxsUG9pbnRzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50UG9pbnRDb3VudCA9IE1hdGguZmxvb3IoZ3Jvd3RoUHJvZ3Jlc3MgKiBmdWxsUG9pbnRzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFBvaW50Q291bnQgPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50UG9pbnRzID0gZnVsbFBvaW50cy5zbGljZSgwLCBjdXJyZW50UG9pbnRDb3VudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lLmdlb21ldHJ5LnNldEZyb21Qb2ludHMoY3VycmVudFBvaW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmNvbm5lY3Rpb25NYXRlcmlhbHNbY29ubmVjdGlvbkluZGV4XS5vcGFjaXR5ID0gb3BhY2l0eSAqIDAuODtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdyb3d0aFByb2dyZXNzID49IDEuMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5leHRJbmRleCA9IGNvbm5lY3Rpb25JbmRleCArIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5leHRJbmRleCA8IGNvbm5lY3Rpb24uY29ubmVjdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5leHRMaW5lID0gY29ubmVjdGlvbi5jb25uZWN0aW9uc1tuZXh0SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW5leHRMaW5lLnVzZXJEYXRhLmlzQWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0TGluZS51c2VyRGF0YS5pc0FjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0TGluZS51c2VyRGF0YS5hbmltYXRpb25EZWxheSA9IGNvbm5lY3Rpb24ubGlmZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWxpbmUudXNlckRhdGEuZW5kUG9pbnRDcmVhdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlRW5kU3BoZXJlKGNvbm5lY3Rpb24sIGxpbmUsIGZ1bGxQb2ludHMsIG9wYWNpdHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uY29ubmVjdGlvblNwaGVyZU1hdGVyaWFsc1tjb25uZWN0aW9uSW5kZXhdLm9wYWNpdHkgPSBvcGFjaXR5ICogMC41O1xuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmNvbm5lY3Rpb25NYXRlcmlhbHNbY29ubmVjdGlvbkluZGV4XS5vcGFjaXR5ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uY29ubmVjdGlvbk1hdGVyaWFsc1tjb25uZWN0aW9uSW5kZXhdLm9wYWNpdHkgPSAwO1xuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uY29ubmVjdGlvblNwaGVyZU1hdGVyaWFsc1tjb25uZWN0aW9uSW5kZXhdLm9wYWNpdHkgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIGlmIChjb25uZWN0aW9uLmVuZFNwaGVyZSAmJiBjb25uZWN0aW9uLmVuZFNwaGVyZU1hdGVyaWFsKSB7XG4gICAgICAgICAgICBjb25uZWN0aW9uLmVuZFNwaGVyZU1hdGVyaWFsLm9wYWNpdHkgPSBvcGFjaXR5O1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZUVuZFNwaGVyZShjb25uZWN0aW9uLCBsaW5lLCBmdWxsUG9pbnRzLCBvcGFjaXR5KSB7XG4gICAgICAgIGNvbnN0IGVuZFNwaGVyZUdlb20gPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoMiwgOCwgOCk7XG4gICAgICAgIGNvbnN0IGVuZFNwaGVyZU1hdCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICAgICAgICBjb2xvcjogbmV3IFRIUkVFLkNvbG9yKDEsIDAuOSwgMC40KSxcbiAgICAgICAgICAgIHRyYW5zcGFyZW50OiB0cnVlLFxuICAgICAgICAgICAgb3BhY2l0eTogb3BhY2l0eVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZW5kU3BoZXJlID0gbmV3IFRIUkVFLk1lc2goZW5kU3BoZXJlR2VvbSwgZW5kU3BoZXJlTWF0KTtcbiAgICAgICAgZW5kU3BoZXJlLnBvc2l0aW9uLmNvcHkoZnVsbFBvaW50c1tmdWxsUG9pbnRzLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgdGhpcy5nbG9iZUdyb3VwLmFkZChlbmRTcGhlcmUpO1xuICAgICAgICBcbiAgICAgICAgY29ubmVjdGlvbi5lbmRTcGhlcmUgPSBlbmRTcGhlcmU7XG4gICAgICAgIGNvbm5lY3Rpb24uZW5kU3BoZXJlTWF0ZXJpYWwgPSBlbmRTcGhlcmVNYXQ7XG4gICAgICAgIGxpbmUudXNlckRhdGEuZW5kUG9pbnRDcmVhdGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgXG4gICAgc3RhcnRBbmltYXRpb24oKSB7XG4gICAgICAgIGxldCB0YXJnZXRSb3RhdGlvblkgPSAwO1xuICAgICAgICBsZXQgY3VycmVudFJvdGF0aW9uWSA9IDA7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBhbmltYXRlID0gKGN1cnJlbnRUaW1lKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFuaW1hdGlvbklkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBGUFMgbW9uaXRvcmluZyBhbmQgZnJhbWUgc2tpcHBpbmcgZm9yIG1vYmlsZVxuICAgICAgICAgICAgY29uc3QgZGVsdGFUaW1lID0gKGN1cnJlbnRUaW1lIC0gdGhpcy5sYXN0VGltZSkgLyAxMDAwO1xuICAgICAgICAgICAgY29uc3QgZnBzID0gMSAvIGRlbHRhVGltZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHRoaXMuaXNNb2JpbGUgJiYgdGhpcy5hZGFwdGl2ZVF1YWxpdHkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZwc0hpc3RvcnkucHVzaChmcHMpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZwc0hpc3RvcnkubGVuZ3RoID4gMzApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mcHNIaXN0b3J5LnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIFNraXAgZnJhbWVzIG9uIG1vYmlsZSBpZiBwZXJmb3JtYW5jZSBpcyBwb29yXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZnBzSGlzdG9yeS5sZW5ndGggPiAxMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdmdGUFMgPSB0aGlzLmZwc0hpc3RvcnkucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCkgLyB0aGlzLmZwc0hpc3RvcnkubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXZnRlBTIDwgMjUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZnJhbWVTa2lwKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5mcmFtZVNraXAgJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0VGltZSA9IGN1cnJlbnRUaW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZnJhbWVTa2lwID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5sYXN0VGltZSA9IGN1cnJlbnRUaW1lO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBTbG93ZXIgcm90YXRpb24gb24gbW9iaWxlIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2VcbiAgICAgICAgICAgIHRhcmdldFJvdGF0aW9uWSArPSB0aGlzLmlzTW9iaWxlID8gMC4wMDEgOiAwLjAwMTU7XG4gICAgICAgICAgICBjdXJyZW50Um90YXRpb25ZID0gdGFyZ2V0Um90YXRpb25ZO1xuICAgICAgICAgICAgdGhpcy5nbG9iZUdyb3VwLnJvdGF0aW9uLnkgPSBjdXJyZW50Um90YXRpb25ZO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUR5bmFtaWNQb2ludHMoZGVsdGFUaW1lKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5wb2ludFNwYXduVGltZXIgKz0gZGVsdGFUaW1lO1xuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRTcGF3blRpbWVyID49IHRoaXMucG9pbnRTcGF3bkludGVydmFsICYmIHRoaXMuZHluYW1pY1BvaW50cy5sZW5ndGggPCB0aGlzLm1heER5bmFtaWNQb2ludHMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUR5bmFtaWNDb25uZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludFNwYXduVGltZXIgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlcih0aGlzLnNjZW5lLCB0aGlzLmNhbWVyYSk7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBhbmltYXRlKDApO1xuICAgIH1cbiAgICBcbiAgICBzZXR1cEV2ZW50TGlzdGVuZXJzKCkge1xuICAgICAgICBjb25zdCBoYW5kbGVSZXNpemUgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuZXdNYXhTaXplID0gd2luZG93LmlubmVySGVpZ2h0ICogMS4yO1xuICAgICAgICAgICAgaWYgKHRoaXMucmVuZGVyZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFNpemUobmV3TWF4U2l6ZSwgbmV3TWF4U2l6ZSk7XG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIG1vYmlsZSBkZXRlY3Rpb24gb24gcmVzaXplXG4gICAgICAgICAgICAgICAgdGhpcy5pc01vYmlsZSA9IHdpbmRvdy5pbm5lcldpZHRoIDwgNzY4O1xuICAgICAgICAgICAgICAgIC8vIEFkanVzdCBxdWFsaXR5IHNldHRpbmdzIGJhc2VkIG9uIG5ldyB2aWV3cG9ydFxuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UGl4ZWxSYXRpbyh0aGlzLmlzTW9iaWxlID8gMSA6IE1hdGgubWluKHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvLCAyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBsZXQgcmVzaXplVGltZW91dDtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChyZXNpemVUaW1lb3V0KTtcbiAgICAgICAgICAgIHJlc2l6ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KGhhbmRsZVJlc2l6ZSwgMjUwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgKCkgPT4gdGhpcy5kZXN0cm95KCkpO1xuICAgICAgICBcbiAgICAgICAgLy8gUGF1c2UgYW5pbWF0aW9uIHdoZW4gdGFiIGlzIG5vdCB2aXNpYmxlXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoZG9jdW1lbnQuaGlkZGVuKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYW5pbWF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5hbmltYXRpb25JZCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYW5pbWF0aW9uSWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmFuaW1hdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhcnRBbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBkZXN0cm95KCkge1xuICAgICAgICBpZiAodGhpcy5hbmltYXRpb25JZCkge1xuICAgICAgICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5hbmltYXRpb25JZCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuc2NlbmU/LnRyYXZlcnNlKChvYmplY3QpID0+IHtcbiAgICAgICAgICAgIGlmIChvYmplY3QuZ2VvbWV0cnkpIG9iamVjdC5nZW9tZXRyeS5kaXNwb3NlKCk7XG4gICAgICAgICAgICBpZiAob2JqZWN0Lm1hdGVyaWFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqZWN0Lm1hdGVyaWFsKSkge1xuICAgICAgICAgICAgICAgICAgICBvYmplY3QubWF0ZXJpYWwuZm9yRWFjaChtYXRlcmlhbCA9PiBtYXRlcmlhbC5kaXNwb3NlKCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9iamVjdC5tYXRlcmlhbC5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMucmVuZGVyZXI/LmRpc3Bvc2UoKTtcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLmNvbnRhaW5lciAmJiB0aGlzLnJlbmRlcmVyKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLnJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxufSIsICIvKipcbiAqIE1haW4gYXBwbGljYXRpb24gZW50cnkgcG9pbnRcbiAqIEluaXRpYWxpemVzIGFsbCBtb2R1bGVzIGFuZCBtYW5hZ2VzIGFwcGxpY2F0aW9uIGxpZmVjeWNsZVxuICovXG5cbmltcG9ydCB7IFRoZW1lTWFuYWdlciB9IGZyb20gJy4vdGhlbWUuanMnO1xuaW1wb3J0IHsgQW5pbWF0aW9uTWFuYWdlciB9IGZyb20gJy4vYW5pbWF0aW9ucy5qcyc7XG5pbXBvcnQgeyBHbG9iZU1hbmFnZXIgfSBmcm9tICcuL2dsb2JlLmpzJztcblxuY2xhc3MgQXBwIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy50aGVtZU1hbmFnZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbk1hbmFnZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmdsb2JlTWFuYWdlciA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvLyBXYWl0IGZvciBET00gdG8gYmUgcmVhZHlcbiAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykge1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHRoaXMuaW5pdCgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGluaXQoKSB7XG4gICAgICAgIC8vIEhhbmRsZSBzY3JvbGwgcmVzdG9yYXRpb25cbiAgICAgICAgdGhpcy5zZXR1cFNjcm9sbFJlc3RvcmF0aW9uKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBJbml0aWFsaXplIGxvYWRpbmcgc2VxdWVuY2VcbiAgICAgICAgdGhpcy5oYW5kbGVMb2FkaW5nKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBJbml0aWFsaXplIG1vZHVsZXNcbiAgICAgICAgdGhpcy50aGVtZU1hbmFnZXIgPSBuZXcgVGhlbWVNYW5hZ2VyKCk7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9uTWFuYWdlciA9IG5ldyBBbmltYXRpb25NYW5hZ2VyKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBPbmx5IGluaXRpYWxpemUgZ2xvYmUgb24gZGVza3RvcFxuICAgICAgICBjb25zdCBpc01vYmlsZSA9IHdpbmRvdy5pbm5lcldpZHRoIDwgNzY4O1xuICAgICAgICBpZiAoIWlzTW9iaWxlKSB7XG4gICAgICAgICAgICB0aGlzLmdsb2JlTWFuYWdlciA9IG5ldyBHbG9iZU1hbmFnZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gU2V0IGN1cnJlbnQgeWVhciBpbiBmb290ZXJcbiAgICAgICAgdGhpcy5zZXRDdXJyZW50WWVhcigpO1xuICAgICAgICBcbiAgICAgICAgLy8gU2V0dXAgc21vb3RoIHNjcm9sbGluZ1xuICAgICAgICB0aGlzLnNldHVwU21vb3RoU2Nyb2xsaW5nKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBTZXR1cCBtb2JpbGUgbWVudVxuICAgICAgICB0aGlzLnNldHVwTW9iaWxlTWVudSgpO1xuICAgICAgICBcbiAgICAgICAgLy8gQWRkIGFjY2Vzc2liaWxpdHkgaW1wcm92ZW1lbnRzXG4gICAgICAgIHRoaXMuaW1wcm92ZUFjY2Vzc2liaWxpdHkoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEVuYWJsZSBuYXRpdmUgc2Nyb2xsXG4gICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnYXV0byc7XG4gICAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCAwKTtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZ3NhcCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGdzYXAucmVnaXN0ZXJQbHVnaW4oU2Nyb2xsVHJpZ2dlcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaGFuZGxlTG9hZGluZygpIHtcbiAgICAgICAgLy8gSGFuZGxlIGxvYWRpbmcgb3ZlcmxheVxuICAgICAgICBjb25zdCBsb2FkaW5nT3ZlcmxheSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5sb2FkaW5nLW92ZXJsYXknKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFNldCBhIG1heGltdW0gbG9hZGluZyB0aW1lXG4gICAgICAgIGNvbnN0IG1heExvYWRUaW1lID0gMzAwMDtcbiAgICAgICAgbGV0IGxvYWRpbmdDb21wbGV0ZSA9IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgaGlkZUxvYWRlciA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChsb2FkaW5nQ29tcGxldGUpIHJldHVybjtcbiAgICAgICAgICAgIGxvYWRpbmdDb21wbGV0ZSA9IHRydWU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChsb2FkaW5nT3ZlcmxheSkge1xuICAgICAgICAgICAgICAgIGxvYWRpbmdPdmVybGF5LmNsYXNzTGlzdC5hZGQoJ2ZhZGUtb3V0Jyk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdPdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gU2hvdyBib2R5IGNvbnRlbnRcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnbG9hZGVkJyk7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyBIaWRlIGxvYWRlciB3aGVuIGV2ZXJ5dGhpbmcgaXMgcmVhZHlcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBoaWRlTG9hZGVyKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEZvcmNlIGhpZGUgbG9hZGVyIGFmdGVyIG1heCB0aW1lXG4gICAgICAgIHNldFRpbWVvdXQoaGlkZUxvYWRlciwgbWF4TG9hZFRpbWUpO1xuICAgIH1cbiAgICBcbiAgICBzZXR1cFNjcm9sbFJlc3RvcmF0aW9uKCkge1xuICAgICAgICAvLyBSZXNldCBzY3JvbGwgcG9zaXRpb24gaW1tZWRpYXRlbHlcbiAgICAgICAgaWYgKGhpc3Rvcnkuc2Nyb2xsUmVzdG9yYXRpb24pIHtcbiAgICAgICAgICAgIGhpc3Rvcnkuc2Nyb2xsUmVzdG9yYXRpb24gPSAnbWFudWFsJztcbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgMCk7XG4gICAgfVxuICAgIFxuICAgIHNldEN1cnJlbnRZZWFyKCkge1xuICAgICAgICBjb25zdCB5ZWFyRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdXJyZW50LXllYXInKTtcbiAgICAgICAgaWYgKHllYXJFbGVtZW50KSB7XG4gICAgICAgICAgICB5ZWFyRWxlbWVudC50ZXh0Q29udGVudCA9IG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdZZWFyIHNldCB0bzonLCBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2N1cnJlbnQteWVhciBlbGVtZW50IG5vdCBmb3VuZCcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHNldHVwU21vb3RoU2Nyb2xsaW5nKCkge1xuICAgICAgICAvLyBBZGQgc21vb3RoIHNjcm9sbGluZyB0byBhbmNob3IgbGlua3NcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnYVtocmVmXj1cIiNcIl0nKS5mb3JFYWNoKGFuY2hvciA9PiB7XG4gICAgICAgICAgICBhbmNob3IuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGFuY2hvci5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBoZWFkZXJIZWlnaHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdoZWFkZXInKS5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFBvc2l0aW9uID0gdGFyZ2V0Lm9mZnNldFRvcCAtIGhlYWRlckhlaWdodCAtIDIwO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogdGFyZ2V0UG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBiZWhhdmlvcjogJ3Ntb290aCdcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBzZXR1cE1vYmlsZU1lbnUoKSB7XG4gICAgICAgIGNvbnN0IG1vYmlsZU1lbnVCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdidXR0b25bb25jbGljayo9XCJtb2JpbGUtbWVudVwiXScpO1xuICAgICAgICBjb25zdCBtb2JpbGVNZW51ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vYmlsZS1tZW51Jyk7XG4gICAgICAgIFxuICAgICAgICBpZiAobW9iaWxlTWVudUJ1dHRvbiAmJiBtb2JpbGVNZW51KSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgaW5saW5lIG9uY2xpY2sgYW5kIHVzZSBldmVudCBsaXN0ZW5lclxuICAgICAgICAgICAgbW9iaWxlTWVudUJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ29uY2xpY2snKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbW9iaWxlTWVudUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpc0hpZGRlbiA9IG1vYmlsZU1lbnUuY2xhc3NMaXN0LmNvbnRhaW5zKCdoaWRkZW4nKTtcbiAgICAgICAgICAgICAgICBtb2JpbGVNZW51LmNsYXNzTGlzdC50b2dnbGUoJ2hpZGRlbicpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBBUklBIGF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgICBtb2JpbGVNZW51QnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsIGlzSGlkZGVuKTtcbiAgICAgICAgICAgICAgICBtb2JpbGVNZW51QnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIGlzSGlkZGVuID8gJ0Nsb3NlIG1lbnUnIDogJ09wZW4gbWVudScpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIENsb3NlIG1vYmlsZSBtZW51IHdoZW4gY2xpY2tpbmcgb24gYSBsaW5rXG4gICAgICAgICAgICBtb2JpbGVNZW51LnF1ZXJ5U2VsZWN0b3JBbGwoJ2EnKS5mb3JFYWNoKGxpbmsgPT4ge1xuICAgICAgICAgICAgICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG1vYmlsZU1lbnUuY2xhc3NMaXN0LmFkZCgnaGlkZGVuJyk7XG4gICAgICAgICAgICAgICAgICAgIG1vYmlsZU1lbnVCdXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpbXByb3ZlQWNjZXNzaWJpbGl0eSgpIHtcbiAgICAgICAgLy8gQWRkIHNraXAgbGluayBmb3Iga2V5Ym9hcmQgbmF2aWdhdGlvblxuICAgICAgICBjb25zdCBza2lwTGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgc2tpcExpbmsuaHJlZiA9ICcjbWFpbi1jb250ZW50JztcbiAgICAgICAgc2tpcExpbmsuY2xhc3NOYW1lID0gJ3NyLW9ubHkgZm9jdXM6bm90LXNyLW9ubHkgZm9jdXM6YWJzb2x1dGUgZm9jdXM6dG9wLTQgZm9jdXM6bGVmdC00IGJnLWdyYXktODAwIHRleHQtd2hpdGUgcHgtNCBweS0yIHJvdW5kZWQgei01MCc7XG4gICAgICAgIHNraXBMaW5rLnRleHRDb250ZW50ID0gJ1NraXAgdG8gbWFpbiBjb250ZW50JztcbiAgICAgICAgZG9jdW1lbnQuYm9keS5pbnNlcnRCZWZvcmUoc2tpcExpbmssIGRvY3VtZW50LmJvZHkuZmlyc3RDaGlsZCk7XG4gICAgICAgIFxuICAgICAgICAvLyBBZGQgbWFpbiBjb250ZW50IGxhbmRtYXJrXG4gICAgICAgIGNvbnN0IG1haW5TZWN0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcignc2VjdGlvbi5yZWxhdGl2ZScpO1xuICAgICAgICBpZiAobWFpblNlY3Rpb24pIHtcbiAgICAgICAgICAgIG1haW5TZWN0aW9uLnNldEF0dHJpYnV0ZSgnaWQnLCAnbWFpbi1jb250ZW50Jyk7XG4gICAgICAgICAgICBtYWluU2VjdGlvbi5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnbWFpbicpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBBZGQgQVJJQSBsYWJlbHMgdG8gbmF2aWdhdGlvblxuICAgICAgICBjb25zdCBuYXYgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCduYXYnKTtcbiAgICAgICAgaWYgKG5hdikge1xuICAgICAgICAgICAgbmF2LnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsICdNYWluIG5hdmlnYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gQWRkIEFSSUEgbGFiZWxzIHRvIHNvY2lhbCBsaW5rc1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdhW2hyZWYqPVwibGlua2VkaW5cIl0nKS5mb3JFYWNoKGxpbmsgPT4ge1xuICAgICAgICAgICAgbGluay5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCAnTGlua2VkSW4gcHJvZmlsZScpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIE1ha2UgZGVjb3JhdGl2ZSBTVkdzIGhpZGRlbiBmcm9tIHNjcmVlbiByZWFkZXJzXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3N2ZycpLmZvckVhY2goc3ZnID0+IHtcbiAgICAgICAgICAgIGlmICghc3ZnLmNsb3Nlc3QoJ2J1dHRvbicpICYmICFzdmcuY2xvc2VzdCgnYScpKSB7XG4gICAgICAgICAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIEFkZCBhbHQgdGV4dCB0byBwYXJ0bmVyIGxvZ29zXG4gICAgICAgIGNvbnN0IHBhcnRuZXJMb2dvcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wYXJ0bmVyLWxvZ28nKS5mb3JFYWNoKChsb2dvLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gbG9nby5jbG9zZXN0KCdzdmcnKTtcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnQuc2V0QXR0cmlidXRlKCdyb2xlJywgJ2ltZycpO1xuICAgICAgICAgICAgICAgIHBhcmVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCBgUGFydG5lciBsb2dvICR7aW5kZXggKyAxfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gQ2xlYW4gdXAgcmVzb3VyY2VzIHdoZW4gbmVlZGVkXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25NYW5hZ2VyPy5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuZ2xvYmVNYW5hZ2VyPy5kZXN0cm95KCk7XG4gICAgfVxufVxuXG4vLyBJbml0aWFsaXplIGFwcFxuY29uc3QgYXBwID0gbmV3IEFwcCgpO1xuXG4vLyBFeHBvcnQgZm9yIGV4dGVybmFsIHVzZSBpZiBuZWVkZWRcbndpbmRvdy5Ccmltc3RvbmVBcHAgPSBhcHA7Il0sCiAgIm1hcHBpbmdzIjogIjs7O0FBS08sTUFBTSxlQUFOLE1BQW1CO0FBQUEsSUFDdEIsY0FBYztBQUNWLFdBQUssY0FBYyxTQUFTLGVBQWUsY0FBYztBQUN6RCxXQUFLLFdBQVcsU0FBUyxl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
