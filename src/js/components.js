/**
 * Components Module
 * Reusable UI components for semantic HTML generation
 */

import { logger } from './logger.js';
import { config } from './config.js';

const log = logger.child('Components');

/**
 * Component base class
 */
class Component {
  constructor(props = {}) {
    this.props = props;
    this.children = props.children || [];
  }

  /**
   * Render component to HTML string
   * @returns {string} HTML string
   */
  render() {
    throw new Error('Component must implement render method');
  }

  /**
   * Mount component to DOM element
   * @param {HTMLElement|string} target - Target element or selector
   */
  mount(target) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) {
      log.error('Mount target not found', target);
      return;
    }
    
    element.innerHTML = this.render();
    this.afterMount(element);
  }

  /**
   * Called after component is mounted
   * @param {HTMLElement} element - Mounted element
   */
  afterMount(element) {
    // Override in subclasses for post-mount logic
  }
}

/**
 * Navigation component
 */
export class Navigation extends Component {
  render() {
    const { links = [], logo, brandName } = this.props;
    
    return `
      <nav class="navigation max-w-7xl xl:max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8" 
           style="max-width: min(1600px, 100%)"
           role="navigation"
           aria-label="Main navigation">
        <div class="flex justify-between items-center h-16">
          ${this.renderLogo(logo, brandName)}
          ${this.renderDesktopMenu(links)}
          ${this.renderMobileMenuButton()}
        </div>
        ${this.renderMobileMenu(links)}
      </nav>
    `;
  }

  renderLogo(logo, brandName) {
    return `
      <a href="#top" class="flex items-center gap-2" aria-label="Home">
        ${logo || ''}
        ${brandName ? `<div class="text-xl font-heading font-light text-white">${brandName}</div>` : ''}
      </a>
    `;
  }

  renderDesktopMenu(links) {
    const linkItems = links.map(link => `
      <li>
        <a href="${link.href}" 
           class="text-gray-300 hover:text-orange-400 transition-colors duration-200"
           ${link.ariaCurrent ? 'aria-current="page"' : ''}>
          ${link.text}
        </a>
      </li>
    `).join('');

    return `
      <div class="flex items-center space-x-6">
        <ul class="hidden md:flex space-x-8" role="list">
          ${linkItems}
        </ul>
        ${this.renderThemeToggle()}
      </div>
    `;
  }

  renderThemeToggle() {
    return `
      <button id="theme-toggle" 
              class="p-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 hover:text-orange-400 hover:border-orange-500 transition-colors duration-200"
              aria-label="Toggle theme"
              aria-pressed="false">
        <!-- Moon icon (dark mode) -->
        <svg id="moon-icon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
        </svg>
        <!-- Sun icon (light mode) -->
        <svg id="sun-icon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
      </button>
    `;
  }

  renderMobileMenuButton() {
    return `
      <button class="md:hidden p-2 rounded-lg bg-gray-800/50 border border-gray-700"
              aria-label="Open menu"
              aria-expanded="false"
              aria-controls="mobile-menu">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
    `;
  }

  renderMobileMenu(links) {
    const linkItems = links.map(link => `
      <a href="${link.href}" 
         class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">
        ${link.text}
      </a>
    `).join('');

    return `
      <div id="mobile-menu" class="hidden md:hidden">
        <div class="px-2 pt-2 pb-3 space-y-1">
          ${linkItems}
        </div>
      </div>
    `;
  }
}

/**
 * Hero Section component
 */
export class HeroSection extends Component {
  render() {
    const { title, subtitle, description, showGlobe = true } = this.props;
    
    return `
      <section class="hero-section relative min-h-screen flex items-center justify-center overflow-hidden" 
               role="region" 
               aria-labelledby="hero-title">
        ${showGlobe ? '<div id="globe-container" class="globe-container" aria-hidden="true"></div>' : ''}
        
        <div class="container mx-auto px-6 relative z-10">
          <article class="text-center max-w-5xl mx-auto">
            ${title ? `<h1 id="hero-title" class="reveal-type text-5xl md:text-7xl font-heading font-light mb-6 text-white">${title}</h1>` : ''}
            ${subtitle ? `<h2 class="reveal-type text-3xl md:text-5xl font-heading font-light mb-8">${subtitle}</h2>` : ''}
            ${description ? `<p class="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto">${description}</p>` : ''}
          </article>
        </div>
      </section>
    `;
  }
}

/**
 * Feature Card component
 */
export class FeatureCard extends Component {
  render() {
    const { title, description, icon, link } = this.props;
    const isClickable = !!link;
    
    const cardContent = `
      ${icon ? `<div class="text-4xl mb-4" aria-hidden="true">${icon}</div>` : ''}
      ${title ? `<h3 class="text-xl font-heading font-semibold mb-3">${title}</h3>` : ''}
      ${description ? `<p class="text-gray-300">${description}</p>` : ''}
    `;

    if (isClickable) {
      return `
        <a href="${link}" 
           class="feature-card feature-card-base block p-8 rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-orange-500 hover:bg-gray-800/70 transition-all duration-300 group">
          ${cardContent}
        </a>
      `;
    }

    return `
      <article class="feature-card feature-card-base p-8 rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700">
        ${cardContent}
      </article>
    `;
  }
}

/**
 * Section component
 */
export class Section extends Component {
  render() {
    const { id, title, subtitle, children, className = '' } = this.props;
    
    return `
      <section ${id ? `id="${id}"` : ''} 
               class="py-20 px-6 ${className}"
               ${title ? `aria-labelledby="${id}-title"` : ''}
               role="region">
        <div class="container mx-auto max-w-6xl">
          ${title ? `
            <header class="text-center mb-16">
              <h2 id="${id}-title" class="reveal-type text-4xl md:text-5xl font-heading font-light mb-4">${title}</h2>
              ${subtitle ? `<p class="text-xl text-gray-300">${subtitle}</p>` : ''}
            </header>
          ` : ''}
          ${children || ''}
        </div>
      </section>
    `;
  }
}

/**
 * Footer component
 */
export class Footer extends Component {
  render() {
    const { links = [], copyright, social = [] } = this.props;
    
    return `
      <footer class="bg-gray-900 border-t border-gray-800 py-12 px-6" role="contentinfo">
        <div class="container mx-auto max-w-6xl">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            ${this.renderLinks(links)}
            ${this.renderSocial(social)}
          </div>
          ${copyright ? `
            <div class="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
              <p>&copy; ${copyright}</p>
            </div>
          ` : ''}
        </div>
      </footer>
    `;
  }

  renderLinks(links) {
    if (!links.length) return '';
    
    const linkItems = links.map(link => `
      <li>
        <a href="${link.href}" 
           class="text-gray-400 hover:text-orange-400 transition-colors">
          ${link.text}
        </a>
      </li>
    `).join('');

    return `
      <nav aria-label="Footer navigation">
        <ul class="space-y-2" role="list">
          ${linkItems}
        </ul>
      </nav>
    `;
  }

  renderSocial(social) {
    if (!social.length) return '';
    
    const socialItems = social.map(item => `
      <a href="${item.href}" 
         class="text-gray-400 hover:text-orange-400 transition-colors"
         aria-label="${item.label}"
         rel="noopener noreferrer"
         target="_blank">
        ${item.icon}
      </a>
    `).join('');

    return `
      <div class="flex space-x-6" role="group" aria-label="Social media links">
        ${socialItems}
      </div>
    `;
  }
}

/**
 * Loading Overlay component
 */
export class LoadingOverlay extends Component {
  render() {
    return `
      <div class="loading-overlay" role="status" aria-live="polite" aria-label="Loading">
        <div class="loading-dots">
          <div class="loading-dot" aria-hidden="true"></div>
          <div class="loading-dot" aria-hidden="true"></div>
          <div class="loading-dot" aria-hidden="true"></div>
        </div>
        <span class="sr-only">Loading...</span>
      </div>
    `;
  }
}

/**
 * Skip Link component for accessibility
 */
export class SkipLink extends Component {
  render() {
    const { target = '#main-content', text = 'Skip to main content' } = this.props;
    
    return `
      <a href="${target}" 
         class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-gray-800 text-white px-4 py-2 rounded z-50">
        ${text}
      </a>
    `;
  }
}

/**
 * Component registry for dynamic component creation
 */
export const componentRegistry = {
  Navigation,
  HeroSection,
  FeatureCard,
  Section,
  Footer,
  LoadingOverlay,
  SkipLink,
};

/**
 * Create component instance from type and props
 * @param {string} type - Component type
 * @param {Object} props - Component properties
 * @returns {Component} Component instance
 */
export function createComponent(type, props) {
  const ComponentClass = componentRegistry[type];
  
  if (!ComponentClass) {
    log.error(`Unknown component type: ${type}`);
    return null;
  }
  
  return new ComponentClass(props);
}

/**
 * Render components to container
 * @param {Array} components - Array of component configs
 * @param {HTMLElement|string} container - Container element or selector
 */
export function renderComponents(components, container) {
  const containerEl = typeof container === 'string' ? document.querySelector(container) : container;
  
  if (!containerEl) {
    log.error('Container not found', container);
    return;
  }
  
  const html = components.map(({ type, props }) => {
    const component = createComponent(type, props);
    return component ? component.render() : '';
  }).join('');
  
  containerEl.innerHTML = html;
  
  log.info(`Rendered ${components.length} components`);
}