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
      this.isLowEndDevice = this.detectLowEndDevice();
      this.splitCompleted = 0;
      this.showContentCallback = null;
      this.lenis = null;
      this.init();
    }
    detectLowEndDevice() {
      const deviceMemory = navigator.deviceMemory || 4;
      const cores = navigator.hardwareConcurrency || 4;
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const slowConnection = connection && (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g");
      return deviceMemory < 4 || cores < 4 || slowConnection;
    }
    init() {
      if (this.prefersReducedMotion || this.isLowEndDevice) {
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
      if (isMobile || this.isLowEndDevice)
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
          const durationMultiplier = this.isLowEndDevice ? 0.5 : 1;
          const animationDuration = (isFastReveal ? 0.2 : isFirstSection ? 0.4 : 0.8) * durationMultiplier;
          const animationStagger = (isFastReveal ? 0.02 : isFirstSection ? 0.05 : 0.1) * durationMultiplier;
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
      if (isMobile || this.isLowEndDevice)
        return;
      const founderPhotos = document.querySelectorAll(".founder-card > div:first-child > img");
      founderPhotos.forEach((photo) => {
        gsap.set(photo, {
          scale: 1.1,
          transformOrigin: "center center",
          yPercent: -10
        });
        gsap.fromTo(
          photo,
          {
            yPercent: -10
          },
          {
            yPercent: 10,
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
      this.threeLoaded = false;
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
    async init() {
      if (this.isMobile || this.prefersReducedMotion || this.isLowEndDevice) {
        return;
      }
      if (typeof THREE === "undefined") {
        try {
          await this.loadThreeJS();
        } catch (error) {
          console.error("Failed to load Three.js:", error);
          return;
        }
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
    loadThreeJS() {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
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

  // src/js/performance.js
  var PerformanceMonitor = class {
    constructor() {
      this.metrics = {
        fps: [],
        memory: null,
        connectionType: null,
        deviceType: null
      };
      this.isLowPerformance = false;
      this.callbacks = /* @__PURE__ */ new Set();
      this.init();
    }
    init() {
      this.detectDeviceCapabilities();
      this.startFPSMonitoring();
      this.monitorCoreWebVitals();
      setInterval(() => this.checkPerformance(), 5e3);
    }
    detectDeviceCapabilities() {
      this.metrics.memory = navigator.deviceMemory || 4;
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        this.metrics.connectionType = connection.effectiveType;
      }
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLowMemory = this.metrics.memory < 4;
      const isSlow = this.metrics.connectionType === "slow-2g" || this.metrics.connectionType === "2g";
      const cores = navigator.hardwareConcurrency || 4;
      this.metrics.deviceType = {
        mobile: isMobile,
        lowMemory: isLowMemory,
        slowConnection: isSlow,
        lowCores: cores < 4
      };
      this.isLowPerformance = isMobile || isLowMemory || isSlow || cores < 4;
    }
    startFPSMonitoring() {
      let lastTime = performance.now();
      let frames = 0;
      const measureFPS = () => {
        frames++;
        const currentTime = performance.now();
        if (currentTime >= lastTime + 1e3) {
          const fps = Math.round(frames * 1e3 / (currentTime - lastTime));
          this.metrics.fps.push(fps);
          if (this.metrics.fps.length > 10) {
            this.metrics.fps.shift();
          }
          frames = 0;
          lastTime = currentTime;
        }
        requestAnimationFrame(measureFPS);
      };
      requestAnimationFrame(measureFPS);
    }
    monitorCoreWebVitals() {
      if ("PerformanceObserver" in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log("LCP:", lastEntry.renderTime || lastEntry.loadTime);
          });
          lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
        } catch (e) {
        }
        try {
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              console.log("FID:", entry.processingStart - entry.startTime);
            });
          });
          fidObserver.observe({ entryTypes: ["first-input"] });
        } catch (e) {
        }
        try {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
                console.log("CLS:", clsValue);
              }
            });
          });
          clsObserver.observe({ entryTypes: ["layout-shift"] });
        } catch (e) {
        }
      }
    }
    checkPerformance() {
      if (this.metrics.fps.length > 0) {
        const avgFPS = this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length;
        if (avgFPS < 30 && !this.isLowPerformance) {
          this.enableLowPerformanceMode();
        } else if (avgFPS > 50 && this.isLowPerformance && !this.metrics.deviceType.mobile) {
          this.disableLowPerformanceMode();
        }
      }
    }
    enableLowPerformanceMode() {
      if (this.isLowPerformance)
        return;
      this.isLowPerformance = true;
      console.log("Enabling low performance mode");
      this.callbacks.forEach((callback) => callback(true));
      document.body.classList.add("low-performance");
    }
    disableLowPerformanceMode() {
      if (!this.isLowPerformance)
        return;
      this.isLowPerformance = false;
      console.log("Disabling low performance mode");
      this.callbacks.forEach((callback) => callback(false));
      document.body.classList.remove("low-performance");
    }
    onPerformanceChange(callback) {
      this.callbacks.add(callback);
      callback(this.isLowPerformance);
    }
    getMetrics() {
      return {
        ...this.metrics,
        isLowPerformance: this.isLowPerformance,
        averageFPS: this.metrics.fps.length > 0 ? this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length : null
      };
    }
  };

  // src/js/main.js
  var App = class {
    constructor() {
      this.themeManager = null;
      this.animationManager = null;
      this.globeManager = null;
      this.performanceMonitor = null;
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.init());
      } else {
        this.init();
      }
    }
    init() {
      this.setupScrollRestoration();
      this.handleLoading();
      this.performanceMonitor = new PerformanceMonitor();
      this.themeManager = new ThemeManager();
      this.animationManager = new AnimationManager();
      const isMobile = window.innerWidth < 768;
      if (!isMobile && !this.performanceMonitor.isLowPerformance) {
        const globeContainer = document.getElementById("globe-container");
        if (globeContainer) {
          const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !this.globeManager) {
              this.globeManager = new GlobeManager();
              observer.disconnect();
            }
          }, { threshold: 0.1 });
          observer.observe(globeContainer);
        }
      }
      this.performanceMonitor.onPerformanceChange((isLowPerf) => {
        if (isLowPerf && this.globeManager) {
          this.globeManager.destroy();
          this.globeManager = null;
        }
      });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2pzL3RoZW1lLmpzIiwgIi4uL3NyYy9qcy9hbmltYXRpb25zLmpzIiwgIi4uL3NyYy9qcy9nbG9iZS5qcyIsICIuLi9zcmMvanMvcGVyZm9ybWFuY2UuanMiLCAiLi4vc3JjL2pzL21haW4uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogVGhlbWUgbWFuYWdlbWVudCBtb2R1bGVcbiAqIEhhbmRsZXMgZGFyay9saWdodCBtb2RlIHN3aXRjaGluZyB3aXRoIGxvY2FsU3RvcmFnZSBwZXJzaXN0ZW5jZVxuICovXG5cbmV4cG9ydCBjbGFzcyBUaGVtZU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnRoZW1lVG9nZ2xlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RoZW1lLXRvZ2dsZScpO1xuICAgICAgICB0aGlzLm1vb25JY29uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vb24taWNvbicpO1xuICAgICAgICB0aGlzLnN1bkljb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3VuLWljb24nKTtcbiAgICAgICAgdGhpcy5odG1sID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuICAgIFxuICAgIGluaXQoKSB7XG4gICAgICAgIC8vIENoZWNrIGZvciBzYXZlZCB0aGVtZSBwcmVmZXJlbmNlIG9yIGRlZmF1bHQgdG8gZGFya1xuICAgICAgICBjb25zdCBjdXJyZW50VGhlbWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndGhlbWUnKSB8fCAnZGFyayc7XG4gICAgICAgIHRoaXMuc2V0VGhlbWUoY3VycmVudFRoZW1lKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lciBmb3IgdGhlbWUgdG9nZ2xlXG4gICAgICAgIGlmICh0aGlzLnRoZW1lVG9nZ2xlKSB7XG4gICAgICAgICAgICB0aGlzLnRoZW1lVG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy50b2dnbGVUaGVtZSgpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQWRkIEFSSUEgYXR0cmlidXRlcyBmb3IgYWNjZXNzaWJpbGl0eVxuICAgICAgICAgICAgdGhpcy50aGVtZVRvZ2dsZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCAnVG9nZ2xlIHRoZW1lJyk7XG4gICAgICAgICAgICB0aGlzLnRoZW1lVG9nZ2xlLnNldEF0dHJpYnV0ZSgnYXJpYS1wcmVzc2VkJywgY3VycmVudFRoZW1lID09PSAnbGlnaHQnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBzZXRUaGVtZSh0aGVtZSkge1xuICAgICAgICBpZiAodGhlbWUgPT09ICdsaWdodCcpIHtcbiAgICAgICAgICAgIHRoaXMuaHRtbC5jbGFzc0xpc3QuYWRkKCdsaWdodCcpO1xuICAgICAgICAgICAgdGhpcy5tb29uSWNvbj8uY2xhc3NMaXN0LmFkZCgnaGlkZGVuJyk7XG4gICAgICAgICAgICB0aGlzLnN1bkljb24/LmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5odG1sLmNsYXNzTGlzdC5yZW1vdmUoJ2xpZ2h0Jyk7XG4gICAgICAgICAgICB0aGlzLm1vb25JY29uPy5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTtcbiAgICAgICAgICAgIHRoaXMuc3VuSWNvbj8uY2xhc3NMaXN0LmFkZCgnaGlkZGVuJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0aGVtZScsIHRoZW1lKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFVwZGF0ZSBBUklBIGF0dHJpYnV0ZVxuICAgICAgICBpZiAodGhpcy50aGVtZVRvZ2dsZSkge1xuICAgICAgICAgICAgdGhpcy50aGVtZVRvZ2dsZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtcHJlc3NlZCcsIHRoZW1lID09PSAnbGlnaHQnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICB0b2dnbGVUaGVtZSgpIHtcbiAgICAgICAgY29uc3QgY3VycmVudFRoZW1lID0gdGhpcy5odG1sLmNsYXNzTGlzdC5jb250YWlucygnbGlnaHQnKSA/ICdsaWdodCcgOiAnZGFyayc7XG4gICAgICAgIGNvbnN0IG5ld1RoZW1lID0gY3VycmVudFRoZW1lID09PSAnbGlnaHQnID8gJ2RhcmsnIDogJ2xpZ2h0JztcbiAgICAgICAgdGhpcy5zZXRUaGVtZShuZXdUaGVtZSk7XG4gICAgfVxuICAgIFxuICAgIGdldEN1cnJlbnRUaGVtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaHRtbC5jbGFzc0xpc3QuY29udGFpbnMoJ2xpZ2h0JykgPyAnbGlnaHQnIDogJ2RhcmsnO1xuICAgIH1cbn0iLCAiLyoqXG4gKiBBbmltYXRpb24gbWFuYWdlbWVudCBtb2R1bGVcbiAqIEhhbmRsZXMgR1NBUCBhbmltYXRpb25zIGFuZCBTY3JvbGxUcmlnZ2VyIGVmZmVjdHNcbiAqL1xuXG5leHBvcnQgY2xhc3MgQW5pbWF0aW9uTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucHJlZmVyc1JlZHVjZWRNb3Rpb24gPSB3aW5kb3cubWF0Y2hNZWRpYSgnKHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSknKS5tYXRjaGVzO1xuICAgICAgICB0aGlzLmlzTG93RW5kRGV2aWNlID0gdGhpcy5kZXRlY3RMb3dFbmREZXZpY2UoKTtcbiAgICAgICAgdGhpcy5zcGxpdENvbXBsZXRlZCA9IDA7XG4gICAgICAgIHRoaXMuc2hvd0NvbnRlbnRDYWxsYmFjayA9IG51bGw7XG4gICAgICAgIHRoaXMubGVuaXMgPSBudWxsO1xuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG4gICAgXG4gICAgZGV0ZWN0TG93RW5kRGV2aWNlKCkge1xuICAgICAgICAvLyBDaGVjayBkZXZpY2UgbWVtb3J5IChsb3ctZW5kIHR5cGljYWxseSA8IDRHQilcbiAgICAgICAgY29uc3QgZGV2aWNlTWVtb3J5ID0gbmF2aWdhdG9yLmRldmljZU1lbW9yeSB8fCA0O1xuICAgICAgICAvLyBDaGVjayBDUFUgY29yZXNcbiAgICAgICAgY29uc3QgY29yZXMgPSBuYXZpZ2F0b3IuaGFyZHdhcmVDb25jdXJyZW5jeSB8fCA0O1xuICAgICAgICAvLyBDaGVjayBjb25uZWN0aW9uIHNwZWVkXG4gICAgICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBuYXZpZ2F0b3IuY29ubmVjdGlvbiB8fCBuYXZpZ2F0b3IubW96Q29ubmVjdGlvbiB8fCBuYXZpZ2F0b3Iud2Via2l0Q29ubmVjdGlvbjtcbiAgICAgICAgY29uc3Qgc2xvd0Nvbm5lY3Rpb24gPSBjb25uZWN0aW9uICYmIChjb25uZWN0aW9uLmVmZmVjdGl2ZVR5cGUgPT09ICdzbG93LTJnJyB8fCBjb25uZWN0aW9uLmVmZmVjdGl2ZVR5cGUgPT09ICcyZycpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGRldmljZU1lbW9yeSA8IDQgfHwgY29yZXMgPCA0IHx8IHNsb3dDb25uZWN0aW9uO1xuICAgIH1cbiAgICBcbiAgICBpbml0KCkge1xuICAgICAgICBpZiAodGhpcy5wcmVmZXJzUmVkdWNlZE1vdGlvbiB8fCB0aGlzLmlzTG93RW5kRGV2aWNlKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dDb250ZW50SW1tZWRpYXRlbHkoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gUmVnaXN0ZXIgU2Nyb2xsVHJpZ2dlciBwbHVnaW5cbiAgICAgICAgZ3NhcC5yZWdpc3RlclBsdWdpbihTY3JvbGxUcmlnZ2VyKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgTGVuaXMgc21vb3RoIHNjcm9sbGluZ1xuICAgICAgICB0aGlzLmluaXRMZW5pcygpO1xuICAgICAgICBcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBhbmltYXRpb25zXG4gICAgICAgIHRoaXMuaW5pdFRleHRBbmltYXRpb25zKCk7XG4gICAgICAgIHRoaXMuaW5pdFNjcm9sbEFuaW1hdGlvbnMoKTtcbiAgICAgICAgdGhpcy5pbml0RmVhdHVyZUNhcmRzKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBTZXR1cCBzaG93IGNvbnRlbnQgY2FsbGJhY2sgZm9yIGxvYWRpbmcgc2VxdWVuY2VcbiAgICAgICAgdGhpcy5zaG93Q29udGVudENhbGxiYWNrID0gdGhpcy5zaG93Q29udGVudC5iaW5kKHRoaXMpO1xuICAgICAgICBcbiAgICAgICAgLy8gUmVmcmVzaCBTY3JvbGxUcmlnZ2VyIGFmdGVyIHNldHVwXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gU2Nyb2xsVHJpZ2dlci5yZWZyZXNoKCksIDEwMCk7XG4gICAgfVxuICAgIFxuICAgIGluaXRMZW5pcygpIHtcbiAgICAgICAgLy8gU2tpcCBvbiBtb2JpbGUgYW5kIGxvdy1lbmQgZGV2aWNlcyBmb3IgcGVyZm9ybWFuY2VcbiAgICAgICAgY29uc3QgaXNNb2JpbGUgPSB3aW5kb3cuaW5uZXJXaWR0aCA8IDc2ODtcbiAgICAgICAgaWYgKGlzTW9iaWxlIHx8IHRoaXMuaXNMb3dFbmREZXZpY2UpIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIC8vIENoZWNrIGlmIExlbmlzIGlzIGF2YWlsYWJsZVxuICAgICAgICBpZiAodHlwZW9mIExlbmlzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdMZW5pcyBub3QgYXZhaWxhYmxlLCBmYWxsaW5nIGJhY2sgdG8gbmF0aXZlIHNjcm9sbCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBDcmVhdGUgTGVuaXMgaW5zdGFuY2VcbiAgICAgICAgdGhpcy5sZW5pcyA9IG5ldyBMZW5pcyh7XG4gICAgICAgICAgICBkdXJhdGlvbjogMS4yLFxuICAgICAgICAgICAgZWFzaW5nOiAodCkgPT4gTWF0aC5taW4oMSwgMS4wMDEgLSBNYXRoLnBvdygyLCAtMTAgKiB0KSksXG4gICAgICAgICAgICBkaXJlY3Rpb246ICd2ZXJ0aWNhbCcsXG4gICAgICAgICAgICBnZXN0dXJlRGlyZWN0aW9uOiAndmVydGljYWwnLFxuICAgICAgICAgICAgc21vb3RoOiB0cnVlLFxuICAgICAgICAgICAgbW91c2VNdWx0aXBsaWVyOiAxLFxuICAgICAgICAgICAgc21vb3RoVG91Y2g6IGZhbHNlLFxuICAgICAgICAgICAgdG91Y2hNdWx0aXBsaWVyOiAyLFxuICAgICAgICAgICAgaW5maW5pdGU6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gQ29ubmVjdCBMZW5pcyB0byBHU0FQIFNjcm9sbFRyaWdnZXJcbiAgICAgICAgdGhpcy5sZW5pcy5vbignc2Nyb2xsJywgU2Nyb2xsVHJpZ2dlci51cGRhdGUpO1xuICAgICAgICBcbiAgICAgICAgZ3NhcC50aWNrZXIuYWRkKCh0aW1lKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxlbmlzLnJhZih0aW1lICogMTAwMCk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgZ3NhcC50aWNrZXIubGFnU21vb3RoaW5nKDApO1xuICAgICAgICBcbiAgICAgICAgLy8gSGFuZGxlIGFuY2hvciBsaW5rc1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdhW2hyZWZePVwiI1wiXScpLmZvckVhY2goYW5jaG9yID0+IHtcbiAgICAgICAgICAgIGFuY2hvci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYW5jaG9yLmdldEF0dHJpYnV0ZSgnaHJlZicpKTtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0ICYmIHRoaXMubGVuaXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sZW5pcy5zY3JvbGxUbyh0YXJnZXQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDogLTgwLCAvLyBBY2NvdW50IGZvciBmaXhlZCBoZWFkZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAxLjVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gUmVmcmVzaCBMZW5pcyBvbiB3aW5kb3cgcmVzaXplXG4gICAgICAgIGxldCByZXNpemVUaW1lcjtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChyZXNpemVUaW1lcik7XG4gICAgICAgICAgICByZXNpemVUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxlbmlzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGVuaXMucmVzaXplKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMjUwKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHNob3dDb250ZW50SW1tZWRpYXRlbHkoKSB7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yZXZlYWwtdHlwZScpLmZvckVhY2goZWwgPT4ge1xuICAgICAgICAgICAgZWwuY2xhc3NMaXN0LmFkZCgnc3BsaXQtcmVhZHknKTtcbiAgICAgICAgICAgIGVsLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICAvLyBFbnN1cmUgYW55IGNoaWxkIGVsZW1lbnRzIGFyZSBhbHNvIHZpc2libGVcbiAgICAgICAgICAgIGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJyonKS5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICAgICAgICAgICAgICBjaGlsZC5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZmVhdHVyZS1jYXJkJykuZm9yRWFjaChlbCA9PiB7XG4gICAgICAgICAgICBlbC5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgZWwuc3R5bGUudHJhbnNmb3JtID0gJ25vbmUnO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zaG93Q29udGVudCgpO1xuICAgIH1cbiAgICBcbiAgICBzaG93Q29udGVudCgpIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdsb2FkZWQnKTtcbiAgICAgICAgY29uc3QgbG9hZGluZ092ZXJsYXkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubG9hZGluZy1vdmVybGF5Jyk7XG4gICAgICAgIGlmIChsb2FkaW5nT3ZlcmxheSkge1xuICAgICAgICAgICAgbG9hZGluZ092ZXJsYXkuY2xhc3NMaXN0LmFkZCgnZmFkZS1vdXQnKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gbG9hZGluZ092ZXJsYXkucmVtb3ZlKCksIDUwMCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaW5pdFRleHRBbmltYXRpb25zKCkge1xuICAgICAgICBjb25zdCBzcGxpdFR5cGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5yZXZlYWwtdHlwZVwiKTtcbiAgICAgICAgdGhpcy5zcGxpdENvbXBsZXRlZCA9IDA7XG4gICAgICAgIFxuICAgICAgICBpZiAoc3BsaXRUeXBlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5zaG93Q29udGVudCgpLCA1MDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBDaGVjayBpZiByZXF1aXJlZCBsaWJyYXJpZXMgYXJlIGF2YWlsYWJsZVxuICAgICAgICBpZiAodHlwZW9mIFNwbGl0VHlwZSA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIGdzYXAgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1NwbGl0VHlwZSBvciBHU0FQIG5vdCBhdmFpbGFibGUsIHNob3dpbmcgY29udGVudCBpbW1lZGlhdGVseScpO1xuICAgICAgICAgICAgc3BsaXRUeXBlcy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnc3BsaXQtcmVhZHknKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5zaG93Q29udGVudCgpLCAyMDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBzcGxpdFR5cGVzLmZvckVhY2goKGVsZW1lbnQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0VGV4dCA9IG5ldyBTcGxpdFR5cGUoZWxlbWVudCwge1xuICAgICAgICAgICAgICAgICAgICB0eXBlczogXCJ3b3JkcywgY2hhcnNcIlxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSBlbGVtZW50IGlzIHZpc2libGUgZmlyc3RcbiAgICAgICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3NwbGl0LXJlYWR5Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zcGxpdENvbXBsZXRlZCsrO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNwbGl0Q29tcGxldGVkID09PSBzcGxpdFR5cGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuc2hvd0NvbnRlbnQoKSwgMjAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3QgaXNGaXJzdFNlY3Rpb24gPSBlbGVtZW50LmNsb3Nlc3QoJ3NlY3Rpb24nKT8uY2xhc3NMaXN0LmNvbnRhaW5zKCdyZWxhdGl2ZScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzRmFzdFJldmVhbCA9IGVsZW1lbnQuZGF0YXNldC5yZXZlYWxTcGVlZCA9PT0gJ2Zhc3QnO1xuICAgICAgICAgICAgICAgIC8vIEZhc3RlciBhbmltYXRpb25zIG9uIGxvdy1lbmQgZGV2aWNlc1xuICAgICAgICAgICAgICAgIGNvbnN0IGR1cmF0aW9uTXVsdGlwbGllciA9IHRoaXMuaXNMb3dFbmREZXZpY2UgPyAwLjUgOiAxO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFuaW1hdGlvbkR1cmF0aW9uID0gKGlzRmFzdFJldmVhbCA/IDAuMiA6IChpc0ZpcnN0U2VjdGlvbiA/IDAuNCA6IDAuOCkpICogZHVyYXRpb25NdWx0aXBsaWVyO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFuaW1hdGlvblN0YWdnZXIgPSAoaXNGYXN0UmV2ZWFsID8gMC4wMiA6IChpc0ZpcnN0U2VjdGlvbiA/IDAuMDUgOiAwLjEpKSAqIGR1cmF0aW9uTXVsdGlwbGllcjtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBTZXQgaW5pdGlhbCBzdGF0ZSBmb3IgY2hhcmFjdGVyc1xuICAgICAgICAgICAgICAgIGdzYXAuc2V0KHNwbGl0VGV4dC5jaGFycywgeyBvcGFjaXR5OiAwLjIgfSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZ3NhcC50byhzcGxpdFRleHQuY2hhcnMsIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsVHJpZ2dlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcjogZWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBcInRvcCA4MCVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZUFjdGlvbnM6IFwicGxheSBub25lIG5vbmUgbm9uZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxlcjogd2luZG93XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICAgICAgICAgIHN0YWdnZXI6IGFuaW1hdGlvblN0YWdnZXIsXG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiBhbmltYXRpb25EdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogXCJwb3dlcjIub3V0XCJcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW5pdGlhbGl6aW5nIHRleHQgYW5pbWF0aW9uIGZvciBlbGVtZW50OicsIGVsZW1lbnQsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAvLyBGYWxsYmFjazogc2hvdyBlbGVtZW50IGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdzcGxpdC1yZWFkeScpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgICAgICAgICAgICB0aGlzLnNwbGl0Q29tcGxldGVkKys7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3BsaXRDb21wbGV0ZWQgPT09IHNwbGl0VHlwZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5zaG93Q29udGVudCgpLCAyMDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIGluaXRTY3JvbGxBbmltYXRpb25zKCkge1xuICAgICAgICAvLyBBbmltYXRlIHBhcmFncmFwaHMgKGV4Y2x1ZGluZyBzcGVjaWZpYyBhcmVhcylcbiAgICAgICAgY29uc3QgcGFyYWdyYXBocyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXG4gICAgICAgICAgICAncDpub3QoLmZlYXR1cmUtY2FyZCBwKTpub3QoLmNhcmVlcnMtY3RhIHApOm5vdChidXR0b24gcCk6bm90KGEgcCk6bm90KGZvb3RlciBwKSdcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIHBhcmFncmFwaHMuZm9yRWFjaChwID0+IHtcbiAgICAgICAgICAgIGdzYXAuc2V0KHAsIHsgb3BhY2l0eTogMCwgeTogMzAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGdzYXAudG8ocCwge1xuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogMSxcbiAgICAgICAgICAgICAgICBlYXNlOiBcInBvd2VyMi5vdXRcIixcbiAgICAgICAgICAgICAgICBzY3JvbGxUcmlnZ2VyOiB7XG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXI6IHAsXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBcInRvcCA4NSVcIixcbiAgICAgICAgICAgICAgICAgICAgb25jZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHRvZ2dsZUFjdGlvbnM6IFwicGxheSBub25lIG5vbmUgbm9uZVwiLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxlcjogd2luZG93XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBpbml0RmVhdHVyZUNhcmRzKCkge1xuICAgICAgICBpZiAodHlwZW9mIGdzYXAgPT09ICd1bmRlZmluZWQnKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICAvLyBTa2lwIGNhcmQgYW5pbWF0aW9ucyBvbiBtb2JpbGUgZGV2aWNlc1xuICAgICAgICBjb25zdCBpc01vYmlsZSA9IHdpbmRvdy5pbm5lcldpZHRoIDwgNzY4O1xuICAgICAgICBpZiAoaXNNb2JpbGUpIHtcbiAgICAgICAgICAgIC8vIFNob3cgY2FyZHMgaW1tZWRpYXRlbHkgb24gbW9iaWxlXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZmVhdHVyZS1jYXJkJykuZm9yRWFjaChjYXJkID0+IHtcbiAgICAgICAgICAgICAgICBjYXJkLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICAgICAgY2FyZC5zdHlsZS50cmFuc2Zvcm0gPSAnbm9uZSc7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGNhcmVlcnNDdGEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuY2FyZWVycy1jdGEnKTtcbiAgICAgICAgICAgIGlmIChjYXJlZXJzQ3RhKSB7XG4gICAgICAgICAgICAgICAgY2FyZWVyc0N0YS5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgICAgIGNhcmVlcnNDdGEuc3R5bGUudHJhbnNmb3JtID0gJ25vbmUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBJbml0aWFsaXplIGZvdW5kZXIgY2FyZCBhbmltYXRpb25zXG4gICAgICAgIHRoaXMuaW5pdEZvdW5kZXJDYXJkcygpO1xuICAgICAgICBcbiAgICAgICAgLy8gQW5pbWF0ZSBjYXJlZXIgY2FyZHMgc3BlY2lmaWNhbGx5XG4gICAgICAgIGNvbnN0IGNhcmVlckNhcmRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2NhcmVlcnMgLmZlYXR1cmUtY2FyZCcpO1xuICAgICAgICBjYXJlZXJDYXJkcy5mb3JFYWNoKChjYXJkLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgZ3NhcC5zZXQoY2FyZCwgeyBvcGFjaXR5OiAwLCB5OiA1MCB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZ3NhcC50byhjYXJkLCB7XG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAwLjgsXG4gICAgICAgICAgICAgICAgZGVsYXk6IGluZGV4ICogMC4xLFxuICAgICAgICAgICAgICAgIGVhc2U6IFwicG93ZXIyLm91dFwiLFxuICAgICAgICAgICAgICAgIHNjcm9sbFRyaWdnZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcjogY2FyZCxcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IFwidG9wIDg1JVwiLFxuICAgICAgICAgICAgICAgICAgICBvbmNlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdG9nZ2xlQWN0aW9uczogXCJwbGF5IG5vbmUgbm9uZSBub25lXCIsXG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbGVyOiB3aW5kb3dcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBBbmltYXRlIGNhcmVlcnMgQ1RBIHdpdGggY2FyZWVyIGNhcmRzXG4gICAgICAgIGNvbnN0IGNhcmVlcnNDdGEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuY2FyZWVycy1jdGEnKTtcbiAgICAgICAgaWYgKGNhcmVlcnNDdGEpIHtcbiAgICAgICAgICAgIGdzYXAuc2V0KGNhcmVlcnNDdGEsIHsgb3BhY2l0eTogMCwgeTogNTAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGdzYXAudG8oY2FyZWVyc0N0YSwge1xuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogMC44LFxuICAgICAgICAgICAgICAgIGRlbGF5OiAxLjIsIC8vIEFmdGVyIHRoZSAzIGNhcmVlciBjYXJkc1xuICAgICAgICAgICAgICAgIGVhc2U6IFwicG93ZXIyLm91dFwiLFxuICAgICAgICAgICAgICAgIHNjcm9sbFRyaWdnZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcjogY2FyZWVyQ2FyZHNbMF0gfHwgY2FyZWVyc0N0YSxcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IFwidG9wIDg1JVwiLFxuICAgICAgICAgICAgICAgICAgICBvbmNlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdG9nZ2xlQWN0aW9uczogXCJwbGF5IG5vbmUgbm9uZSBub25lXCIsXG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbGVyOiB3aW5kb3dcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gQW5pbWF0ZSBzZXJ2aWNlIGNhcmRzIHRvZ2V0aGVyIHdpdGggc3RhZ2dlclxuICAgICAgICBjb25zdCBzZXJ2aWNlQ2FyZHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjc2VydmljZXMgLmZlYXR1cmUtY2FyZCcpO1xuICAgICAgICBpZiAoc2VydmljZUNhcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNlcnZpY2VDYXJkcy5mb3JFYWNoKGNhcmQgPT4ge1xuICAgICAgICAgICAgICAgIGdzYXAuc2V0KGNhcmQsIHsgb3BhY2l0eTogMCwgeTogNTAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZ3NhcC50byhzZXJ2aWNlQ2FyZHMsIHtcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDAuOCxcbiAgICAgICAgICAgICAgICBzdGFnZ2VyOiAwLjEsXG4gICAgICAgICAgICAgICAgZWFzZTogXCJwb3dlcjIub3V0XCIsXG4gICAgICAgICAgICAgICAgc2Nyb2xsVHJpZ2dlcjoge1xuICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyOiBcIiNzZXJ2aWNlc1wiLFxuICAgICAgICAgICAgICAgICAgICBzdGFydDogXCJ0b3AgNzAlXCIsXG4gICAgICAgICAgICAgICAgICAgIG9uY2U6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB0b2dnbGVBY3Rpb25zOiBcInBsYXkgbm9uZSBub25lIG5vbmVcIixcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsZXI6IHdpbmRvd1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBBbmltYXRlIHByb2Nlc3MgY2FyZHMgdG9nZXRoZXJcbiAgICAgICAgY29uc3QgcHJvY2Vzc1NlY3Rpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcHJvY2VzcycpO1xuICAgICAgICBpZiAocHJvY2Vzc1NlY3Rpb24pIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2Nlc3NDYXJkcyA9IHByb2Nlc3NTZWN0aW9uLnF1ZXJ5U2VsZWN0b3JBbGwoJy5mZWF0dXJlLWNhcmQnKTtcbiAgICAgICAgICAgIGlmIChwcm9jZXNzQ2FyZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHByb2Nlc3NDYXJkcy5mb3JFYWNoKGNhcmQgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnc2FwLnNldChjYXJkLCB7IG9wYWNpdHk6IDAsIHk6IDUwIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGdzYXAudG8ocHJvY2Vzc0NhcmRzLCB7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAwLjgsXG4gICAgICAgICAgICAgICAgICAgIHN0YWdnZXI6IDAuMSxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogXCJwb3dlcjIub3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbFRyaWdnZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyaWdnZXI6IHByb2Nlc3NTZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IFwidG9wIDcwJVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgb25jZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVBY3Rpb25zOiBcInBsYXkgbm9uZSBub25lIG5vbmVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbGVyOiB3aW5kb3dcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBBbmltYXRlIG90aGVyIGZlYXR1cmUgY2FyZHMgKG5vdCBwcm9jZXNzLCBjYXJlZXJzLCBvciBzZXJ2aWNlcylcbiAgICAgICAgY29uc3Qgb3RoZXJDYXJkcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5mZWF0dXJlLWNhcmQ6bm90KCNjYXJlZXJzIC5mZWF0dXJlLWNhcmQpOm5vdCgjc2VydmljZXMgLmZlYXR1cmUtY2FyZCk6bm90KCNwcm9jZXNzIC5mZWF0dXJlLWNhcmQpJyk7XG4gICAgICAgIG90aGVyQ2FyZHMuZm9yRWFjaCgoY2FyZCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGdzYXAuc2V0KGNhcmQsIHsgb3BhY2l0eTogMCwgeTogNTAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGdzYXAudG8oY2FyZCwge1xuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogMC44LFxuICAgICAgICAgICAgICAgIGRlbGF5OiBpbmRleCAqIDAuMSxcbiAgICAgICAgICAgICAgICBlYXNlOiBcInBvd2VyMi5vdXRcIixcbiAgICAgICAgICAgICAgICBzY3JvbGxUcmlnZ2VyOiB7XG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXI6IGNhcmQsXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBcInRvcCA4NSVcIixcbiAgICAgICAgICAgICAgICAgICAgb25jZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHRvZ2dsZUFjdGlvbnM6IFwicGxheSBub25lIG5vbmUgbm9uZVwiLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxlcjogd2luZG93XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBpbml0Rm91bmRlckNhcmRzKCkge1xuICAgICAgICAvLyBTZXQgdXAgSW50ZXJzZWN0aW9uIE9ic2VydmVyIGZvciBmb3VuZGVyIGNhcmRzXG4gICAgICAgIGNvbnN0IGZvdW5kZXJDYXJkcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5mb3VuZGVyLWNhcmQnKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChmb3VuZGVyQ2FyZHMubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICBjb25zdCBvYnNlcnZlck9wdGlvbnMgPSB7XG4gICAgICAgICAgICByb290OiBudWxsLFxuICAgICAgICAgICAgcm9vdE1hcmdpbjogJzBweCcsXG4gICAgICAgICAgICB0aHJlc2hvbGQ6IDAuMVxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoKGVudHJpZXMpID0+IHtcbiAgICAgICAgICAgIGVudHJpZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5LmlzSW50ZXJzZWN0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudHJ5LnRhcmdldC5jbGFzc0xpc3QuYWRkKCdhbmltYXRlLWluJyk7XG4gICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLnVub2JzZXJ2ZShlbnRyeS50YXJnZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBvYnNlcnZlck9wdGlvbnMpO1xuICAgICAgICBcbiAgICAgICAgZm91bmRlckNhcmRzLmZvckVhY2goY2FyZCA9PiB7XG4gICAgICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGNhcmQpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIEFkZCBwYXJhbGxheCBlZmZlY3QgdG8gZm91bmRlciBwaG90b3NcbiAgICAgICAgdGhpcy5pbml0Rm91bmRlclBhcmFsbGF4KCk7XG4gICAgfVxuICAgIFxuICAgIGluaXRGb3VuZGVyUGFyYWxsYXgoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZ3NhcCA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIC8vIFNraXAgcGFyYWxsYXggb24gbW9iaWxlIGFuZCBsb3ctZW5kIGRldmljZXMgZm9yIHBlcmZvcm1hbmNlXG4gICAgICAgIGNvbnN0IGlzTW9iaWxlID0gd2luZG93LmlubmVyV2lkdGggPCA3Njg7XG4gICAgICAgIGlmIChpc01vYmlsZSB8fCB0aGlzLmlzTG93RW5kRGV2aWNlKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICAvLyBPbmx5IHNlbGVjdCB0aGUgYWN0dWFsIGltYWdlcywgbm90IGFueSBkaXZzIG9yIG92ZXJsYXlzXG4gICAgICAgIGNvbnN0IGZvdW5kZXJQaG90b3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZm91bmRlci1jYXJkID4gZGl2OmZpcnN0LWNoaWxkID4gaW1nJyk7XG4gICAgICAgIFxuICAgICAgICBmb3VuZGVyUGhvdG9zLmZvckVhY2goKHBob3RvKSA9PiB7XG4gICAgICAgICAgICAvLyBTZXQgaW5pdGlhbCBwb3NpdGlvbiB3aXRoIDEuMXggc2NhbGluZ1xuICAgICAgICAgICAgZ3NhcC5zZXQocGhvdG8sIHtcbiAgICAgICAgICAgICAgICBzY2FsZTogMS4xLFxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybU9yaWdpbjogXCJjZW50ZXIgY2VudGVyXCIsXG4gICAgICAgICAgICAgICAgeVBlcmNlbnQ6IC0xMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEFwcGx5IHBhcmFsbGF4IGVmZmVjdCB0byB0aGUgcGhvdG8gb25seVxuICAgICAgICAgICAgLy8gTW92ZSBmcm9tIC0xMCB0byAxMCBmb3IgbW9kZXJhdGUgcGFyYWxsYXhcbiAgICAgICAgICAgIGdzYXAuZnJvbVRvKHBob3RvLCBcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHlQZXJjZW50OiAtMTBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgeVBlcmNlbnQ6IDEwLFxuICAgICAgICAgICAgICAgICAgICBlYXNlOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsVHJpZ2dlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcjogcGhvdG8uY2xvc2VzdCgnLmZvdW5kZXItY2FyZCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IFwidG9wIGJvdHRvbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiBcImJvdHRvbSB0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcnViOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW52YWxpZGF0ZU9uUmVmcmVzaDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIGlmICh0aGlzLmxlbmlzKSB7XG4gICAgICAgICAgICB0aGlzLmxlbmlzLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMubGVuaXMgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIFNjcm9sbFRyaWdnZXIuZ2V0QWxsKCkuZm9yRWFjaCh0cmlnZ2VyID0+IHRyaWdnZXIua2lsbCgpKTtcbiAgICB9XG59IiwgIi8qKlxuICogM0QgR2xvYmUgbW9kdWxlXG4gKiBIYW5kbGVzIFRocmVlLmpzIGdsb2JlIHdpdGggYW5pbWF0ZWQgY29ubmVjdGlvbnNcbiAqL1xuXG5leHBvcnQgY2xhc3MgR2xvYmVNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3Rvcihjb250YWluZXJJZCA9ICdnbG9iZS1jb250YWluZXInKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29udGFpbmVySWQpO1xuICAgICAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICB0aGlzLnNjZW5lID0gbnVsbDtcbiAgICAgICAgdGhpcy5jYW1lcmEgPSBudWxsO1xuICAgICAgICB0aGlzLnJlbmRlcmVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5nbG9iZUdyb3VwID0gbnVsbDtcbiAgICAgICAgdGhpcy5hbmltYXRpb25JZCA9IG51bGw7XG4gICAgICAgIHRoaXMuZHluYW1pY1BvaW50cyA9IFtdO1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb25JZCA9IDA7XG4gICAgICAgIHRoaXMucGFydGljbGVQb3NpdGlvbnMgPSBudWxsO1xuICAgICAgICB0aGlzLmxhc3RUaW1lID0gMDtcbiAgICAgICAgdGhpcy5wb2ludFNwYXduVGltZXIgPSAwO1xuICAgICAgICB0aGlzLnBvaW50U3Bhd25JbnRlcnZhbCA9IHRoaXMuaXNNb2JpbGUgPyAyLjUgOiAxLjI7XG4gICAgICAgIHRoaXMubWF4RHluYW1pY1BvaW50cyA9IHRoaXMuaXNNb2JpbGUgPyAzIDogMTA7XG4gICAgICAgIHRoaXMudGhyZWVMb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8vIFBlcmZvcm1hbmNlIHNldHRpbmdzXG4gICAgICAgIHRoaXMuaXNNb2JpbGUgPSB3aW5kb3cuaW5uZXJXaWR0aCA8IDc2ODtcbiAgICAgICAgdGhpcy5pc0xvd0VuZERldmljZSA9IHRoaXMuZGV0ZWN0TG93RW5kRGV2aWNlKCk7XG4gICAgICAgIHRoaXMucHJlZmVyc1JlZHVjZWRNb3Rpb24gPSB3aW5kb3cubWF0Y2hNZWRpYSgnKHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSknKS5tYXRjaGVzO1xuICAgICAgICB0aGlzLmZyYW1lU2tpcCA9IDA7XG4gICAgICAgIHRoaXMudGFyZ2V0RlBTID0gdGhpcy5pc01vYmlsZSA/IDMwIDogNjA7XG4gICAgICAgIHRoaXMuZnBzSGlzdG9yeSA9IFtdO1xuICAgICAgICB0aGlzLmFkYXB0aXZlUXVhbGl0eSA9IHRydWU7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG4gICAgXG4gICAgZGV0ZWN0TG93RW5kRGV2aWNlKCkge1xuICAgICAgICAvLyBDaGVjayBmb3IgbG93LWVuZCBkZXZpY2UgaW5kaWNhdG9yc1xuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY29uc3QgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnKSB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJyk7XG4gICAgICAgIFxuICAgICAgICBpZiAoIWdsKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgXG4gICAgICAgIC8vIENoZWNrIG1heCB0ZXh0dXJlIHNpemUgKGxvdy1lbmQgZGV2aWNlcyB0eXBpY2FsbHkgaGF2ZSBzbWFsbGVyIGxpbWl0cylcbiAgICAgICAgY29uc3QgbWF4VGV4dHVyZVNpemUgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuTUFYX1RFWFRVUkVfU0laRSk7XG4gICAgICAgIFxuICAgICAgICAvLyBDaGVjayBkZXZpY2UgbWVtb3J5IGlmIGF2YWlsYWJsZVxuICAgICAgICBjb25zdCBkZXZpY2VNZW1vcnkgPSBuYXZpZ2F0b3IuZGV2aWNlTWVtb3J5IHx8IDQ7XG4gICAgICAgIFxuICAgICAgICAvLyBDaGVjayBoYXJkd2FyZSBjb25jdXJyZW5jeSAoQ1BVIGNvcmVzKVxuICAgICAgICBjb25zdCBjb3JlcyA9IG5hdmlnYXRvci5oYXJkd2FyZUNvbmN1cnJlbmN5IHx8IDQ7XG4gICAgICAgIFxuICAgICAgICAvLyBNb3JlIGFnZ3Jlc3NpdmUgZGV0ZWN0aW9uIGZvciBwZXJmb3JtYW5jZVxuICAgICAgICByZXR1cm4gbWF4VGV4dHVyZVNpemUgPCA0MDk2IHx8IGRldmljZU1lbW9yeSA8IDQgfHwgY29yZXMgPCA0O1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICAvLyBEb24ndCBpbml0aWFsaXplIG9uIG1vYmlsZSBhdCBhbGxcbiAgICAgICAgaWYgKHRoaXMuaXNNb2JpbGUgfHwgdGhpcy5wcmVmZXJzUmVkdWNlZE1vdGlvbiB8fCB0aGlzLmlzTG93RW5kRGV2aWNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIExhenkgbG9hZCBUaHJlZS5qc1xuICAgICAgICBpZiAodHlwZW9mIFRIUkVFID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWRUaHJlZUpTKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBsb2FkIFRocmVlLmpzOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLnNldHVwU2NlbmUoKTtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlR2xvYmUoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRBbmltYXRpb24oKTtcbiAgICAgICAgICAgIHRoaXMuc2V0dXBFdmVudExpc3RlbmVycygpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGluaXRpYWxpemUgZ2xvYmU6JywgZXJyb3IpO1xuICAgICAgICAgICAgaWYgKHRoaXMuY29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBsb2FkVGhyZWVKUygpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICAgICAgc2NyaXB0LnNyYyA9ICdodHRwczovL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy90aHJlZS5qcy9yMTI4L3RocmVlLm1pbi5qcyc7XG4gICAgICAgICAgICBzY3JpcHQuYXN5bmMgPSB0cnVlO1xuICAgICAgICAgICAgc2NyaXB0Lm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnRocmVlTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgc2NyaXB0Lm9uZXJyb3IgPSByZWplY3Q7XG4gICAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBzZXR1cFNjZW5lKCkge1xuICAgICAgICB0aGlzLnNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gICAgICAgIHRoaXMuY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDc1LCAxLCAwLjEsIDIwMDApO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgbWF4U2l6ZSA9IHdpbmRvdy5pbm5lckhlaWdodCAqIDEuMjtcbiAgICAgICAgdGhpcy5yZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHsgXG4gICAgICAgICAgICBhbHBoYTogdHJ1ZSwgXG4gICAgICAgICAgICBhbnRpYWxpYXM6ICF0aGlzLmlzTW9iaWxlLFxuICAgICAgICAgICAgcG93ZXJQcmVmZXJlbmNlOiB0aGlzLmlzTW9iaWxlID8gJ2xvdy1wb3dlcicgOiAnaGlnaC1wZXJmb3JtYW5jZScsXG4gICAgICAgICAgICBwcmVjaXNpb246IHRoaXMuaXNNb2JpbGUgPyAnbG93cCcgOiAnaGlnaHAnXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFNpemUobWF4U2l6ZSwgbWF4U2l6ZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UGl4ZWxSYXRpbyh0aGlzLmlzTW9iaWxlID8gMSA6IE1hdGgubWluKHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvLCAyKSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0Q2xlYXJDb2xvcigweDAwMDAwMCwgMCk7XG4gICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMucmVuZGVyZXIuZG9tRWxlbWVudCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgMTAwMCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmdsb2JlR3JvdXAgPSBuZXcgVEhSRUUuR3JvdXAoKTtcbiAgICAgICAgdGhpcy5nbG9iZUdyb3VwLnJvdGF0aW9uLnggPSAwLjM7XG4gICAgICAgIHRoaXMuc2NlbmUuYWRkKHRoaXMuZ2xvYmVHcm91cCk7XG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZUdsb2JlKCkge1xuICAgICAgICAvLyBSZWR1Y2UgZ2VvbWV0cnkgY29tcGxleGl0eSBvbiBtb2JpbGVcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSB0aGlzLmlzTW9iaWxlID8gMjQgOiAzMjtcbiAgICAgICAgY29uc3QgcmluZ3MgPSB0aGlzLmlzTW9iaWxlID8gMTIgOiAxNjtcbiAgICAgICAgY29uc3Qgc3BoZXJlR2VvbWV0cnkgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoNTMyLCBzZWdtZW50cywgcmluZ3MpO1xuICAgICAgICBcbiAgICAgICAgLy8gTG93ZXIgb3BhY2l0eSBvbiBtb2JpbGUgaW4gZGFyayBtb2RlXG4gICAgICAgIGNvbnN0IGJhc2VPcGFjaXR5ID0gdGhpcy5pc01vYmlsZSA/IDAuMDMgOiAwLjA4O1xuICAgICAgICBcbiAgICAgICAgY29uc3Qgd2lyZWZyYW1lTWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgICAgICAgY29sb3I6IDB4Zjk3MzE2LFxuICAgICAgICAgICAgd2lyZWZyYW1lOiB0cnVlLFxuICAgICAgICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICAgICAgICBvcGFjaXR5OiBiYXNlT3BhY2l0eVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHdpcmVmcmFtZVNwaGVyZSA9IG5ldyBUSFJFRS5NZXNoKHNwaGVyZUdlb21ldHJ5LCB3aXJlZnJhbWVNYXRlcmlhbCk7XG4gICAgICAgIHRoaXMuZ2xvYmVHcm91cC5hZGQod2lyZWZyYW1lU3BoZXJlKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY3JlYXRlUGFydGljbGVzKCk7XG4gICAgICAgIHRoaXMuc2V0dXBMaWdodGluZygpO1xuICAgIH1cbiAgICBcbiAgICBjcmVhdGVQYXJ0aWNsZXMoKSB7XG4gICAgICAgIC8vIFJlZHVjZSBwYXJ0aWNsZSBjb3VudCBvbiBtb2JpbGVcbiAgICAgICAgY29uc3QgcGFydGljbGVDb3VudCA9IHRoaXMuaXNNb2JpbGUgPyA2MCA6IDEyMDtcbiAgICAgICAgY29uc3QgcGFydGljbGVQb3NpdGlvbnMgPSBuZXcgRmxvYXQzMkFycmF5KHBhcnRpY2xlQ291bnQgKiAzKTtcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydGljbGVDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwaGkgPSBNYXRoLmFjb3MoLTEgKyAoMiAqIGkpIC8gcGFydGljbGVDb3VudCk7XG4gICAgICAgICAgICBjb25zdCB0aGV0YSA9IE1hdGguc3FydChwYXJ0aWNsZUNvdW50ICogTWF0aC5QSSkgKiBwaGk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnN0IHJhZGl1cyA9IDUzMjtcbiAgICAgICAgICAgIGNvbnN0IHggPSByYWRpdXMgKiBNYXRoLnNpbihwaGkpICogTWF0aC5jb3ModGhldGEpO1xuICAgICAgICAgICAgY29uc3QgeSA9IHJhZGl1cyAqIE1hdGguc2luKHBoaSkgKiBNYXRoLnNpbih0aGV0YSk7XG4gICAgICAgICAgICBjb25zdCB6ID0gcmFkaXVzICogTWF0aC5jb3MocGhpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcGFydGljbGVQb3NpdGlvbnNbaSAqIDNdID0geDtcbiAgICAgICAgICAgIHBhcnRpY2xlUG9zaXRpb25zW2kgKiAzICsgMV0gPSB5O1xuICAgICAgICAgICAgcGFydGljbGVQb3NpdGlvbnNbaSAqIDMgKyAyXSA9IHo7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMucGFydGljbGVQb3NpdGlvbnMgPSBwYXJ0aWNsZVBvc2l0aW9ucztcbiAgICB9XG4gICAgXG4gICAgc2V0dXBMaWdodGluZygpIHtcbiAgICAgICAgY29uc3QgYW1iaWVudExpZ2h0ID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodCgweDQwNDA0MCwgMC40KTtcbiAgICAgICAgdGhpcy5zY2VuZS5hZGQoYW1iaWVudExpZ2h0KTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGRpcmVjdGlvbmFsTGlnaHQgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgMC42KTtcbiAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi5zZXQoLTMwMCwgLTMwMCwgNDAwKTtcbiAgICAgICAgdGhpcy5zY2VuZS5hZGQoZGlyZWN0aW9uYWxMaWdodCk7XG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZUR5bmFtaWNDb25uZWN0aW9uKCkge1xuICAgICAgICBjb25zdCBwYXJ0aWNsZUNvdW50ID0gdGhpcy5wYXJ0aWNsZVBvc2l0aW9ucy5sZW5ndGggLyAzO1xuICAgICAgICBjb25zdCBzdGFydFBhcnRpY2xlSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwYXJ0aWNsZUNvdW50KTtcbiAgICAgICAgY29uc3Qgc3RhcnRYID0gdGhpcy5wYXJ0aWNsZVBvc2l0aW9uc1tzdGFydFBhcnRpY2xlSW5kZXggKiAzXTtcbiAgICAgICAgY29uc3Qgc3RhcnRZID0gdGhpcy5wYXJ0aWNsZVBvc2l0aW9uc1tzdGFydFBhcnRpY2xlSW5kZXggKiAzICsgMV07XG4gICAgICAgIGNvbnN0IHN0YXJ0WiA9IHRoaXMucGFydGljbGVQb3NpdGlvbnNbc3RhcnRQYXJ0aWNsZUluZGV4ICogMyArIDJdO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgY29ubmVjdGlvbkxpbmVzID0gW107XG4gICAgICAgIGNvbnN0IGNvbm5lY3Rpb25NYXRlcmlhbHMgPSBbXTtcbiAgICAgICAgY29uc3QgY29ubmVjdGlvblNwaGVyZXMgPSBbXTtcbiAgICAgICAgY29uc3QgY29ubmVjdGlvblNwaGVyZU1hdGVyaWFscyA9IFtdO1xuICAgICAgICBjb25zdCBjb25uZWN0aW9uUG9pbnRzID0gW107XG4gICAgICAgIFxuICAgICAgICAvLyBSZWR1Y2UgY29ubmVjdGlvbiBjb21wbGV4aXR5IG9uIG1vYmlsZVxuICAgICAgICBjb25zdCBtYXhDb25uZWN0aW9ucyA9IHRoaXMuaXNNb2JpbGUgPyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKSArIDIgOiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAzKSArIDM7XG4gICAgICAgIGxldCBjdXJyZW50UG9zID0geyB4OiBzdGFydFgsIHk6IHN0YXJ0WSwgejogc3RhcnRaIH07XG4gICAgICAgIGxldCBjdXJyZW50UGFydGljbGVJbmRleCA9IHN0YXJ0UGFydGljbGVJbmRleDtcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4Q29ubmVjdGlvbnM7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgbmVhcmJ5UGFydGljbGVzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhcnRpY2xlQ291bnQ7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChqID09PSBjdXJyZW50UGFydGljbGVJbmRleCkgY29udGludWU7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3QgcHggPSB0aGlzLnBhcnRpY2xlUG9zaXRpb25zW2ogKiAzXTtcbiAgICAgICAgICAgICAgICBjb25zdCBweSA9IHRoaXMucGFydGljbGVQb3NpdGlvbnNbaiAqIDMgKyAxXTtcbiAgICAgICAgICAgICAgICBjb25zdCBweiA9IHRoaXMucGFydGljbGVQb3NpdGlvbnNbaiAqIDMgKyAyXTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBkaXN0YW5jZSA9IE1hdGguc3FydChcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3coY3VycmVudFBvcy54IC0gcHgsIDIpICsgXG4gICAgICAgICAgICAgICAgICAgIE1hdGgucG93KGN1cnJlbnRQb3MueSAtIHB5LCAyKSArIFxuICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyhjdXJyZW50UG9zLnogLSBweiwgMilcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZSA8IDI1MCkge1xuICAgICAgICAgICAgICAgICAgICBuZWFyYnlQYXJ0aWNsZXMucHVzaCh7IGluZGV4OiBqLCBkaXN0YW5jZTogZGlzdGFuY2UsIHBvczogW3B4LCBweSwgcHpdIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKG5lYXJieVBhcnRpY2xlcy5sZW5ndGggPT09IDApIGJyZWFrO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCBuZXh0UGFydGljbGUgPSBuZWFyYnlQYXJ0aWNsZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbmVhcmJ5UGFydGljbGVzLmxlbmd0aCldO1xuICAgICAgICAgICAgY29uc3QgbmV4dFBvcyA9IHsgeDogbmV4dFBhcnRpY2xlLnBvc1swXSwgeTogbmV4dFBhcnRpY2xlLnBvc1sxXSwgejogbmV4dFBhcnRpY2xlLnBvc1syXSB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCB7IGxpbmUsIGxpbmVNYXQsIHNwaGVyZSwgc3BoZXJlTWF0IH0gPSB0aGlzLmNyZWF0ZUNvbm5lY3Rpb25FbGVtZW50cyhjdXJyZW50UG9zLCBuZXh0UG9zLCBpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29ubmVjdGlvbkxpbmVzLnB1c2gobGluZSk7XG4gICAgICAgICAgICBjb25uZWN0aW9uTWF0ZXJpYWxzLnB1c2gobGluZU1hdCk7XG4gICAgICAgICAgICBjb25uZWN0aW9uU3BoZXJlcy5wdXNoKHNwaGVyZSk7XG4gICAgICAgICAgICBjb25uZWN0aW9uU3BoZXJlTWF0ZXJpYWxzLnB1c2goc3BoZXJlTWF0KTtcbiAgICAgICAgICAgIGNvbm5lY3Rpb25Qb2ludHMucHVzaCh7XG4gICAgICAgICAgICAgICAgc3RhcnQ6IHsgLi4uY3VycmVudFBvcyB9LFxuICAgICAgICAgICAgICAgIGVuZDogeyAuLi5uZXh0UG9zIH0sXG4gICAgICAgICAgICAgICAgc3RhcnRJbmRleDogY3VycmVudFBhcnRpY2xlSW5kZXgsXG4gICAgICAgICAgICAgICAgZW5kSW5kZXg6IG5leHRQYXJ0aWNsZS5pbmRleFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGN1cnJlbnRQb3MgPSBuZXh0UG9zO1xuICAgICAgICAgICAgY3VycmVudFBhcnRpY2xlSW5kZXggPSBuZXh0UGFydGljbGUuaW5kZXg7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGR5bmFtaWNDb25uZWN0aW9uID0ge1xuICAgICAgICAgICAgaWQ6IHRoaXMuY29ubmVjdGlvbklkKyssXG4gICAgICAgICAgICBjb25uZWN0aW9uczogY29ubmVjdGlvbkxpbmVzLFxuICAgICAgICAgICAgY29ubmVjdGlvbk1hdGVyaWFsczogY29ubmVjdGlvbk1hdGVyaWFscyxcbiAgICAgICAgICAgIGNvbm5lY3Rpb25TcGhlcmVzOiBjb25uZWN0aW9uU3BoZXJlcyxcbiAgICAgICAgICAgIGNvbm5lY3Rpb25TcGhlcmVNYXRlcmlhbHM6IGNvbm5lY3Rpb25TcGhlcmVNYXRlcmlhbHMsXG4gICAgICAgICAgICBjb25uZWN0aW9uUG9pbnRzOiBjb25uZWN0aW9uUG9pbnRzLFxuICAgICAgICAgICAgbGlmZTogMCxcbiAgICAgICAgICAgIG1heExpZmU6IDUgKyBNYXRoLnJhbmRvbSgpICogMyxcbiAgICAgICAgICAgIGZhZGVJbkR1cmF0aW9uOiAwLjMsXG4gICAgICAgICAgICBmYWRlT3V0RHVyYXRpb246IDAuNSxcbiAgICAgICAgICAgIGdyb3d0aER1cmF0aW9uOiAwLjZcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZHluYW1pY1BvaW50cy5wdXNoKGR5bmFtaWNDb25uZWN0aW9uKTtcbiAgICAgICAgcmV0dXJuIGR5bmFtaWNDb25uZWN0aW9uO1xuICAgIH1cbiAgICBcbiAgICBjcmVhdGVDb25uZWN0aW9uRWxlbWVudHMoc3RhcnRQb3MsIGVuZFBvcywgY29ubmVjdGlvbkluZGV4KSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0UG9zVmVjID0gbmV3IFRIUkVFLlZlY3RvcjMoc3RhcnRQb3MueCwgc3RhcnRQb3MueSwgc3RhcnRQb3Mueik7XG4gICAgICAgIGNvbnN0IGVuZFBvc1ZlYyA9IG5ldyBUSFJFRS5WZWN0b3IzKGVuZFBvcy54LCBlbmRQb3MueSwgZW5kUG9zLnopO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgYXJjUG9pbnRzID0gW107XG4gICAgICAgIGNvbnN0IHNlZ21lbnRzID0gdGhpcy5pc01vYmlsZSA/IDEwIDogMjA7XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8PSBzZWdtZW50czsgaisrKSB7XG4gICAgICAgICAgICBjb25zdCB0ID0gaiAvIHNlZ21lbnRzO1xuICAgICAgICAgICAgY29uc3QgbGVycFBvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCkubGVycFZlY3RvcnMoc3RhcnRQb3NWZWMsIGVuZFBvc1ZlYywgdCk7XG4gICAgICAgICAgICBjb25zdCBzcGhlcmVSYWRpdXMgPSA1NDI7XG4gICAgICAgICAgICBsZXJwUG9zLm5vcm1hbGl6ZSgpLm11bHRpcGx5U2NhbGFyKHNwaGVyZVJhZGl1cyk7XG4gICAgICAgICAgICBhcmNQb2ludHMucHVzaChsZXJwUG9zKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc3QgY3VydmUgPSBuZXcgVEhSRUUuQ2F0bXVsbFJvbUN1cnZlMyhhcmNQb2ludHMpO1xuICAgICAgICBjb25zdCBmdWxsUG9pbnRzID0gY3VydmUuZ2V0UG9pbnRzKHRoaXMuaXNNb2JpbGUgPyAyMCA6IDQwKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGxpbmVHZW9tID0gbmV3IFRIUkVFLkJ1ZmZlckdlb21ldHJ5KCkuc2V0RnJvbVBvaW50cyhbZnVsbFBvaW50c1swXSwgZnVsbFBvaW50c1swXV0pO1xuICAgICAgICBjb25zdCBsaW5lTWF0ID0gbmV3IFRIUkVFLkxpbmVCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgICAgIGNvbG9yOiBuZXcgVEhSRUUuQ29sb3IoMSwgMC44LCAwLjIpLFxuICAgICAgICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgbGluZSA9IG5ldyBUSFJFRS5MaW5lKGxpbmVHZW9tLCBsaW5lTWF0KTtcbiAgICAgICAgbGluZS51c2VyRGF0YSA9IHtcbiAgICAgICAgICAgIGZ1bGxQb2ludHM6IGZ1bGxQb2ludHMsXG4gICAgICAgICAgICBjb25uZWN0aW9uSW5kZXg6IGNvbm5lY3Rpb25JbmRleCxcbiAgICAgICAgICAgIGFuaW1hdGlvbkRlbGF5OiAwLFxuICAgICAgICAgICAgaXNBY3RpdmU6IGNvbm5lY3Rpb25JbmRleCA9PT0gMFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdsb2JlR3JvdXAuYWRkKGxpbmUpO1xuICAgICAgICBcbiAgICAgICAgY29uc3Qgc3BoZXJlR2VvbSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeSgxLjUsIDgsIDgpO1xuICAgICAgICBjb25zdCBzcGhlcmVNYXQgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgICAgICAgY29sb3I6IG5ldyBUSFJFRS5Db2xvcigxLCAxLCAwLjMpLFxuICAgICAgICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBzcGhlcmUgPSBuZXcgVEhSRUUuTWVzaChzcGhlcmVHZW9tLCBzcGhlcmVNYXQpO1xuICAgICAgICBzcGhlcmUucG9zaXRpb24uY29weShhcmNQb2ludHNbMF0pO1xuICAgICAgICB0aGlzLmdsb2JlR3JvdXAuYWRkKHNwaGVyZSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4geyBsaW5lLCBsaW5lTWF0LCBzcGhlcmUsIHNwaGVyZU1hdCB9O1xuICAgIH1cbiAgICBcbiAgICB1cGRhdGVEeW5hbWljUG9pbnRzKGRlbHRhVGltZSkge1xuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5keW5hbWljUG9pbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBjb25uZWN0aW9uID0gdGhpcy5keW5hbWljUG9pbnRzW2ldO1xuICAgICAgICAgICAgY29ubmVjdGlvbi5saWZlICs9IGRlbHRhVGltZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGV0IG9wYWNpdHkgPSAwO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5saWZlIDwgY29ubmVjdGlvbi5mYWRlSW5EdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIG9wYWNpdHkgPSBjb25uZWN0aW9uLmxpZmUgLyBjb25uZWN0aW9uLmZhZGVJbkR1cmF0aW9uO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb25uZWN0aW9uLmxpZmUgPCBjb25uZWN0aW9uLm1heExpZmUgLSBjb25uZWN0aW9uLmZhZGVPdXREdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIG9wYWNpdHkgPSAxO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb25uZWN0aW9uLmxpZmUgPCBjb25uZWN0aW9uLm1heExpZmUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmYWRlUHJvZ3Jlc3MgPSAoY29ubmVjdGlvbi5tYXhMaWZlIC0gY29ubmVjdGlvbi5saWZlKSAvIGNvbm5lY3Rpb24uZmFkZU91dER1cmF0aW9uO1xuICAgICAgICAgICAgICAgIG9wYWNpdHkgPSBmYWRlUHJvZ3Jlc3M7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uY29ubmVjdGlvbnMuZm9yRWFjaChsaW5lID0+IHRoaXMuZ2xvYmVHcm91cC5yZW1vdmUobGluZSkpO1xuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uY29ubmVjdGlvblNwaGVyZXMuZm9yRWFjaChzcGhlcmUgPT4gdGhpcy5nbG9iZUdyb3VwLnJlbW92ZShzcGhlcmUpKTtcbiAgICAgICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5lbmRTcGhlcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nbG9iZUdyb3VwLnJlbW92ZShjb25uZWN0aW9uLmVuZFNwaGVyZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZHluYW1pY1BvaW50cy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29ubmVjdGlvbkVsZW1lbnRzKGNvbm5lY3Rpb24sIG9wYWNpdHkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHVwZGF0ZUNvbm5lY3Rpb25FbGVtZW50cyhjb25uZWN0aW9uLCBvcGFjaXR5KSB7XG4gICAgICAgIGNvbm5lY3Rpb24uY29ubmVjdGlvbnMuZm9yRWFjaCgobGluZSwgY29ubmVjdGlvbkluZGV4KSA9PiB7XG4gICAgICAgICAgICBpZiAobGluZS51c2VyRGF0YS5pc0FjdGl2ZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbm5lY3Rpb25BZ2UgPSBjb25uZWN0aW9uLmxpZmUgLSBsaW5lLnVzZXJEYXRhLmFuaW1hdGlvbkRlbGF5O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChjb25uZWN0aW9uQWdlID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzcGhlcmVPcGFjaXR5ID0gTWF0aC5taW4oMSwgY29ubmVjdGlvbkFnZSAvIDAuMikgKiBvcGFjaXR5O1xuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmNvbm5lY3Rpb25TcGhlcmVNYXRlcmlhbHNbY29ubmVjdGlvbkluZGV4XS5vcGFjaXR5ID0gc3BoZXJlT3BhY2l0eTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyb3d0aFByb2dyZXNzID0gTWF0aC5taW4oMSwgY29ubmVjdGlvbkFnZSAvIGNvbm5lY3Rpb24uZ3Jvd3RoRHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmdWxsUG9pbnRzID0gbGluZS51c2VyRGF0YS5mdWxsUG9pbnRzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50UG9pbnRDb3VudCA9IE1hdGguZmxvb3IoZ3Jvd3RoUHJvZ3Jlc3MgKiBmdWxsUG9pbnRzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFBvaW50Q291bnQgPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50UG9pbnRzID0gZnVsbFBvaW50cy5zbGljZSgwLCBjdXJyZW50UG9pbnRDb3VudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lLmdlb21ldHJ5LnNldEZyb21Qb2ludHMoY3VycmVudFBvaW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmNvbm5lY3Rpb25NYXRlcmlhbHNbY29ubmVjdGlvbkluZGV4XS5vcGFjaXR5ID0gb3BhY2l0eSAqIDAuODtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdyb3d0aFByb2dyZXNzID49IDEuMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5leHRJbmRleCA9IGNvbm5lY3Rpb25JbmRleCArIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5leHRJbmRleCA8IGNvbm5lY3Rpb24uY29ubmVjdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5leHRMaW5lID0gY29ubmVjdGlvbi5jb25uZWN0aW9uc1tuZXh0SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW5leHRMaW5lLnVzZXJEYXRhLmlzQWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0TGluZS51c2VyRGF0YS5pc0FjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0TGluZS51c2VyRGF0YS5hbmltYXRpb25EZWxheSA9IGNvbm5lY3Rpb24ubGlmZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWxpbmUudXNlckRhdGEuZW5kUG9pbnRDcmVhdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlRW5kU3BoZXJlKGNvbm5lY3Rpb24sIGxpbmUsIGZ1bGxQb2ludHMsIG9wYWNpdHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uY29ubmVjdGlvblNwaGVyZU1hdGVyaWFsc1tjb25uZWN0aW9uSW5kZXhdLm9wYWNpdHkgPSBvcGFjaXR5ICogMC41O1xuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmNvbm5lY3Rpb25NYXRlcmlhbHNbY29ubmVjdGlvbkluZGV4XS5vcGFjaXR5ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uY29ubmVjdGlvbk1hdGVyaWFsc1tjb25uZWN0aW9uSW5kZXhdLm9wYWNpdHkgPSAwO1xuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uY29ubmVjdGlvblNwaGVyZU1hdGVyaWFsc1tjb25uZWN0aW9uSW5kZXhdLm9wYWNpdHkgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIGlmIChjb25uZWN0aW9uLmVuZFNwaGVyZSAmJiBjb25uZWN0aW9uLmVuZFNwaGVyZU1hdGVyaWFsKSB7XG4gICAgICAgICAgICBjb25uZWN0aW9uLmVuZFNwaGVyZU1hdGVyaWFsLm9wYWNpdHkgPSBvcGFjaXR5O1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZUVuZFNwaGVyZShjb25uZWN0aW9uLCBsaW5lLCBmdWxsUG9pbnRzLCBvcGFjaXR5KSB7XG4gICAgICAgIGNvbnN0IGVuZFNwaGVyZUdlb20gPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoMiwgOCwgOCk7XG4gICAgICAgIGNvbnN0IGVuZFNwaGVyZU1hdCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICAgICAgICBjb2xvcjogbmV3IFRIUkVFLkNvbG9yKDEsIDAuOSwgMC40KSxcbiAgICAgICAgICAgIHRyYW5zcGFyZW50OiB0cnVlLFxuICAgICAgICAgICAgb3BhY2l0eTogb3BhY2l0eVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZW5kU3BoZXJlID0gbmV3IFRIUkVFLk1lc2goZW5kU3BoZXJlR2VvbSwgZW5kU3BoZXJlTWF0KTtcbiAgICAgICAgZW5kU3BoZXJlLnBvc2l0aW9uLmNvcHkoZnVsbFBvaW50c1tmdWxsUG9pbnRzLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgdGhpcy5nbG9iZUdyb3VwLmFkZChlbmRTcGhlcmUpO1xuICAgICAgICBcbiAgICAgICAgY29ubmVjdGlvbi5lbmRTcGhlcmUgPSBlbmRTcGhlcmU7XG4gICAgICAgIGNvbm5lY3Rpb24uZW5kU3BoZXJlTWF0ZXJpYWwgPSBlbmRTcGhlcmVNYXQ7XG4gICAgICAgIGxpbmUudXNlckRhdGEuZW5kUG9pbnRDcmVhdGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgXG4gICAgc3RhcnRBbmltYXRpb24oKSB7XG4gICAgICAgIGxldCB0YXJnZXRSb3RhdGlvblkgPSAwO1xuICAgICAgICBsZXQgY3VycmVudFJvdGF0aW9uWSA9IDA7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBhbmltYXRlID0gKGN1cnJlbnRUaW1lKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFuaW1hdGlvbklkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBGUFMgbW9uaXRvcmluZyBhbmQgZnJhbWUgc2tpcHBpbmcgZm9yIG1vYmlsZVxuICAgICAgICAgICAgY29uc3QgZGVsdGFUaW1lID0gKGN1cnJlbnRUaW1lIC0gdGhpcy5sYXN0VGltZSkgLyAxMDAwO1xuICAgICAgICAgICAgY29uc3QgZnBzID0gMSAvIGRlbHRhVGltZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHRoaXMuaXNNb2JpbGUgJiYgdGhpcy5hZGFwdGl2ZVF1YWxpdHkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZwc0hpc3RvcnkucHVzaChmcHMpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZwc0hpc3RvcnkubGVuZ3RoID4gMzApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mcHNIaXN0b3J5LnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIFNraXAgZnJhbWVzIG9uIG1vYmlsZSBpZiBwZXJmb3JtYW5jZSBpcyBwb29yXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZnBzSGlzdG9yeS5sZW5ndGggPiAxMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdmdGUFMgPSB0aGlzLmZwc0hpc3RvcnkucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCkgLyB0aGlzLmZwc0hpc3RvcnkubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXZnRlBTIDwgMjUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZnJhbWVTa2lwKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5mcmFtZVNraXAgJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0VGltZSA9IGN1cnJlbnRUaW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZnJhbWVTa2lwID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5sYXN0VGltZSA9IGN1cnJlbnRUaW1lO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBTbG93ZXIgcm90YXRpb24gb24gbW9iaWxlIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2VcbiAgICAgICAgICAgIHRhcmdldFJvdGF0aW9uWSArPSB0aGlzLmlzTW9iaWxlID8gMC4wMDEgOiAwLjAwMTU7XG4gICAgICAgICAgICBjdXJyZW50Um90YXRpb25ZID0gdGFyZ2V0Um90YXRpb25ZO1xuICAgICAgICAgICAgdGhpcy5nbG9iZUdyb3VwLnJvdGF0aW9uLnkgPSBjdXJyZW50Um90YXRpb25ZO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUR5bmFtaWNQb2ludHMoZGVsdGFUaW1lKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5wb2ludFNwYXduVGltZXIgKz0gZGVsdGFUaW1lO1xuICAgICAgICAgICAgaWYgKHRoaXMucG9pbnRTcGF3blRpbWVyID49IHRoaXMucG9pbnRTcGF3bkludGVydmFsICYmIHRoaXMuZHluYW1pY1BvaW50cy5sZW5ndGggPCB0aGlzLm1heER5bmFtaWNQb2ludHMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUR5bmFtaWNDb25uZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludFNwYXduVGltZXIgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlcih0aGlzLnNjZW5lLCB0aGlzLmNhbWVyYSk7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBhbmltYXRlKDApO1xuICAgIH1cbiAgICBcbiAgICBzZXR1cEV2ZW50TGlzdGVuZXJzKCkge1xuICAgICAgICBjb25zdCBoYW5kbGVSZXNpemUgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuZXdNYXhTaXplID0gd2luZG93LmlubmVySGVpZ2h0ICogMS4yO1xuICAgICAgICAgICAgaWYgKHRoaXMucmVuZGVyZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFNpemUobmV3TWF4U2l6ZSwgbmV3TWF4U2l6ZSk7XG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIG1vYmlsZSBkZXRlY3Rpb24gb24gcmVzaXplXG4gICAgICAgICAgICAgICAgdGhpcy5pc01vYmlsZSA9IHdpbmRvdy5pbm5lcldpZHRoIDwgNzY4O1xuICAgICAgICAgICAgICAgIC8vIEFkanVzdCBxdWFsaXR5IHNldHRpbmdzIGJhc2VkIG9uIG5ldyB2aWV3cG9ydFxuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UGl4ZWxSYXRpbyh0aGlzLmlzTW9iaWxlID8gMSA6IE1hdGgubWluKHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvLCAyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBsZXQgcmVzaXplVGltZW91dDtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChyZXNpemVUaW1lb3V0KTtcbiAgICAgICAgICAgIHJlc2l6ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KGhhbmRsZVJlc2l6ZSwgMjUwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgKCkgPT4gdGhpcy5kZXN0cm95KCkpO1xuICAgICAgICBcbiAgICAgICAgLy8gUGF1c2UgYW5pbWF0aW9uIHdoZW4gdGFiIGlzIG5vdCB2aXNpYmxlXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoZG9jdW1lbnQuaGlkZGVuKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYW5pbWF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5hbmltYXRpb25JZCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYW5pbWF0aW9uSWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmFuaW1hdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhcnRBbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBkZXN0cm95KCkge1xuICAgICAgICBpZiAodGhpcy5hbmltYXRpb25JZCkge1xuICAgICAgICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5hbmltYXRpb25JZCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuc2NlbmU/LnRyYXZlcnNlKChvYmplY3QpID0+IHtcbiAgICAgICAgICAgIGlmIChvYmplY3QuZ2VvbWV0cnkpIG9iamVjdC5nZW9tZXRyeS5kaXNwb3NlKCk7XG4gICAgICAgICAgICBpZiAob2JqZWN0Lm1hdGVyaWFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqZWN0Lm1hdGVyaWFsKSkge1xuICAgICAgICAgICAgICAgICAgICBvYmplY3QubWF0ZXJpYWwuZm9yRWFjaChtYXRlcmlhbCA9PiBtYXRlcmlhbC5kaXNwb3NlKCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9iamVjdC5tYXRlcmlhbC5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMucmVuZGVyZXI/LmRpc3Bvc2UoKTtcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLmNvbnRhaW5lciAmJiB0aGlzLnJlbmRlcmVyKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLnJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxufSIsICIvKipcbiAqIFBlcmZvcm1hbmNlIG1vbml0b3JpbmcgYW5kIG9wdGltaXphdGlvbiBtb2R1bGVcbiAqIFRyYWNrcyBDb3JlIFdlYiBWaXRhbHMgYW5kIGFkYXB0cyBzaXRlIGJlaGF2aW9yIGZvciBvcHRpbWFsIHBlcmZvcm1hbmNlXG4gKi9cblxuZXhwb3J0IGNsYXNzIFBlcmZvcm1hbmNlTW9uaXRvciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubWV0cmljcyA9IHtcbiAgICAgICAgICAgIGZwczogW10sXG4gICAgICAgICAgICBtZW1vcnk6IG51bGwsXG4gICAgICAgICAgICBjb25uZWN0aW9uVHlwZTogbnVsbCxcbiAgICAgICAgICAgIGRldmljZVR5cGU6IG51bGxcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuaXNMb3dQZXJmb3JtYW5jZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNhbGxiYWNrcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuaW5pdCgpO1xuICAgIH1cbiAgICBcbiAgICBpbml0KCkge1xuICAgICAgICAvLyBEZXRlY3QgZGV2aWNlIGNhcGFiaWxpdGllc1xuICAgICAgICB0aGlzLmRldGVjdERldmljZUNhcGFiaWxpdGllcygpO1xuICAgICAgICBcbiAgICAgICAgLy8gTW9uaXRvciBGUFMgaWYgc3VwcG9ydGVkXG4gICAgICAgIHRoaXMuc3RhcnRGUFNNb25pdG9yaW5nKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBNb25pdG9yIENvcmUgV2ViIFZpdGFsc1xuICAgICAgICB0aGlzLm1vbml0b3JDb3JlV2ViVml0YWxzKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBDaGVjayBwZXJmb3JtYW5jZSBldmVyeSA1IHNlY29uZHNcbiAgICAgICAgc2V0SW50ZXJ2YWwoKCkgPT4gdGhpcy5jaGVja1BlcmZvcm1hbmNlKCksIDUwMDApO1xuICAgIH1cbiAgICBcbiAgICBkZXRlY3REZXZpY2VDYXBhYmlsaXRpZXMoKSB7XG4gICAgICAgIC8vIERldmljZSBtZW1vcnkgKGluIEdCKVxuICAgICAgICB0aGlzLm1ldHJpY3MubWVtb3J5ID0gbmF2aWdhdG9yLmRldmljZU1lbW9yeSB8fCA0O1xuICAgICAgICBcbiAgICAgICAgLy8gQ29ubmVjdGlvbiB0eXBlXG4gICAgICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBuYXZpZ2F0b3IuY29ubmVjdGlvbiB8fCBuYXZpZ2F0b3IubW96Q29ubmVjdGlvbiB8fCBuYXZpZ2F0b3Iud2Via2l0Q29ubmVjdGlvbjtcbiAgICAgICAgaWYgKGNvbm5lY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMubWV0cmljcy5jb25uZWN0aW9uVHlwZSA9IGNvbm5lY3Rpb24uZWZmZWN0aXZlVHlwZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gRGV2aWNlIHR5cGUgYmFzZWQgb24gdmFyaW91cyBmYWN0b3JzXG4gICAgICAgIGNvbnN0IGlzTW9iaWxlID0gL0FuZHJvaWR8d2ViT1N8aVBob25lfGlQYWR8aVBvZHxCbGFja0JlcnJ5fElFTW9iaWxlfE9wZXJhIE1pbmkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICAgICAgICBjb25zdCBpc0xvd01lbW9yeSA9IHRoaXMubWV0cmljcy5tZW1vcnkgPCA0O1xuICAgICAgICBjb25zdCBpc1Nsb3cgPSB0aGlzLm1ldHJpY3MuY29ubmVjdGlvblR5cGUgPT09ICdzbG93LTJnJyB8fCB0aGlzLm1ldHJpY3MuY29ubmVjdGlvblR5cGUgPT09ICcyZyc7XG4gICAgICAgIGNvbnN0IGNvcmVzID0gbmF2aWdhdG9yLmhhcmR3YXJlQ29uY3VycmVuY3kgfHwgNDtcbiAgICAgICAgXG4gICAgICAgIHRoaXMubWV0cmljcy5kZXZpY2VUeXBlID0ge1xuICAgICAgICAgICAgbW9iaWxlOiBpc01vYmlsZSxcbiAgICAgICAgICAgIGxvd01lbW9yeTogaXNMb3dNZW1vcnksXG4gICAgICAgICAgICBzbG93Q29ubmVjdGlvbjogaXNTbG93LFxuICAgICAgICAgICAgbG93Q29yZXM6IGNvcmVzIDwgNFxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLy8gSW5pdGlhbCBwZXJmb3JtYW5jZSBhc3Nlc3NtZW50XG4gICAgICAgIHRoaXMuaXNMb3dQZXJmb3JtYW5jZSA9IGlzTW9iaWxlIHx8IGlzTG93TWVtb3J5IHx8IGlzU2xvdyB8fCBjb3JlcyA8IDQ7XG4gICAgfVxuICAgIFxuICAgIHN0YXJ0RlBTTW9uaXRvcmluZygpIHtcbiAgICAgICAgbGV0IGxhc3RUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIGxldCBmcmFtZXMgPSAwO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgbWVhc3VyZUZQUyA9ICgpID0+IHtcbiAgICAgICAgICAgIGZyYW1lcysrO1xuICAgICAgICAgICAgY29uc3QgY3VycmVudFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGN1cnJlbnRUaW1lID49IGxhc3RUaW1lICsgMTAwMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZwcyA9IE1hdGgucm91bmQoKGZyYW1lcyAqIDEwMDApIC8gKGN1cnJlbnRUaW1lIC0gbGFzdFRpbWUpKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1ldHJpY3MuZnBzLnB1c2goZnBzKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBLZWVwIG9ubHkgbGFzdCAxMCBtZWFzdXJlbWVudHNcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tZXRyaWNzLmZwcy5sZW5ndGggPiAxMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1ldHJpY3MuZnBzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZyYW1lcyA9IDA7XG4gICAgICAgICAgICAgICAgbGFzdFRpbWUgPSBjdXJyZW50VGltZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1lYXN1cmVGUFMpO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1lYXN1cmVGUFMpO1xuICAgIH1cbiAgICBcbiAgICBtb25pdG9yQ29yZVdlYlZpdGFscygpIHtcbiAgICAgICAgLy8gTGFyZ2VzdCBDb250ZW50ZnVsIFBhaW50IChMQ1ApXG4gICAgICAgIGlmICgnUGVyZm9ybWFuY2VPYnNlcnZlcicgaW4gd2luZG93KSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxjcE9ic2VydmVyID0gbmV3IFBlcmZvcm1hbmNlT2JzZXJ2ZXIoKGxpc3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW50cmllcyA9IGxpc3QuZ2V0RW50cmllcygpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYXN0RW50cnkgPSBlbnRyaWVzW2VudHJpZXMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdMQ1A6JywgbGFzdEVudHJ5LnJlbmRlclRpbWUgfHwgbGFzdEVudHJ5LmxvYWRUaW1lKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBsY3BPYnNlcnZlci5vYnNlcnZlKHsgZW50cnlUeXBlczogWydsYXJnZXN0LWNvbnRlbnRmdWwtcGFpbnQnXSB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBMQ1Agb2JzZXJ2ZXIgbm90IHN1cHBvcnRlZFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBGaXJzdCBJbnB1dCBEZWxheSAoRklEKVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWRPYnNlcnZlciA9IG5ldyBQZXJmb3JtYW5jZU9ic2VydmVyKChsaXN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVudHJpZXMgPSBsaXN0LmdldEVudHJpZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgZW50cmllcy5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdGSUQ6JywgZW50cnkucHJvY2Vzc2luZ1N0YXJ0IC0gZW50cnkuc3RhcnRUaW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZmlkT2JzZXJ2ZXIub2JzZXJ2ZSh7IGVudHJ5VHlwZXM6IFsnZmlyc3QtaW5wdXQnXSB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBGSUQgb2JzZXJ2ZXIgbm90IHN1cHBvcnRlZFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDdW11bGF0aXZlIExheW91dCBTaGlmdCAoQ0xTKVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgY2xzVmFsdWUgPSAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNsc09ic2VydmVyID0gbmV3IFBlcmZvcm1hbmNlT2JzZXJ2ZXIoKGxpc3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW50cmllcyA9IGxpc3QuZ2V0RW50cmllcygpO1xuICAgICAgICAgICAgICAgICAgICBlbnRyaWVzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlbnRyeS5oYWRSZWNlbnRJbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsc1ZhbHVlICs9IGVudHJ5LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDTFM6JywgY2xzVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjbHNPYnNlcnZlci5vYnNlcnZlKHsgZW50cnlUeXBlczogWydsYXlvdXQtc2hpZnQnXSB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBDTFMgb2JzZXJ2ZXIgbm90IHN1cHBvcnRlZFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGNoZWNrUGVyZm9ybWFuY2UoKSB7XG4gICAgICAgIC8vIENhbGN1bGF0ZSBhdmVyYWdlIEZQU1xuICAgICAgICBpZiAodGhpcy5tZXRyaWNzLmZwcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBhdmdGUFMgPSB0aGlzLm1ldHJpY3MuZnBzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApIC8gdGhpcy5tZXRyaWNzLmZwcy5sZW5ndGg7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIElmIEZQUyBkcm9wcyBiZWxvdyAzMCwgZW5hYmxlIGxvdyBwZXJmb3JtYW5jZSBtb2RlXG4gICAgICAgICAgICBpZiAoYXZnRlBTIDwgMzAgJiYgIXRoaXMuaXNMb3dQZXJmb3JtYW5jZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZW5hYmxlTG93UGVyZm9ybWFuY2VNb2RlKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGF2Z0ZQUyA+IDUwICYmIHRoaXMuaXNMb3dQZXJmb3JtYW5jZSAmJiAhdGhpcy5tZXRyaWNzLmRldmljZVR5cGUubW9iaWxlKSB7XG4gICAgICAgICAgICAgICAgLy8gUmUtZW5hYmxlIGZlYXR1cmVzIGlmIHBlcmZvcm1hbmNlIGltcHJvdmVzIChub3Qgb24gbW9iaWxlKVxuICAgICAgICAgICAgICAgIHRoaXMuZGlzYWJsZUxvd1BlcmZvcm1hbmNlTW9kZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGVuYWJsZUxvd1BlcmZvcm1hbmNlTW9kZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNMb3dQZXJmb3JtYW5jZSkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5pc0xvd1BlcmZvcm1hbmNlID0gdHJ1ZTtcbiAgICAgICAgY29uc29sZS5sb2coJ0VuYWJsaW5nIGxvdyBwZXJmb3JtYW5jZSBtb2RlJyk7XG4gICAgICAgIFxuICAgICAgICAvLyBOb3RpZnkgYWxsIHJlZ2lzdGVyZWQgY2FsbGJhY2tzXG4gICAgICAgIHRoaXMuY2FsbGJhY2tzLmZvckVhY2goY2FsbGJhY2sgPT4gY2FsbGJhY2sodHJ1ZSkpO1xuICAgICAgICBcbiAgICAgICAgLy8gQWRkIENTUyBjbGFzcyBmb3Igc3R5bGluZyBhZGp1c3RtZW50c1xuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2xvdy1wZXJmb3JtYW5jZScpO1xuICAgIH1cbiAgICBcbiAgICBkaXNhYmxlTG93UGVyZm9ybWFuY2VNb2RlKCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNMb3dQZXJmb3JtYW5jZSkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5pc0xvd1BlcmZvcm1hbmNlID0gZmFsc2U7XG4gICAgICAgIGNvbnNvbGUubG9nKCdEaXNhYmxpbmcgbG93IHBlcmZvcm1hbmNlIG1vZGUnKTtcbiAgICAgICAgXG4gICAgICAgIC8vIE5vdGlmeSBhbGwgcmVnaXN0ZXJlZCBjYWxsYmFja3NcbiAgICAgICAgdGhpcy5jYWxsYmFja3MuZm9yRWFjaChjYWxsYmFjayA9PiBjYWxsYmFjayhmYWxzZSkpO1xuICAgICAgICBcbiAgICAgICAgLy8gUmVtb3ZlIENTUyBjbGFzc1xuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2xvdy1wZXJmb3JtYW5jZScpO1xuICAgIH1cbiAgICBcbiAgICBvblBlcmZvcm1hbmNlQ2hhbmdlKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzLmFkZChjYWxsYmFjayk7XG4gICAgICAgIC8vIEltbWVkaWF0ZWx5IGNhbGwgd2l0aCBjdXJyZW50IHN0YXRlXG4gICAgICAgIGNhbGxiYWNrKHRoaXMuaXNMb3dQZXJmb3JtYW5jZSk7XG4gICAgfVxuICAgIFxuICAgIGdldE1ldHJpY3MoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi50aGlzLm1ldHJpY3MsXG4gICAgICAgICAgICBpc0xvd1BlcmZvcm1hbmNlOiB0aGlzLmlzTG93UGVyZm9ybWFuY2UsXG4gICAgICAgICAgICBhdmVyYWdlRlBTOiB0aGlzLm1ldHJpY3MuZnBzLmxlbmd0aCA+IDAgXG4gICAgICAgICAgICAgICAgPyB0aGlzLm1ldHJpY3MuZnBzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApIC8gdGhpcy5tZXRyaWNzLmZwcy5sZW5ndGggXG4gICAgICAgICAgICAgICAgOiBudWxsXG4gICAgICAgIH07XG4gICAgfVxufSIsICIvKipcbiAqIE1haW4gYXBwbGljYXRpb24gZW50cnkgcG9pbnRcbiAqIEluaXRpYWxpemVzIGFsbCBtb2R1bGVzIGFuZCBtYW5hZ2VzIGFwcGxpY2F0aW9uIGxpZmVjeWNsZVxuICovXG5cbmltcG9ydCB7IFRoZW1lTWFuYWdlciB9IGZyb20gJy4vdGhlbWUuanMnO1xuaW1wb3J0IHsgQW5pbWF0aW9uTWFuYWdlciB9IGZyb20gJy4vYW5pbWF0aW9ucy5qcyc7XG5pbXBvcnQgeyBHbG9iZU1hbmFnZXIgfSBmcm9tICcuL2dsb2JlLmpzJztcbmltcG9ydCB7IFBlcmZvcm1hbmNlTW9uaXRvciB9IGZyb20gJy4vcGVyZm9ybWFuY2UuanMnO1xuXG5jbGFzcyBBcHAge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnRoZW1lTWFuYWdlciA9IG51bGw7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9uTWFuYWdlciA9IG51bGw7XG4gICAgICAgIHRoaXMuZ2xvYmVNYW5hZ2VyID0gbnVsbDtcbiAgICAgICAgdGhpcy5wZXJmb3JtYW5jZU1vbml0b3IgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLy8gV2FpdCBmb3IgRE9NIHRvIGJlIHJlYWR5XG4gICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB0aGlzLmluaXQoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmluaXQoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpbml0KCkge1xuICAgICAgICAvLyBIYW5kbGUgc2Nyb2xsIHJlc3RvcmF0aW9uXG4gICAgICAgIHRoaXMuc2V0dXBTY3JvbGxSZXN0b3JhdGlvbigpO1xuICAgICAgICBcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBsb2FkaW5nIHNlcXVlbmNlXG4gICAgICAgIHRoaXMuaGFuZGxlTG9hZGluZygpO1xuICAgICAgICBcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBwZXJmb3JtYW5jZSBtb25pdG9yIGZpcnN0XG4gICAgICAgIHRoaXMucGVyZm9ybWFuY2VNb25pdG9yID0gbmV3IFBlcmZvcm1hbmNlTW9uaXRvcigpO1xuICAgICAgICBcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBtb2R1bGVzXG4gICAgICAgIHRoaXMudGhlbWVNYW5hZ2VyID0gbmV3IFRoZW1lTWFuYWdlcigpO1xuICAgICAgICB0aGlzLmFuaW1hdGlvbk1hbmFnZXIgPSBuZXcgQW5pbWF0aW9uTWFuYWdlcigpO1xuICAgICAgICBcbiAgICAgICAgLy8gT25seSBpbml0aWFsaXplIGdsb2JlIG9uIGRlc2t0b3AgYW5kIG5vbi1sb3ctcGVyZm9ybWFuY2UgZGV2aWNlc1xuICAgICAgICBjb25zdCBpc01vYmlsZSA9IHdpbmRvdy5pbm5lcldpZHRoIDwgNzY4O1xuICAgICAgICBpZiAoIWlzTW9iaWxlICYmICF0aGlzLnBlcmZvcm1hbmNlTW9uaXRvci5pc0xvd1BlcmZvcm1hbmNlKSB7XG4gICAgICAgICAgICAvLyBVc2UgSW50ZXJzZWN0aW9uIE9ic2VydmVyIHRvIGxhenkgbG9hZCBnbG9iZSB3aGVuIHZpc2libGVcbiAgICAgICAgICAgIGNvbnN0IGdsb2JlQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dsb2JlLWNvbnRhaW5lcicpO1xuICAgICAgICAgICAgaWYgKGdsb2JlQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoKGVudHJpZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVudHJpZXNbMF0uaXNJbnRlcnNlY3RpbmcgJiYgIXRoaXMuZ2xvYmVNYW5hZ2VyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdsb2JlTWFuYWdlciA9IG5ldyBHbG9iZU1hbmFnZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIHsgdGhyZXNob2xkOiAwLjEgfSk7XG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShnbG9iZUNvbnRhaW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIExpc3RlbiBmb3IgcGVyZm9ybWFuY2UgY2hhbmdlc1xuICAgICAgICB0aGlzLnBlcmZvcm1hbmNlTW9uaXRvci5vblBlcmZvcm1hbmNlQ2hhbmdlKChpc0xvd1BlcmYpID0+IHtcbiAgICAgICAgICAgIGlmIChpc0xvd1BlcmYgJiYgdGhpcy5nbG9iZU1hbmFnZXIpIHtcbiAgICAgICAgICAgICAgICAvLyBEZXN0cm95IGdsb2JlIG9uIGxvdyBwZXJmb3JtYW5jZVxuICAgICAgICAgICAgICAgIHRoaXMuZ2xvYmVNYW5hZ2VyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdsb2JlTWFuYWdlciA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gU2V0IGN1cnJlbnQgeWVhciBpbiBmb290ZXJcbiAgICAgICAgdGhpcy5zZXRDdXJyZW50WWVhcigpO1xuICAgICAgICBcbiAgICAgICAgLy8gU2V0dXAgc21vb3RoIHNjcm9sbGluZ1xuICAgICAgICB0aGlzLnNldHVwU21vb3RoU2Nyb2xsaW5nKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBTZXR1cCBtb2JpbGUgbWVudVxuICAgICAgICB0aGlzLnNldHVwTW9iaWxlTWVudSgpO1xuICAgICAgICBcbiAgICAgICAgLy8gQWRkIGFjY2Vzc2liaWxpdHkgaW1wcm92ZW1lbnRzXG4gICAgICAgIHRoaXMuaW1wcm92ZUFjY2Vzc2liaWxpdHkoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEVuYWJsZSBuYXRpdmUgc2Nyb2xsXG4gICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnYXV0byc7XG4gICAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCAwKTtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZ3NhcCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGdzYXAucmVnaXN0ZXJQbHVnaW4oU2Nyb2xsVHJpZ2dlcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaGFuZGxlTG9hZGluZygpIHtcbiAgICAgICAgLy8gSGFuZGxlIGxvYWRpbmcgb3ZlcmxheVxuICAgICAgICBjb25zdCBsb2FkaW5nT3ZlcmxheSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5sb2FkaW5nLW92ZXJsYXknKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFNldCBhIG1heGltdW0gbG9hZGluZyB0aW1lXG4gICAgICAgIGNvbnN0IG1heExvYWRUaW1lID0gMzAwMDtcbiAgICAgICAgbGV0IGxvYWRpbmdDb21wbGV0ZSA9IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgaGlkZUxvYWRlciA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChsb2FkaW5nQ29tcGxldGUpIHJldHVybjtcbiAgICAgICAgICAgIGxvYWRpbmdDb21wbGV0ZSA9IHRydWU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChsb2FkaW5nT3ZlcmxheSkge1xuICAgICAgICAgICAgICAgIGxvYWRpbmdPdmVybGF5LmNsYXNzTGlzdC5hZGQoJ2ZhZGUtb3V0Jyk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdPdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gU2hvdyBib2R5IGNvbnRlbnRcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnbG9hZGVkJyk7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyBIaWRlIGxvYWRlciB3aGVuIGV2ZXJ5dGhpbmcgaXMgcmVhZHlcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBoaWRlTG9hZGVyKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEZvcmNlIGhpZGUgbG9hZGVyIGFmdGVyIG1heCB0aW1lXG4gICAgICAgIHNldFRpbWVvdXQoaGlkZUxvYWRlciwgbWF4TG9hZFRpbWUpO1xuICAgIH1cbiAgICBcbiAgICBzZXR1cFNjcm9sbFJlc3RvcmF0aW9uKCkge1xuICAgICAgICAvLyBSZXNldCBzY3JvbGwgcG9zaXRpb24gaW1tZWRpYXRlbHlcbiAgICAgICAgaWYgKGhpc3Rvcnkuc2Nyb2xsUmVzdG9yYXRpb24pIHtcbiAgICAgICAgICAgIGhpc3Rvcnkuc2Nyb2xsUmVzdG9yYXRpb24gPSAnbWFudWFsJztcbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgMCk7XG4gICAgfVxuICAgIFxuICAgIHNldEN1cnJlbnRZZWFyKCkge1xuICAgICAgICBjb25zdCB5ZWFyRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdXJyZW50LXllYXInKTtcbiAgICAgICAgaWYgKHllYXJFbGVtZW50KSB7XG4gICAgICAgICAgICB5ZWFyRWxlbWVudC50ZXh0Q29udGVudCA9IG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdZZWFyIHNldCB0bzonLCBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2N1cnJlbnQteWVhciBlbGVtZW50IG5vdCBmb3VuZCcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHNldHVwU21vb3RoU2Nyb2xsaW5nKCkge1xuICAgICAgICAvLyBBZGQgc21vb3RoIHNjcm9sbGluZyB0byBhbmNob3IgbGlua3NcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnYVtocmVmXj1cIiNcIl0nKS5mb3JFYWNoKGFuY2hvciA9PiB7XG4gICAgICAgICAgICBhbmNob3IuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGFuY2hvci5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBoZWFkZXJIZWlnaHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdoZWFkZXInKS5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFBvc2l0aW9uID0gdGFyZ2V0Lm9mZnNldFRvcCAtIGhlYWRlckhlaWdodCAtIDIwO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogdGFyZ2V0UG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBiZWhhdmlvcjogJ3Ntb290aCdcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBzZXR1cE1vYmlsZU1lbnUoKSB7XG4gICAgICAgIGNvbnN0IG1vYmlsZU1lbnVCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdidXR0b25bb25jbGljayo9XCJtb2JpbGUtbWVudVwiXScpO1xuICAgICAgICBjb25zdCBtb2JpbGVNZW51ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vYmlsZS1tZW51Jyk7XG4gICAgICAgIFxuICAgICAgICBpZiAobW9iaWxlTWVudUJ1dHRvbiAmJiBtb2JpbGVNZW51KSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgaW5saW5lIG9uY2xpY2sgYW5kIHVzZSBldmVudCBsaXN0ZW5lclxuICAgICAgICAgICAgbW9iaWxlTWVudUJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ29uY2xpY2snKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbW9iaWxlTWVudUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpc0hpZGRlbiA9IG1vYmlsZU1lbnUuY2xhc3NMaXN0LmNvbnRhaW5zKCdoaWRkZW4nKTtcbiAgICAgICAgICAgICAgICBtb2JpbGVNZW51LmNsYXNzTGlzdC50b2dnbGUoJ2hpZGRlbicpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBBUklBIGF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgICBtb2JpbGVNZW51QnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsIGlzSGlkZGVuKTtcbiAgICAgICAgICAgICAgICBtb2JpbGVNZW51QnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIGlzSGlkZGVuID8gJ0Nsb3NlIG1lbnUnIDogJ09wZW4gbWVudScpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIENsb3NlIG1vYmlsZSBtZW51IHdoZW4gY2xpY2tpbmcgb24gYSBsaW5rXG4gICAgICAgICAgICBtb2JpbGVNZW51LnF1ZXJ5U2VsZWN0b3JBbGwoJ2EnKS5mb3JFYWNoKGxpbmsgPT4ge1xuICAgICAgICAgICAgICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG1vYmlsZU1lbnUuY2xhc3NMaXN0LmFkZCgnaGlkZGVuJyk7XG4gICAgICAgICAgICAgICAgICAgIG1vYmlsZU1lbnVCdXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpbXByb3ZlQWNjZXNzaWJpbGl0eSgpIHtcbiAgICAgICAgLy8gQWRkIHNraXAgbGluayBmb3Iga2V5Ym9hcmQgbmF2aWdhdGlvblxuICAgICAgICBjb25zdCBza2lwTGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgc2tpcExpbmsuaHJlZiA9ICcjbWFpbi1jb250ZW50JztcbiAgICAgICAgc2tpcExpbmsuY2xhc3NOYW1lID0gJ3NyLW9ubHkgZm9jdXM6bm90LXNyLW9ubHkgZm9jdXM6YWJzb2x1dGUgZm9jdXM6dG9wLTQgZm9jdXM6bGVmdC00IGJnLWdyYXktODAwIHRleHQtd2hpdGUgcHgtNCBweS0yIHJvdW5kZWQgei01MCc7XG4gICAgICAgIHNraXBMaW5rLnRleHRDb250ZW50ID0gJ1NraXAgdG8gbWFpbiBjb250ZW50JztcbiAgICAgICAgZG9jdW1lbnQuYm9keS5pbnNlcnRCZWZvcmUoc2tpcExpbmssIGRvY3VtZW50LmJvZHkuZmlyc3RDaGlsZCk7XG4gICAgICAgIFxuICAgICAgICAvLyBBZGQgbWFpbiBjb250ZW50IGxhbmRtYXJrXG4gICAgICAgIGNvbnN0IG1haW5TZWN0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcignc2VjdGlvbi5yZWxhdGl2ZScpO1xuICAgICAgICBpZiAobWFpblNlY3Rpb24pIHtcbiAgICAgICAgICAgIG1haW5TZWN0aW9uLnNldEF0dHJpYnV0ZSgnaWQnLCAnbWFpbi1jb250ZW50Jyk7XG4gICAgICAgICAgICBtYWluU2VjdGlvbi5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnbWFpbicpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBBZGQgQVJJQSBsYWJlbHMgdG8gbmF2aWdhdGlvblxuICAgICAgICBjb25zdCBuYXYgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCduYXYnKTtcbiAgICAgICAgaWYgKG5hdikge1xuICAgICAgICAgICAgbmF2LnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsICdNYWluIG5hdmlnYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gQWRkIEFSSUEgbGFiZWxzIHRvIHNvY2lhbCBsaW5rc1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdhW2hyZWYqPVwibGlua2VkaW5cIl0nKS5mb3JFYWNoKGxpbmsgPT4ge1xuICAgICAgICAgICAgbGluay5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCAnTGlua2VkSW4gcHJvZmlsZScpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIE1ha2UgZGVjb3JhdGl2ZSBTVkdzIGhpZGRlbiBmcm9tIHNjcmVlbiByZWFkZXJzXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3N2ZycpLmZvckVhY2goc3ZnID0+IHtcbiAgICAgICAgICAgIGlmICghc3ZnLmNsb3Nlc3QoJ2J1dHRvbicpICYmICFzdmcuY2xvc2VzdCgnYScpKSB7XG4gICAgICAgICAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIEFkZCBhbHQgdGV4dCB0byBwYXJ0bmVyIGxvZ29zXG4gICAgICAgIGNvbnN0IHBhcnRuZXJMb2dvcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wYXJ0bmVyLWxvZ28nKS5mb3JFYWNoKChsb2dvLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gbG9nby5jbG9zZXN0KCdzdmcnKTtcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnQuc2V0QXR0cmlidXRlKCdyb2xlJywgJ2ltZycpO1xuICAgICAgICAgICAgICAgIHBhcmVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCBgUGFydG5lciBsb2dvICR7aW5kZXggKyAxfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gQ2xlYW4gdXAgcmVzb3VyY2VzIHdoZW4gbmVlZGVkXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5hbmltYXRpb25NYW5hZ2VyPy5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuZ2xvYmVNYW5hZ2VyPy5kZXN0cm95KCk7XG4gICAgfVxufVxuXG4vLyBJbml0aWFsaXplIGFwcFxuY29uc3QgYXBwID0gbmV3IEFwcCgpO1xuXG4vLyBFeHBvcnQgZm9yIGV4dGVybmFsIHVzZSBpZiBuZWVkZWRcbndpbmRvdy5Ccmltc3RvbmVBcHAgPSBhcHA7Il0sCiAgIm1hcHBpbmdzIjogIjs7O0FBS08sTUFBTSxlQUFOLE1BQW1CO0FBQUEsSUFDdEIsY0FBYztBQUNWLFdBQUssY0FBYyxTQUFTLGVBQWUsY0FBYztBQUN6RCxXQUFLLFdBQVcsU0FBUyxlQUFlLFdBQVc7QUFDbkQsV0FBSyxVQUFVLFNBQVMsZUFBZSxVQUFVO0FBQ2pELFdBQUssT0FBTyxTQUFTO0FBRXJCLFdBQUssS0FBSztBQUFBLElBQ2Q7QUFBQSxJQUVBLE9BQU87QUFFSCxZQUFNLGVBQWUsYUFBYSxRQUFRLE9BQU8sS0FBSztBQUN0RCxXQUFLLFNBQVMsWUFBWTtBQUcxQixVQUFJLEtBQUssYUFBYTtBQUNsQixhQUFLLFlBQVksaUJBQWlCLFNBQVMsTUFBTSxLQUFLLFlBQVksQ0FBQztBQUduRSxhQUFLLFlBQVksYUFBYSxjQUFjLGNBQWM7QUFDMUQsYUFBSyxZQUFZLGFBQWEsZ0JBQWdCLGlCQUFpQixPQUFPO0FBQUEsTUFDMUU7QUFBQSxJQUNKO0FBQUEsSUFFQSxTQUFTLE9BQU87QUFDWixV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
