/**
 * Global Error Handler
 * Catches and handles uncaught errors gracefully
 */

import { logger } from './logger.js';
import { config } from './config.js';

const log = logger.child('ErrorHandler');

class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 50;
    this.errorCallbacks = [];
    this.init();
  }

  /**
   * Initialize error handlers
   */
  init() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error,
        type: 'uncaught',
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        error: event.reason,
        type: 'unhandled-promise',
      });
    });

    log.info('Error handler initialized');
  }

  /**
   * Handle an error
   * @param {Object} errorInfo - Error information
   */
  handleError(errorInfo) {
    // Add timestamp
    errorInfo.timestamp = new Date().toISOString();
    errorInfo.url = window.location.href;
    errorInfo.userAgent = navigator.userAgent;

    // Store error (with limit)
    this.errors.push(errorInfo);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log error
    log.error('Error caught', errorInfo);

    // Call registered callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorInfo);
      } catch (e) {
        log.error('Error in error callback', e);
      }
    });

    // In production, send to error tracking service
    if (!config.dev.debug) {
      this.reportError(errorInfo);
    }

    // Show user-friendly error message (if critical)
    if (this.isCriticalError(errorInfo)) {
      this.showErrorNotification(errorInfo);
    }
  }

  /**
   * Check if error is critical
   * @param {Object} errorInfo - Error information
   * @returns {boolean} True if critical
   */
  isCriticalError(errorInfo) {
    // Define what constitutes a critical error
    const criticalPatterns = [
      /Cannot read prop/i,
      /undefined is not/i,
      /Network error/i,
      /Failed to fetch/i,
    ];

    const message = errorInfo.message || '';
    return criticalPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Show error notification to user
   * @param {Object} errorInfo - Error information
   */
  showErrorNotification(errorInfo) {
    // Don't show multiple notifications
    if (document.querySelector('.error-notification')) {
      return;
    }

    const notification = document.createElement('div');
    notification.className = 'error-notification fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-md';
    notification.innerHTML = `
      <div class="flex items-start">
        <svg class="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div class="flex-1">
          <p class="font-semibold">Something went wrong</p>
          <p class="text-sm mt-1">We're having trouble loading this page. Please try refreshing.</p>
        </div>
        <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      notification.remove();
    }, 10000);
  }

  /**
   * Report error to external service
   * @param {Object} errorInfo - Error information
   */
  async reportError(errorInfo) {
    // Placeholder for error reporting service
    // In production, integrate with Sentry, LogRocket, etc.
    try {
      // Example: Send to error tracking endpoint
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorInfo),
      // });
    } catch (e) {
      // Silently fail - don't want error reporting to cause more errors
    }
  }

  /**
   * Register a callback for errors
   * @param {Function} callback - Callback function
   * @returns {Function} Unregister function
   */
  onError(callback) {
    this.errorCallbacks.push(callback);
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get recent errors
   * @param {number} count - Number of errors to return
   * @returns {Array} Recent errors
   */
  getRecentErrors(count = 10) {
    return this.errors.slice(-count);
  }

  /**
   * Clear stored errors
   */
  clearErrors() {
    this.errors = [];
    log.info('Error history cleared');
  }

  /**
   * Wrap a function with error handling
   * @param {Function} fn - Function to wrap
   * @param {string} context - Context for logging
   * @returns {Function} Wrapped function
   */
  wrap(fn, context = 'Unknown') {
    return (...args) => {
      try {
        const result = fn(...args);
        
        // Handle async functions
        if (result instanceof Promise) {
          return result.catch(error => {
            this.handleError({
              message: error.message,
              error,
              context,
              type: 'wrapped-async',
            });
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        this.handleError({
          message: error.message,
          error,
          context,
          type: 'wrapped-sync',
        });
        throw error;
      }
    };
  }
}

// Create and export singleton instance
export const errorHandler = new ErrorHandler();

// Export for testing
export default ErrorHandler;