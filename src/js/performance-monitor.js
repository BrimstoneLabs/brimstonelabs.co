/**
 * Performance Monitoring Module
 * Tracks and reports performance metrics
 */

import { logger } from './logger.js';
import { config } from './config.js';

const log = logger.child('Performance');

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = {};
    this.init();
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    // Track page load performance
    this.trackPageLoad();
    
    // Set up resource timing observer
    this.observeResources();
    
    // Set up largest contentful paint observer
    this.observeLCP();
    
    // Set up first input delay
    this.observeFID();
    
    // Set up cumulative layout shift
    this.observeCLS();
    
    log.info('Performance monitoring initialized');
  }

  /**
   * Track page load metrics
   */
  trackPageLoad() {
    if (window.performance && performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = performance.timing;
          const metrics = {
            // DNS lookup
            dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
            
            // TCP connection
            tcpConnection: timing.connectEnd - timing.connectStart,
            
            // Request/Response
            requestTime: timing.responseEnd - timing.requestStart,
            
            // DOM processing
            domProcessing: timing.domComplete - timing.domLoading,
            
            // Page load
            pageLoad: timing.loadEventEnd - timing.navigationStart,
            
            // DOM ready
            domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
            
            // First byte
            timeToFirstByte: timing.responseStart - timing.navigationStart,
          };
          
          this.metrics.pageLoad = metrics;
          log.info('Page load metrics', metrics);
          
          // Report metrics
          this.reportMetrics('pageLoad', metrics);
        }, 0);
      });
    }
  }

  /**
   * Observe resource loading
   */
  observeResources() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const metric = {
                name: entry.name,
                duration: entry.duration,
                size: entry.transferSize,
                type: entry.initiatorType,
              };
              
              // Track slow resources
              if (entry.duration > 1000) {
                log.warn('Slow resource detected', metric);
              }
            }
          }
        });
        
        observer.observe({ entryTypes: ['resource'] });
        this.observers.resource = observer;
      } catch (error) {
        log.error('Failed to set up resource observer', error);
      }
    }
  }

  /**
   * Observe Largest Contentful Paint
   */
  observeLCP() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
          log.info('LCP', this.metrics.lcp);
          
          // Good LCP is under 2.5s
          if (this.metrics.lcp > 2500) {
            log.warn('Poor LCP detected', this.metrics.lcp);
          }
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.lcp = observer;
      } catch (error) {
        log.debug('LCP observer not supported');
      }
    }
  }

  /**
   * Observe First Input Delay
   */
  observeFID() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'first-input') {
              this.metrics.fid = entry.processingStart - entry.startTime;
              log.info('FID', this.metrics.fid);
              
              // Good FID is under 100ms
              if (this.metrics.fid > 100) {
                log.warn('Poor FID detected', this.metrics.fid);
              }
            }
          }
        });
        
        observer.observe({ entryTypes: ['first-input'] });
        this.observers.fid = observer;
      } catch (error) {
        log.debug('FID observer not supported');
      }
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  observeCLS() {
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        let clsEntries = [];
        
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              const firstSessionEntry = clsEntries[0];
              const lastSessionEntry = clsEntries[clsEntries.length - 1];
              
              // If the entry is part of the current session
              if (entry.startTime - lastSessionEntry?.startTime < 1000 &&
                  entry.startTime - firstSessionEntry?.startTime < 5000) {
                clsEntries.push(entry);
                clsValue += entry.value;
              } else {
                // Start a new session
                clsEntries = [entry];
                clsValue = entry.value;
              }
              
              this.metrics.cls = clsValue;
              
              // Good CLS is under 0.1
              if (clsValue > 0.1) {
                log.warn('Poor CLS detected', clsValue);
              }
            }
          }
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
        this.observers.cls = observer;
      } catch (error) {
        log.debug('CLS observer not supported');
      }
    }
  }

  /**
   * Mark a custom timing
   * @param {string} name - Timing name
   */
  mark(name) {
    if (performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Measure between two marks
   * @param {string} name - Measurement name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   * @returns {number} Duration in milliseconds
   */
  measure(name, startMark, endMark) {
    if (performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name);
        const duration = entries[entries.length - 1]?.duration || 0;
        
        log.info(`Measurement: ${name}`, duration);
        return duration;
      } catch (error) {
        log.error('Failed to measure', error);
        return 0;
      }
    }
    return 0;
  }

  /**
   * Track a custom metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   */
  trackMetric(name, value) {
    this.metrics[name] = value;
    log.info(`Custom metric: ${name}`, value);
    this.reportMetrics(name, value);
  }

  /**
   * Get all metrics
   * @returns {Object} All collected metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      memory: this.getMemoryUsage(),
      connection: this.getConnectionInfo(),
    };
  }

  /**
   * Get memory usage if available
   * @returns {Object|null} Memory usage info
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  /**
   * Get connection info if available
   * @returns {Object|null} Connection info
   */
  getConnectionInfo() {
    if (navigator.connection) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData,
      };
    }
    return null;
  }

  /**
   * Report metrics to analytics service
   * @param {string} category - Metric category
   * @param {Object} data - Metric data
   */
  reportMetrics(category, data) {
    // In production, send to analytics service
    if (!config.dev.debug && config.features.analytics) {
      // Example: Google Analytics, custom analytics endpoint, etc.
      // gtag('event', 'performance', {
      //   event_category: category,
      //   event_label: JSON.stringify(data),
      // });
    }
  }

  /**
   * Clean up observers
   */
  destroy() {
    Object.values(this.observers).forEach(observer => {
      if (observer && observer.disconnect) {
        observer.disconnect();
      }
    });
    
    this.observers = {};
    log.info('Performance monitoring destroyed');
  }
}

// Create and export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export class for testing
export default PerformanceMonitor;