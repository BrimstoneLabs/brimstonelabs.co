/**
 * Utility Functions
 * Common utilities and helper functions
 */

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 250) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Safe querySelector with error handling
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element (default: document)
 * @returns {Element|null} Found element or null
 */
export function $(selector, parent = document) {
  try {
    return parent.querySelector(selector);
  } catch (error) {
    console.error(`Invalid selector: ${selector}`, error);
    return null;
  }
}

/**
 * Safe querySelectorAll with error handling
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element (default: document)
 * @returns {NodeList|Array} Found elements or empty array
 */
export function $$(selector, parent = document) {
  try {
    return Array.from(parent.querySelectorAll(selector));
  } catch (error) {
    console.error(`Invalid selector: ${selector}`, error);
    return [];
  }
}

/**
 * Add event listener with automatic cleanup
 * @param {Element} element - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 * @returns {Function} Cleanup function
 */
export function on(element, event, handler, options = {}) {
  if (!element || !event || !handler) return () => {};
  
  element.addEventListener(event, handler, options);
  
  // Return cleanup function
  return () => element.removeEventListener(event, handler, options);
}

/**
 * Create element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Element attributes
 * @param {Array} children - Child elements or text
 * @returns {Element} Created element
 */
export function createElement(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Add children
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Element) {
      element.appendChild(child);
    }
  });
  
  return element;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} progress - Progress (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

/**
 * Check if element is in viewport
 * @param {Element} element - Element to check
 * @param {number} offset - Offset in pixels
 * @returns {boolean} True if element is in viewport
 */
export function isInViewport(element, offset = 0) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= -offset &&
    rect.left >= -offset &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
  );
}

/**
 * Load script dynamically
 * @param {string} src - Script source URL
 * @param {Object} options - Script options
 * @returns {Promise} Promise that resolves when script loads
 */
export function loadScript(src, options = {}) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = options.async !== false;
    script.defer = options.defer === true;
    
    if (options.integrity) {
      script.integrity = options.integrity;
      script.crossOrigin = 'anonymous';
    }
    
    script.onload = resolve;
    script.onerror = reject;
    
    (options.parent || document.head).appendChild(script);
  });
}

/**
 * Wait for a condition to be true
 * @param {Function} condition - Condition function
 * @param {number} timeout - Maximum wait time in ms
 * @param {number} interval - Check interval in ms
 * @returns {Promise} Promise that resolves when condition is true
 */
export function waitFor(condition, timeout = 5000, interval = 100) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, interval);
      }
    };
    
    check();
  });
}

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Generate unique ID
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
export function uniqueId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}