/**
 * Animation management module
 * Handles GSAP animations and ScrollTrigger effects
 */

export class AnimationManager {
    constructor() {
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
        
        // Register ScrollTrigger plugin
        gsap.registerPlugin(ScrollTrigger);
        
        // Initialize Lenis smooth scrolling
        this.initLenis();
        
        // Initialize animations
        this.initTextAnimations();
        this.initScrollAnimations();
        this.initFeatureCards();
        
        // Setup show content callback for loading sequence
        this.showContentCallback = this.showContent.bind(this);
        
        // Refresh ScrollTrigger after setup
        setTimeout(() => ScrollTrigger.refresh(), 100);
    }
    
    initLenis() {
        // Skip on mobile for performance
        const isMobile = window.innerWidth < 768;
        if (isMobile) return;
        
        // Check if Lenis is available
        if (typeof Lenis === 'undefined') {
            console.warn('Lenis not available, falling back to native scroll');
            return;
        }
        
        // Create Lenis instance
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false
        });
        
        // Connect Lenis to GSAP ScrollTrigger
        this.lenis.on('scroll', ScrollTrigger.update);
        
        gsap.ticker.add((time) => {
            this.lenis.raf(time * 1000);
        });
        
        gsap.ticker.lagSmoothing(0);
        
        // Handle anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target && this.lenis) {
                    this.lenis.scrollTo(target, {
                        offset: -80, // Account for fixed header
                        duration: 1.5
                    });
                }
            });
        });
        
        // Refresh Lenis on window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (this.lenis) {
                    this.lenis.resize();
                }
            }, 250);
        });
    }
    
    showContentImmediately() {
        document.querySelectorAll('.reveal-type').forEach(el => {
            el.classList.add('split-ready');
            el.style.opacity = '1';
            // Ensure any child elements are also visible
            el.querySelectorAll('*').forEach(child => {
                child.style.opacity = '1';
            });
        });
        document.querySelectorAll('.feature-card').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
        this.showContent();
    }
    
    showContent() {
        document.body.classList.add('loaded');
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('fade-out');
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
        
        // Check if required libraries are available
        if (typeof SplitType === 'undefined' || typeof gsap === 'undefined') {
            console.warn('SplitType or GSAP not available, showing content immediately');
            splitTypes.forEach(element => {
                element.classList.add('split-ready');
                element.style.opacity = '1';
            });
            setTimeout(() => this.showContent(), 200);
            return;
        }
        
        splitTypes.forEach((element, index) => {
            try {
                const splitText = new SplitType(element, {
                    types: "words, chars"
                });
                
                // Make sure element is visible first
                element.classList.add('split-ready');
                this.splitCompleted++;
                
                if (this.splitCompleted === splitTypes.length) {
                    setTimeout(() => this.showContent(), 200);
                }
                
                const isFirstSection = element.closest('section')?.classList.contains('relative');
                const isFastReveal = element.dataset.revealSpeed === 'fast';
                const animationDuration = isFastReveal ? 0.2 : (isFirstSection ? 0.4 : 0.8);
                const animationStagger = isFastReveal ? 0.02 : (isFirstSection ? 0.05 : 0.1);
                
                // Set initial state for characters
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
                console.error('Error initializing text animation for element:', element, error);
                // Fallback: show element immediately
                element.classList.add('split-ready');
                element.style.opacity = '1';
                this.splitCompleted++;
                
                if (this.splitCompleted === splitTypes.length) {
                    setTimeout(() => this.showContent(), 200);
                }
            }
        });
    }
    
    initScrollAnimations() {
        // Animate paragraphs (excluding specific areas)
        const paragraphs = document.querySelectorAll(
            'p:not(.feature-card p):not(.careers-cta p):not(button p):not(a p):not(footer p)'
        );
        
        paragraphs.forEach(p => {
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
        if (typeof gsap === 'undefined') return;
        
        // Skip card animations on mobile devices
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            // Show cards immediately on mobile
            document.querySelectorAll('.feature-card').forEach(card => {
                card.style.opacity = '1';
                card.style.transform = 'none';
            });
            const careersCta = document.querySelector('.careers-cta');
            if (careersCta) {
                careersCta.style.opacity = '1';
                careersCta.style.transform = 'none';
            }
            return;
        }
        
        // Initialize founder card animations
        this.initFounderCards();
        
        // Animate career cards specifically
        const careerCards = document.querySelectorAll('#careers .feature-card');
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
        
        // Animate careers CTA with career cards
        const careersCta = document.querySelector('.careers-cta');
        if (careersCta) {
            gsap.set(careersCta, { opacity: 0, y: 50 });
            
            gsap.to(careersCta, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                delay: 1.2, // After the 3 career cards
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
        
        // Animate service cards together with stagger
        const serviceCards = document.querySelectorAll('#services .feature-card');
        if (serviceCards.length > 0) {
            serviceCards.forEach(card => {
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
        
        // Animate process cards together
        const processSection = document.querySelector('#process');
        if (processSection) {
            const processCards = processSection.querySelectorAll('.feature-card');
            if (processCards.length > 0) {
                processCards.forEach(card => {
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
        
        // Animate other feature cards (not process, careers, or services)
        const otherCards = document.querySelectorAll('.feature-card:not(#careers .feature-card):not(#services .feature-card):not(#process .feature-card)');
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
        // Set up Intersection Observer for founder cards
        const founderCards = document.querySelectorAll('.founder-card');
        
        if (founderCards.length === 0) return;
        
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        founderCards.forEach(card => {
            observer.observe(card);
        });
        
        // Add parallax effect to founder photos
        this.initFounderParallax();
    }
    
    initFounderParallax() {
        if (typeof gsap === 'undefined') return;
        
        // Skip parallax on mobile for performance
        const isMobile = window.innerWidth < 768;
        if (isMobile) return;
        
        // Only select the actual images, not any divs or overlays
        const founderPhotos = document.querySelectorAll('.founder-card > div:first-child > img');
        
        founderPhotos.forEach((photo) => {
            // Scale up the photo to have extra space for parallax movement
            gsap.set(photo, {
                scale: 1.2,
                transformOrigin: "center top",
                yPercent: 0
            });
            
            // Apply parallax effect to the photo only
            // Move from 0 to negative to create downward parallax
            gsap.fromTo(photo, 
                {
                    yPercent: 0
                },
                {
                    yPercent: -15,
                    ease: "none",
                    scrollTrigger: {
                        trigger: photo.closest('.founder-card'),
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
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    }
}