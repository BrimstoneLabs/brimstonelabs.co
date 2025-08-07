/**
 * Resource Hints Module
 * Manages resource hints for optimal loading performance
 */

import { logger } from './logger.js';
import { config } from './config.js';

const log = logger.child('ResourceHints');

class ResourceHints {
  constructor() {
    this.hintsApplied = new Set();
    this.init();
  }

  /**
   * Initialize resource hints
   */
  init() {
    // Apply DNS prefetch for known domains
    this.applyDNSPrefetch();
    
    // Apply preconnect for critical origins
    this.applyPreconnect();
    
    // Set up adaptive prefetching
    this.setupAdaptivePrefetch();
    
    log.info('Resource hints initialized');
  }

  /**
   * Apply DNS prefetch hints
   */
  applyDNSPrefetch() {
    const domains = [
      'https://cdnjs.cloudflare.com',
      'https://unpkg.com',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];
    
    domains.forEach(domain => {
      this.addHint('dns-prefetch', domain);
    });
  }

  /**
   * Apply preconnect hints
   */
  applyPreconnect() {
    const origins = [
      { href: 'https://fonts.googleapis.com', crossorigin: false },
      { href: 'https://fonts.gstatic.com', crossorigin: true }
    ];
    
    origins.forEach(({ href, crossorigin }) => {
      this.addHint('preconnect', href, { crossorigin });
    });
  }

  /**
   * Add a resource hint
   * @param {string} rel - Hint relationship
   * @param {string} href - Resource URL
   * @param {Object} options - Additional options
   */
  addHint(rel, href, options = {}) {
    const key = `${rel}:${href}`;
    
    if (this.hintsApplied.has(key)) {
      return;
    }
    
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    
    if (options.crossorigin) {
      link.crossOrigin = 'anonymous';
    }
    
    if (options.as) {
      link.as = options.as;
    }
    
    if (options.type) {
      link.type = options.type;
    }
    
    document.head.appendChild(link);
    this.hintsApplied.add(key);
    
    log.debug(`Added ${rel} hint for ${href}`);
  }

  /**
   * Preload a critical resource
   * @param {string} href - Resource URL
   * @param {string} as - Resource type
   * @param {Object} options - Additional options
   */
  preload(href, as, options = {}) {
    this.addHint('preload', href, { ...options, as });
  }

  /**
   * Prefetch a resource for future navigation
   * @param {string} href - Resource URL
   * @param {string} as - Resource type
   */
  prefetch(href, as) {
    this.addHint('prefetch', href, { as });
  }

  /**
   * Prerender a page for instant navigation
   * @param {string} href - Page URL
   */
  prerender(href) {
    // Check if prerender is supported and connection is fast
    if (!this.shouldPrerender()) {
      log.debug('Skipping prerender due to connection or support');
      return;
    }
    
    this.addHint('prerender', href);
  }

  /**
   * Set up adaptive prefetching based on user behavior
   */
  setupAdaptivePrefetch() {
    if (!config.features.adaptivePrefetch) return;
    
    // Prefetch on hover (desktop)
    if (window.matchMedia('(hover: hover)').matches) {
      this.setupHoverPrefetch();
    }
    
    // Prefetch visible links
    this.setupVisibleLinksPrefetch();
  }

  /**
   * Set up prefetch on hover
   */
  setupHoverPrefetch() {
    let hoverTimer;
    
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      
      const href = link.href;
      if (!this.isValidPrefetchTarget(href)) return;
      
      // Debounce hover prefetch
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        this.prefetch(href, 'document');
      }, 100);
    });
    
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a[href]')) {
        clearTimeout(hoverTimer);
      }
    });
  }

  /**
   * Set up prefetch for visible links
   */
  setupVisibleLinksPrefetch() {
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const href = entry.target.href;
          if (this.isValidPrefetchTarget(href)) {
            // Delay prefetch to avoid overwhelming the browser
            setTimeout(() => {
              this.prefetch(href, 'document');
            }, 2000);
          }
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px',
      threshold: 1.0
    });
    
    // Observe internal links
    document.querySelectorAll('a[href^="/"], a[href^="#"]').forEach(link => {
      observer.observe(link);
    });
  }

  /**
   * Check if URL is valid for prefetching
   * @param {string} href - URL to check
   * @returns {boolean} Whether to prefetch
   */
  isValidPrefetchTarget(href) {
    // Don't prefetch external links
    if (!href.startsWith(window.location.origin)) {
      return false;
    }
    
    // Don't prefetch already visited
    if (this.hintsApplied.has(`prefetch:${href}`)) {
      return false;
    }
    
    // Don't prefetch downloads or special protocols
    if (href.match(/\.(pdf|zip|exe|dmg|mp4|mp3)$/i)) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if prerendering should be enabled
   * @returns {boolean} Whether to prerender
   */
  shouldPrerender() {
    // Check connection speed
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      // Don't prerender on slow connections
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return false;
      }
      
      // Don't prerender if save data is enabled
      if (connection.saveData) {
        return false;
      }
    }
    
    // Check memory availability
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
      if (memoryUsage > 0.8) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Clear all hints (for testing)
   */
  clear() {
    this.hintsApplied.clear();
    log.info('Resource hints cleared');
  }
}

// Create and export singleton instance
export const resourceHints = new ResourceHints();

// Export class for testing
export default ResourceHints;