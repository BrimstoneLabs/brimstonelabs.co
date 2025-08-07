/**
 * Theme management module
 * Handles dark/light mode switching with localStorage persistence
 */

export class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.moonIcon = document.getElementById('moon-icon');
        this.sunIcon = document.getElementById('sun-icon');
        this.html = document.documentElement;
        
        this.init();
    }
    
    init() {
        // Check for saved theme preference or default to dark
        const currentTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(currentTheme);
        
        // Add event listener for theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
            
            // Add ARIA attributes for accessibility
            this.themeToggle.setAttribute('aria-label', 'Toggle theme');
            this.themeToggle.setAttribute('aria-pressed', currentTheme === 'light');
        }
    }
    
    setTheme(theme) {
        if (theme === 'light') {
            this.html.classList.add('light');
            this.moonIcon?.classList.add('hidden');
            this.sunIcon?.classList.remove('hidden');
        } else {
            this.html.classList.remove('light');
            this.moonIcon?.classList.remove('hidden');
            this.sunIcon?.classList.add('hidden');
        }
        
        localStorage.setItem('theme', theme);
        
        // Update ARIA attribute
        if (this.themeToggle) {
            this.themeToggle.setAttribute('aria-pressed', theme === 'light');
        }
    }
    
    toggleTheme() {
        const currentTheme = this.html.classList.contains('light') ? 'light' : 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
    
    getCurrentTheme() {
        return this.html.classList.contains('light') ? 'light' : 'dark';
    }
}