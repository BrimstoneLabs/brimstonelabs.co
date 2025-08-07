/**
 * Asset Loader Module
 * Handles lazy loading and optimization of assets
 */

import { logger } from './logger.js';
import { config } from './config.js';

const log = logger.child('AssetLoader');

class AssetLoader {
  constructor() {
    this.loadedAssets = new Set();
    this.loadingAssets = new Map();
    this.observers = new Map();
    this.init();
  }

  /**
   * Initialize asset loader
   */
  init() {
    // Set up intersection observer for lazy loading
    this.setupLazyLoading();
    
    // Preload critical resources
    this.preloadCriticalAssets();
    
    log.info('Asset loader initialized');
  }

  /**
   * Preload critical assets
   */
  preloadCriticalAssets() {
    // Preload critical fonts
    if (config.assets.preloadFonts) {
      this.preloadFont('Funnel Display', [300, 400, 500, 600, 700, 800]);
    }
    
    // Preload hero images
    config.assets.criticalImages.forEach(src => {
      this.preloadImage(src);
    });
  }

  /**
   * Preload a font
   * @param {string} family - Font family
   * @param {Array} weights - Font weights to preload
   */
  async preloadFont(family, weights = [400]) {
    if (!document.fonts) return;
    
    const promises = weights.map(weight => {
      const font = new FontFace(family, `local('${family}')`, { weight });
      return font.load().catch(err => {
        log.warn(`Failed to preload font ${family} ${weight}`, err);
      });
    });
    
    await Promise.all(promises);
    log.debug(`Preloaded font ${family}`);
  }

  /**
   * Preload an image
   * @param {string} src - Image source
   * @returns {Promise} Image load promise
   */
  preloadImage(src) {
    if (this.loadedAssets.has(src)) {
      return Promise.resolve();
    }
    
    if (this.loadingAssets.has(src)) {
      return this.loadingAssets.get(src);
    }
    
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadedAssets.add(src);
        this.loadingAssets.delete(src);
        log.debug(`Preloaded image: ${src}`);
        resolve(img);
      };
      
      img.onerror = () => {
        this.loadingAssets.delete(src);
        log.error(`Failed to preload image: ${src}`);
        reject(new Error(`Failed to load ${src}`));
      };
      
      img.src = src;
    });
    
    this.loadingAssets.set(src, promise);
    return promise;
  }

  /**
   * Set up lazy loading for images
   */
  setupLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      this.loadAllImages();
      return;
    }
    
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01
    };
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          imageObserver.unobserve(entry.target);
        }
      });
    }, options);
    
    this.observers.set('images', imageObserver);
    
    // Observe all images with data-src
    this.observeImages();
  }

  /**
   * Observe images for lazy loading
   */
  observeImages() {
    const images = document.querySelectorAll('img[data-src]');
    const observer = this.observers.get('images');
    
    if (observer) {
      images.forEach(img => observer.observe(img));
    }
  }

  /**
   * Load an image
   * @param {HTMLImageElement} img - Image element
   */
  loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;
    
    // Create a new image to load
    const tempImg = new Image();
    
    tempImg.onload = () => {
      img.src = src;
      img.removeAttribute('data-src');
      
      // Add fade-in animation
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease-in-out';
      
      requestAnimationFrame(() => {
        img.style.opacity = '1';
      });
      
      // Fire custom event
      img.dispatchEvent(new CustomEvent('lazyloaded', {
        detail: { src },
        bubbles: true
      }));
      
      log.debug(`Lazy loaded image: ${src}`);
    };
    
    tempImg.onerror = () => {
      log.error(`Failed to lazy load image: ${src}`);
      img.removeAttribute('data-src');
    };
    
    tempImg.src = src;
  }

  /**
   * Load all images (fallback)
   */
  loadAllImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => this.loadImage(img));
  }

  /**
   * Dynamically load a script
   * @param {string} src - Script source
   * @param {Object} options - Loading options
   * @returns {Promise} Script load promise
   */
  loadScript(src, options = {}) {
    if (this.loadedAssets.has(src)) {
      return Promise.resolve();
    }
    
    if (this.loadingAssets.has(src)) {
      return this.loadingAssets.get(src);
    }
    
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      
      if (options.async) script.async = true;
      if (options.defer) script.defer = true;
      if (options.module) script.type = 'module';
      
      script.onload = () => {
        this.loadedAssets.add(src);
        this.loadingAssets.delete(src);
        log.debug(`Loaded script: ${src}`);
        resolve();
      };
      
      script.onerror = () => {
        this.loadingAssets.delete(src);
        log.error(`Failed to load script: ${src}`);
        reject(new Error(`Failed to load ${src}`));
      };
      
      document.head.appendChild(script);
    });
    
    this.loadingAssets.set(src, promise);
    return promise;
  }

  /**
   * Dynamically load a stylesheet
   * @param {string} href - Stylesheet href
   * @returns {Promise} Stylesheet load promise
   */
  loadStylesheet(href) {
    if (this.loadedAssets.has(href)) {
      return Promise.resolve();
    }
    
    if (this.loadingAssets.has(href)) {
      return this.loadingAssets.get(href);
    }
    
    const promise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      
      link.onload = () => {
        this.loadedAssets.add(href);
        this.loadingAssets.delete(href);
        log.debug(`Loaded stylesheet: ${href}`);
        resolve();
      };
      
      link.onerror = () => {
        this.loadingAssets.delete(href);
        log.error(`Failed to load stylesheet: ${href}`);
        reject(new Error(`Failed to load ${href}`));
      };
      
      document.head.appendChild(link);
    });
    
    this.loadingAssets.set(href, promise);
    return promise;
  }

  /**
   * Prefetch a resource for future navigation
   * @param {string} url - Resource URL
   * @param {string} as - Resource type
   */
  prefetch(url, as = 'document') {
    if (this.loadedAssets.has(url)) return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    if (as) link.as = as;
    
    document.head.appendChild(link);
    this.loadedAssets.add(url);
    
    log.debug(`Prefetched: ${url}`);
  }

  /**
   * Clean up observers
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.loadingAssets.clear();
    log.info('Asset loader destroyed');
  }
}

// Create and export singleton instance
export const assetLoader = new AssetLoader();

// Export class for testing
export default AssetLoader;