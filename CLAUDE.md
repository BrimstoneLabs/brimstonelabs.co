# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### CSS Build Commands
- **Development (with watch)**: `npm run dev` or `npm run build-css` - Watches for changes to `src/input.css` and rebuilds Tailwind CSS output
- **Production build**: `npm run build` - Builds minified CSS for production

### JavaScript Module Bundling
The application uses ES6 modules that need to be bundled before deployment:
- Source modules are in `src/js/` (main.js, globe.js, animations.js, theme.js)
- The bundled output should be placed at `dist/app.js`
- The HTML references the bundled file at `./dist/app.js`

Note: There is currently no automated JavaScript bundling command in package.json. Consider using a bundler like esbuild, webpack, or vite for this purpose.

## Architecture Overview

### Frontend Stack
- **Tailwind CSS**: Utility-first CSS framework configured via `tailwind.config.js`
- **GSAP**: Animation library for scroll-triggered animations and text effects
- **Three.js**: 3D graphics library for the interactive globe visualization
- **SplitType**: Text splitting library for character-based animations

### JavaScript Module Structure
The application follows a modular ES6 architecture with four main modules:

1. **main.js**: Application entry point that coordinates all modules
   - Initializes ThemeManager, AnimationManager, and GlobeManager
   - Handles loading overlay, smooth scrolling, mobile menu
   - Adds accessibility improvements

2. **globe.js**: Three.js globe with animated connections
   - Creates 3D sphere with particle system
   - Animates dynamic connection chains between points
   - Includes performance optimizations for mobile devices
   - Respects user's reduced motion preferences

3. **animations.js**: GSAP scroll-triggered animations
   - Text reveal animations using SplitType
   - Section and paragraph fade-in effects
   - Feature card staggered animations
   - Respects reduced motion preferences

4. **theme.js**: Dark/light mode management
   - Persists theme preference in localStorage
   - Updates UI icons and ARIA attributes
   - Defaults to dark mode

### Key Implementation Details
- All modules export ES6 classes for clean instantiation
- Modules check for `prefers-reduced-motion` and provide fallbacks
- The globe module includes extensive Three.js resource cleanup in `destroy()` methods
- Mobile-specific optimizations reduce particle counts and disable certain effects
- Accessibility features include ARIA labels, skip links, and keyboard navigation support

### CSS Architecture
- Custom Tailwind configuration extends default theme with:
  - Additional breakpoints up to 5xl (2560px)
  - Custom colors: primary (purple), secondary (cyan), background
  - Custom font family: 'Funnel Display'
- Input CSS at `src/input.css` compiles to `dist/output.css`