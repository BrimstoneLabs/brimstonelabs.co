/**
 * Theme Management Module (Refactored)
 * Handles dark/light mode switching with improved error handling
 */

import { config } from './config.js';
import { $, on } from './utils.js';
import { logger } from './logger.js';

const log = logger.child('Theme');

export class ThemeManager {
  constructor() {
    this.elements = {
      toggle: null,
      moonIcon: null,
      sunIcon: null,
      html: document.documentElement,
    };
    
    this.currentTheme = config.theme.default;
    this.storageKey = config.theme.storageKey;
    this.initialized = false;
    
    this.init();
  }
  
  /**
   * Initialize theme manager
   */
  init() {
    try {
      // Get DOM elements
      this.elements.toggle = $('#theme-toggle');
      this.elements.moonIcon = $('#moon-icon');
      this.elements.sunIcon = $('#sun-icon');
      
      if (!this.elements.toggle) {
        log.warn('Theme toggle button not found');
        return;
      }
      
      // Load saved theme or use default
      const savedTheme = this.loadTheme();
      this.setTheme(savedTheme);
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set ARIA attributes
      this.updateAccessibility();
      
      this.initialized = true;
      log.info('Theme manager initialized', { theme: this.currentTheme });
      
    } catch (error) {
      log.error('Failed to initialize theme manager', error);
    }
  }
  
  /**
   * Load theme from localStorage
   * @returns {string} Saved theme or default
   */
  loadTheme() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved && ['light', 'dark'].includes(saved) ? saved : config.theme.default;
    } catch (error) {
      log.warn('Failed to load theme from localStorage', error);
      return config.theme.default;
    }
  }
  
  /**
   * Save theme to localStorage
   * @param {string} theme - Theme to save
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (error) {
      log.warn('Failed to save theme to localStorage', error);
    }
  }
  
  /**
   * Set theme with proper error handling
   * @param {string} theme - Theme to set ('light' or 'dark')
   */
  setTheme(theme) {
    if (!['light', 'dark'].includes(theme)) {
      log.error(`Invalid theme: ${theme}`);
      return;
    }
    
    const timer = log.timer('Theme switch');
    
    try {
      // Update DOM
      if (theme === 'light') {
        this.elements.html.classList.add('light');
        this.elements.moonIcon?.classList.add('hidden');
        this.elements.sunIcon?.classList.remove('hidden');
      } else {
        this.elements.html.classList.remove('light');
        this.elements.moonIcon?.classList.remove('hidden');
        this.elements.sunIcon?.classList.add('hidden');
      }
      
      // Save theme
      this.currentTheme = theme;
      this.saveTheme(theme);
      
      // Update accessibility
      this.updateAccessibility();
      
      // Dispatch custom event
      this.dispatchThemeChange(theme);
      
      timer.end();
      
    } catch (error) {
      log.error('Failed to set theme', error);
    }
  }
  
  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }
  
  /**
   * Get current theme
   * @returns {string} Current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
  
  /**
   * Update ARIA attributes for accessibility
   */
  updateAccessibility() {
    if (this.elements.toggle) {
      this.elements.toggle.setAttribute('aria-label', `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} mode`);
      this.elements.toggle.setAttribute('aria-pressed', String(this.currentTheme === 'light'));
    }
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    if (this.elements.toggle) {
      on(this.elements.toggle, 'click', () => this.toggleTheme());
    }
    
    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', (e) => {
          if (!this.loadTheme()) {
            // Only auto-switch if user hasn't set a preference
            this.setTheme(e.matches ? 'dark' : 'light');
          }
        });
      }
    }
  }
  
  /**
   * Dispatch custom theme change event
   * @param {string} theme - New theme
   */
  dispatchThemeChange(theme) {
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme },
      bubbles: true,
    }));
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Remove event listeners if needed
    this.initialized = false;
    log.info('Theme manager destroyed');
  }
}