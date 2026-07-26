/**
 * Custom operational error class.
 * Thrown deliberately throughout the app (validation failures, 404s, auth errors).
 * Distinguished from programmer errors (bugs) by the `isOperational` flag,
 * which tells the global error handler whether to expose the message to the client.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;       // field-level validation errors array
    this.isOperational = true;  // marks this as a known, handled error
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
