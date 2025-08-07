/**
 * Logger Module
 * Centralized logging with different levels and environments
 */

import { config } from './config.js';

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

const logLevelMap = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  none: LogLevel.NONE,
};

class Logger {
  constructor(name = 'App') {
    this.name = name;
    this.level = logLevelMap[config.dev.logLevel] || LogLevel.ERROR;
    this.enabled = config.dev.debug;
  }

  /**
   * Format log message with timestamp and context
   * @private
   */
  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.name}]`;
    return [prefix, message, ...args];
  }

  /**
   * Check if logging is enabled for level
   * @private
   */
  shouldLog(level) {
    return this.enabled && level >= this.level;
  }

  /**
   * Log debug message
   */
  debug(message, ...args) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(...this.formatMessage('DEBUG', message, ...args));
    }
  }

  /**
   * Log info message
   */
  info(message, ...args) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(...this.formatMessage('INFO', message, ...args));
    }
  }

  /**
   * Log warning message
   */
  warn(message, ...args) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(...this.formatMessage('WARN', message, ...args));
    }
  }

  /**
   * Log error message
   */
  error(message, ...args) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(...this.formatMessage('ERROR', message, ...args));
      
      // In production, could send to error tracking service
      if (!config.dev.debug) {
        this.reportError(message, args);
      }
    }
  }

  /**
   * Log performance metrics
   */
  performance(label, startTime) {
    const duration = performance.now() - startTime;
    this.debug(`Performance: ${label} took ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Create a timer for performance measurement
   */
  timer(label) {
    const startTime = performance.now();
    return {
      end: () => this.performance(label, startTime),
    };
  }

  /**
   * Group related logs
   */
  group(label, collapsed = false) {
    if (this.enabled) {
      if (collapsed) {
        console.groupCollapsed(label);
      } else {
        console.group(label);
      }
    }
  }

  /**
   * End log group
   */
  groupEnd() {
    if (this.enabled) {
      console.groupEnd();
    }
  }

  /**
   * Report error to external service (placeholder)
   * @private
   */
  reportError(message, args) {
    // In production, integrate with error tracking service
    // e.g., Sentry, LogRocket, etc.
    const errorData = {
      message,
      args,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
    
    // Placeholder for error reporting
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData),
    // }).catch(() => {});
  }

  /**
   * Create a child logger with a specific context
   */
  child(name) {
    return new Logger(`${this.name}:${name}`);
  }
}

// Create and export default logger instance
export const logger = new Logger('BrimstoneLabs');

// Export Logger class for creating custom instances
export default Logger;