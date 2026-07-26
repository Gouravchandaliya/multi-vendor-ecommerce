/**
 * Wraps an async route handler and forwards any rejected promise
 * to Express's next(err) instead of crashing the process.
 *
 * Without this, every controller needs its own try/catch.
 * With this, controllers stay clean and all errors flow to
 * the centralized errorHandler middleware.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
