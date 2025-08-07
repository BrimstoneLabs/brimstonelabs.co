/**
 * Performance monitoring and optimization module
 * Tracks Core Web Vitals and adapts site behavior for optimal performance
 */

export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: [],
            memory: null,
            connectionType: null,
            deviceType: null
        };
        
        this.isLowPerformance = false;
        this.callbacks = new Set();
        
        this.init();
    }
    
    init() {
        // Detect device capabilities
        this.detectDeviceCapabilities();
        
        // Monitor FPS if supported
        this.startFPSMonitoring();
        
        // Monitor Core Web Vitals
        this.monitorCoreWebVitals();
        
        // Check performance every 5 seconds
        setInterval(() => this.checkPerformance(), 5000);
    }
    
    detectDeviceCapabilities() {
        // Device memory (in GB)
        this.metrics.memory = navigator.deviceMemory || 4;
        
        // Connection type
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            this.metrics.connectionType = connection.effectiveType;
        }
        
        // Device type based on various factors
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isLowMemory = this.metrics.memory < 4;
        const isSlow = this.metrics.connectionType === 'slow-2g' || this.metrics.connectionType === '2g';
        const cores = navigator.hardwareConcurrency || 4;
        
        this.metrics.deviceType = {
            mobile: isMobile,
            lowMemory: isLowMemory,
            slowConnection: isSlow,
            lowCores: cores < 4
        };
        
        // Initial performance assessment
        this.isLowPerformance = isMobile || isLowMemory || isSlow || cores < 4;
    }
    
    startFPSMonitoring() {
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frames * 1000) / (currentTime - lastTime));
                this.metrics.fps.push(fps);
                
                // Keep only last 10 measurements
                if (this.metrics.fps.length > 10) {
                    this.metrics.fps.shift();
                }
                
                frames = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    monitorCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                // LCP observer not supported
            }
            
            // First Input Delay (FID)
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        console.log('FID:', entry.processingStart - entry.startTime);
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                // FID observer not supported
            }
            
            // Cumulative Layout Shift (CLS)
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                            console.log('CLS:', clsValue);
                        }
                    });
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                // CLS observer not supported
            }
        }
    }
    
    checkPerformance() {
        // Calculate average FPS
        if (this.metrics.fps.length > 0) {
            const avgFPS = this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length;
            
            // If FPS drops below 30, enable low performance mode
            if (avgFPS < 30 && !this.isLowPerformance) {
                this.enableLowPerformanceMode();
            } else if (avgFPS > 50 && this.isLowPerformance && !this.metrics.deviceType.mobile) {
                // Re-enable features if performance improves (not on mobile)
                this.disableLowPerformanceMode();
            }
        }
    }
    
    enableLowPerformanceMode() {
        if (this.isLowPerformance) return;
        
        this.isLowPerformance = true;
        console.log('Enabling low performance mode');
        
        // Notify all registered callbacks
        this.callbacks.forEach(callback => callback(true));
        
        // Add CSS class for styling adjustments
        document.body.classList.add('low-performance');
    }
    
    disableLowPerformanceMode() {
        if (!this.isLowPerformance) return;
        
        this.isLowPerformance = false;
        console.log('Disabling low performance mode');
        
        // Notify all registered callbacks
        this.callbacks.forEach(callback => callback(false));
        
        // Remove CSS class
        document.body.classList.remove('low-performance');
    }
    
    onPerformanceChange(callback) {
        this.callbacks.add(callback);
        // Immediately call with current state
        callback(this.isLowPerformance);
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            isLowPerformance: this.isLowPerformance,
            averageFPS: this.metrics.fps.length > 0 
                ? this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length 
                : null
        };
    }
}