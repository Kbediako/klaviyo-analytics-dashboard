/**
 * Logger utility for consistent logging across the application
 */
export class Logger {
  /**
   * Log an informational message
   * @param message Message to log
   * @param meta Additional metadata
   */
  info(message: string, meta?: any): void {
    this.log('INFO', message, meta);
  }
  
  /**
   * Log a warning message
   * @param message Message to log
   * @param meta Additional metadata
   */
  warn(message: string, meta?: any): void {
    this.log('WARN', message, meta);
  }
  
  /**
   * Log an error message
   * @param message Message to log
   * @param error Error object or additional metadata
   */
  error(message: string, error?: any): void {
    this.log('ERROR', message, error);
  }
  
  /**
   * Log a debug message
   * @param message Message to log
   * @param meta Additional metadata
   */
  debug(message: string, meta?: any): void {
    // Only log debug messages in development
    if (process.env.NODE_ENV !== 'production') {
      this.log('DEBUG', message, meta);
    }
  }
  
  /**
   * Format and log a message
   * @param level Log level
   * @param message Message to log
   * @param meta Additional metadata
   */
  private log(level: string, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;
    
    switch (level) {
      case 'ERROR':
        console.error(formattedMessage);
        if (meta) {
          if (meta instanceof Error) {
            console.error(`[${timestamp}] [${level}] Error details:`, {
              name: meta.name,
              message: meta.message,
              stack: meta.stack
            });
          } else {
            console.error(`[${timestamp}] [${level}] Additional info:`, meta);
          }
        }
        break;
      case 'WARN':
        console.warn(formattedMessage);
        if (meta) console.warn(`[${timestamp}] [${level}] Additional info:`, meta);
        break;
      case 'DEBUG':
        console.debug(formattedMessage);
        if (meta) console.debug(`[${timestamp}] [${level}] Additional info:`, meta);
        break;
      default:
        console.log(formattedMessage);
        if (meta) console.log(`[${timestamp}] [${level}] Additional info:`, meta);
    }
  }
}

// Create a singleton instance
export const logger = new Logger();

export default logger;
