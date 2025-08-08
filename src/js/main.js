/**
 * Main application entry point
 * Initializes all modules and manages application lifecycle
 */

import { ThemeManager } from './theme.js';
import { AnimationManager } from './animations.js';
import { GlobeManager } from './globe.js';
import { PerformanceMonitor } from './performance.js';

class App {
    constructor() {
        this.themeManager = null;
        this.animationManager = null;
        this.globeManager = null;
        this.performanceMonitor = null;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        // Handle scroll restoration
        this.setupScrollRestoration();
        
        // Initialize loading sequence
        this.handleLoading();
        
        // Initialize performance monitor first
        this.performanceMonitor = new PerformanceMonitor();
        
        // Initialize modules
        this.themeManager = new ThemeManager();
        this.animationManager = new AnimationManager();
        
        // Only initialize globe on desktop and non-low-performance devices
        const isMobile = window.innerWidth < 768;
        if (!isMobile && !this.performanceMonitor.isLowPerformance) {
            // Use Intersection Observer to lazy load globe when visible
            const globeContainer = document.getElementById('globe-container');
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
        
        // Listen for performance changes
        this.performanceMonitor.onPerformanceChange((isLowPerf) => {
            if (isLowPerf && this.globeManager) {
                // Destroy globe on low performance
                this.globeManager.destroy();
                this.globeManager = null;
            }
        });
        
        // Set current year in footer
        this.setCurrentYear();
        
        // Setup smooth scrolling
        this.setupSmoothScrolling();
        
        // Setup mobile menu
        this.setupMobileMenu();
        
        // Add accessibility improvements
        this.improveAccessibility();
        
        // Enable native scroll
        document.body.style.overflow = 'auto';
        window.scrollTo(0, 0);
        
        if (typeof gsap !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
    }
    
    handleLoading() {
        // Handle loading overlay
        const loadingOverlay = document.querySelector('.loading-overlay');
        
        // Set a maximum loading time
        const maxLoadTime = 3000;
        let loadingComplete = false;
        
        const hideLoader = () => {
            if (loadingComplete) return;
            loadingComplete = true;
            
            if (loadingOverlay) {
                loadingOverlay.classList.add('fade-out');
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 500);
            }
            
            // Show body content
            document.body.classList.add('loaded');
        };
        
        // Hide loader when everything is ready
        window.addEventListener('load', hideLoader);
        
        // Force hide loader after max time
        setTimeout(hideLoader, maxLoadTime);
    }
    
    setupScrollRestoration() {
        // Reset scroll position immediately
        if (history.scrollRestoration) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
    }
    
    setCurrentYear() {
        const yearElement = document.getElementById('current-year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
            console.log('Year set to:', new Date().getFullYear());
        } else {
            console.log('current-year element not found');
        }
    }
    
    setupSmoothScrolling() {
        // Add smooth scrolling to anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                
                if (target) {
                    const headerHeight = document.querySelector('header').offsetHeight;
                    const targetPosition = target.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    setupMobileMenu() {
        const mobileMenuButton = document.querySelector('button[onclick*="mobile-menu"]');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuButton && mobileMenu) {
            // Remove inline onclick and use event listener
            mobileMenuButton.removeAttribute('onclick');
            
            mobileMenuButton.addEventListener('click', () => {
                const isHidden = mobileMenu.classList.contains('hidden');
                mobileMenu.classList.toggle('hidden');
                
                // Update ARIA attributes
                mobileMenuButton.setAttribute('aria-expanded', isHidden);
                mobileMenuButton.setAttribute('aria-label', isHidden ? 'Close menu' : 'Open menu');
            });
            
            // Close mobile menu when clicking on a link
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('hidden');
                    mobileMenuButton.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }
    
    improveAccessibility() {
        // Add skip link for keyboard navigation
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-gray-800 text-white px-4 py-2 rounded z-50';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Add main content landmark
        const mainSection = document.querySelector('section.relative');
        if (mainSection) {
            mainSection.setAttribute('id', 'main-content');
            mainSection.setAttribute('role', 'main');
        }
        
        // Add ARIA labels to navigation
        const nav = document.querySelector('nav');
        if (nav) {
            nav.setAttribute('aria-label', 'Main navigation');
        }
        
        // Add ARIA labels to social links
        document.querySelectorAll('a[href*="linkedin"]').forEach(link => {
            link.setAttribute('aria-label', 'LinkedIn profile');
        });
        
        // Make decorative SVGs hidden from screen readers
        document.querySelectorAll('svg').forEach(svg => {
            if (!svg.closest('button') && !svg.closest('a')) {
                svg.setAttribute('aria-hidden', 'true');
            }
        });
        
        // Add alt text to partner logos
        const partnerLogos = document.querySelectorAll('.partner-logo').forEach((logo, index) => {
            const parent = logo.closest('svg');
            if (parent) {
                parent.setAttribute('role', 'img');
                parent.setAttribute('aria-label', `Partner logo ${index + 1}`);
            }
        });
    }
    
    // Clean up resources when needed
    destroy() {
        this.animationManager?.destroy();
        this.globeManager?.destroy();
    }
}

// Initialize app
const app = new App();

// Export for external use if needed
window.BrimstoneApp = app;