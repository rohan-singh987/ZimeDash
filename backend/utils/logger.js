/**
 * Simple logging utility for the application
 * Provides different log levels and formatted output
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Get current timestamp in ISO format
 * @returns {string} - Formatted timestamp
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Format log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {string} - Formatted log message
 */
const formatMessage = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level}: ${message}${metaStr}`;
};

/**
 * Log error message
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or metadata
 */
const error = (message, error = {}) => {
  const meta = error instanceof Error ? { 
    error: error.message, 
    stack: error.stack 
  } : error;
  console.error(formatMessage(LOG_LEVELS.ERROR, message, meta));
};

/**
 * Log warning message
 * @param {string} message - Warning message
 * @param {Object} meta - Additional metadata
 */
const warn = (message, meta = {}) => {
  console.warn(formatMessage(LOG_LEVELS.WARN, message, meta));
};

/**
 * Log info message
 * @param {string} message - Info message
 * @param {Object} meta - Additional metadata
 */
const info = (message, meta = {}) => {
  console.log(formatMessage(LOG_LEVELS.INFO, message, meta));
};

/**
 * Log debug message (only in development)
 * @param {string} message - Debug message
 * @param {Object} meta - Additional metadata
 */
const debug = (message, meta = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(formatMessage(LOG_LEVELS.DEBUG, message, meta));
  }
};

/**
 * Log API request details
 * @param {Object} req - Express request object
 * @param {number} statusCode - Response status code
 * @param {number} responseTime - Response time in ms
 */
const logRequest = (req, statusCode, responseTime) => {
  const meta = {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };
  
  info(`${req.method} ${req.originalUrl}`, meta);
};

export {
  error,
  warn,
  info,
  debug,
  logRequest
}; 