const ApiError = require('../utils/ApiError');

/**
 * Global error-handling middleware.
 * Must be registered LAST in server.js (after all routes).
 * Express recognises it as an error handler because it has 4 parameters (err, req, res, next).
 *
 * Handles three categories:
 *  1. Our own ApiError instances  — use their statusCode + message directly
 *  2. Mongoose validation errors  — extract field messages, return 400
 *  3. Mongoose duplicate key (11000) — return a readable 409 conflict message
 *  4. JWT errors                  — return 401 (wired in Phase 2)
 *  5. Everything else             — return 500, hide internals in production
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Mongoose validation error (e.g. required field missing)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors (wired in Phase 2)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    // Only expose stack trace in development — never in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
