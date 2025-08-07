/**
 * Application Configuration
 * Centralized configuration management for the BrimstoneLabs website
 */

export const config = {
  // Animation Settings
  animations: {
    enabled: true,
    respectMotionPreference: true,
    durations: {
      fast: 400,
      normal: 800,
      slow: 1200,
    },
    stagger: {
      hero: 0.05,
      default: 0.1,
    },
  },

  // Globe Settings
  globe: {
    enabled: true,
    radius: 532,
    particleCount: 120,
    maxConnections: 10,
    connectionSpawnInterval: 1.2,
    opacity: {
      desktop: 0.08,
      mobile: 0.03,
    },
    colors: {
      wireframe: 0xf97316,
      connection: { r: 1, g: 0.8, b: 0.2 },
      particle: { r: 1, g: 1, b: 0.3 },
    },
  },

  // Theme Settings
  theme: {
    default: 'dark',
    storageKey: 'brimstonelabs-theme',
  },

  // Responsive Breakpoints
  breakpoints: {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    wide: 1280,
    ultrawide: 1920,
  },

  // API Endpoints (for future use)
  api: {
    contact: '/api/contact',
    newsletter: '/api/newsletter',
  },

  // Performance Settings
  performance: {
    debounceDelay: 250,
    throttleDelay: 100,
    maxLoadTime: 3000,
    lazyLoadOffset: '100px',
  },

  // Feature Flags
  features: {
    animations: true,
    globe: true,
    theme: true,
    analytics: false,
    newsletter: false,
    lazyLoading: true,
    adaptivePrefetch: true,
    resourceHints: true,
  },
  
  // Asset configuration
  assets: {
    preloadFonts: true,
    criticalImages: [
      // Add critical image paths here
    ],
    lazyLoadOffset: '50px',
    prefetchDelay: 2000,
  },

  // Development Settings
  dev: {
    debug: process.env.NODE_ENV === 'development',
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  },
};

// Utility function to safely get nested config values
export function getConfig(path, defaultValue = null) {
  const keys = path.split('.');
  let value = config;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value;
}

// Device detection utilities
export const device = {
  isMobile() {
    return window.innerWidth < config.breakpoints.tablet;
  },
  isTablet() {
    return window.innerWidth >= config.breakpoints.tablet && 
           window.innerWidth < config.breakpoints.desktop;
  },
  isDesktop() {
    return window.innerWidth >= config.breakpoints.desktop;
  },
  hasTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  supportsHover() {
    return window.matchMedia('(hover: hover)').matches;
  },
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
};