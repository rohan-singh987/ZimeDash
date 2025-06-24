// Development error handler
import * as logger from '../utils/logger.js';

const developmentErrorHandler = (err, req, res, next) => {
  const error = {
    success: false,
    message: err.message,
    stack: err.stack,
    error: err
  };
  
  logger.error('Development Error', err);
  
  res.status(err.statusCode || 500).json(error);
};

// Production error handler - sanitized errors
const productionErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  logger.error('Production Error', err);
  
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    error = { message, statusCode: 400 };
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = { message, statusCode: 400 };
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(error => error.message).join(', ');
    error = { message, statusCode: 400 };
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }
  
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  logger.error('API Error', {
    error: err.message,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id
  });
  
  if (process.env.NODE_ENV === 'development') {
    developmentErrorHandler(error, req, res, next);
  } else {
    productionErrorHandler(error, req, res, next);
  }
};

// Handle async errors in route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Handle 404 errors for unmatched routes
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  next(error);
};

export {
  errorHandler,
  asyncHandler,
  notFound
}; 