const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * verifyToken — authentication middleware.
 *
 * Reads the access token from the Authorization header (Bearer scheme).
 * Verifies the JWT signature and expiry.
 * Fetches the user from DB to ensure the account still exists and is active.
 * Attaches `req.user` for downstream middleware and controllers.
 *
 * We always hit the DB here rather than trusting the token payload alone.
 * This ensures a deleted or deactivated account is rejected immediately
 * without waiting for the token to expire.
 */
const verifyToken = asyncHandler(async (req, res, next) => {
  // 1. Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Access token required');
  }

  const token = authHeader.split(' ')[1];

  // 2. Verify signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    // Let the global error handler map JsonWebTokenError / TokenExpiredError
    throw err;
  }

  // 3. Confirm user still exists and is active
  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new ApiError(401, 'User no longer exists');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Account has been deactivated');
  }

  // 4. Attach user to request for controllers to use
  req.user = user;
  next();
});

/**
 * requireRole — authorization middleware factory.
 *
 * Usage: router.delete('/:id', verifyToken, requireRole('admin'), handler)
 *
 * Always placed AFTER verifyToken because it depends on req.user.
 * Role is read from the database record (via req.user) — never from the
 * request body or token payload. This prevents privilege escalation.
 */
const requireRole = (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Access denied. Required role: ${roles.join(' or ')}`)
      );
    }
    next();
  };

module.exports = { verifyToken, requireRole };
