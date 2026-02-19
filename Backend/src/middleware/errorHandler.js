/**
 * Global Error Handler Middleware
 * Catches and formats all errors in a consistent manner
 */

/**
 * Global error handling middleware
 * Must be the last middleware in the app
 */
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Default error status and message
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(e => e.message);
  }

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  }

  if (err.code === 11000) {
    status = 409;
    message = 'Duplicate entry';
  }

  // Send error response
  res.status(status).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
