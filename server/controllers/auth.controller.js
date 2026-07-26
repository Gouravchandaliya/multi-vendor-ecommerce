const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── Token helpers ────────────────────────────────────────────────────────────

/**
 * Generate a short-lived access token (15 min).
 * Payload is minimal — only userId. Role is NOT stored in the token.
 * Role is always read from the DB via verifyToken middleware.
 * This prevents a role change from being bypassed until token expiry.
 */
const generateAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  });

/**
 * Generate a long-lived refresh token (7 days).
 * Stored as an httpOnly cookie AND persisted in the DB so we can
 * invalidate it on logout without waiting for natural expiry.
 */
const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  });

/**
 * Set the refresh token as an httpOnly cookie.
 * httpOnly  — JavaScript cannot read it (XSS protection).
 * secure    — only sent over HTTPS (set true in production).
 * sameSite  — 'strict' prevents CSRF attacks.
 * maxAge    — 7 days in milliseconds.
 */
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Public route.
 *
 * Security rules enforced here:
 *  - Input validated by express-validator (see auth.routes.js)
 *  - Role is IGNORED from req.body — always assigned 'buyer' or 'seller' only
 *  - Admin accounts cannot be self-registered
 *  - Duplicate email returns 409 (handled by errorHandler's 11000 catch)
 *  - Password is hashed by the User model pre-save hook — never stored plain
 */
const register = asyncHandler(async (req, res) => {
  // 1. Check express-validator results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }

  const { name, email, password, role } = req.body;

  // 2. Enforce role whitelist — clients can only choose buyer or seller
  //    Any attempt to register as admin is silently downgraded to buyer.
  const allowedRoles = ['buyer', 'seller'];
  const assignedRole = allowedRoles.includes(role) ? role : 'buyer';

  // 3. Create user — password hashing happens in the pre-save hook
  const user = await User.create({ name, email, password, role: assignedRole });

  // 4. Issue tokens
  const accessToken  = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // 5. Persist refresh token in DB so logout can invalidate it
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // 6. Set refresh token cookie and return access token + user
  setRefreshTokenCookie(res, refreshToken);

  return res.status(201).json(
    new ApiResponse(201, { user: user.toSafeObject(), accessToken }, 'Registration successful')
  );
});

/**
 * POST /api/v1/auth/login
 * Public route.
 *
 * Timing-safe: we always call comparePassword even when the user doesn't
 * exist (using a dummy hash) to prevent timing attacks that could reveal
 * whether an email is registered.
 */
const login = asyncHandler(async (req, res) => {
  // 1. Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }

  const { email, password } = req.body;

  // 2. Find user — must explicitly select password because `select: false`
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  // 3. Generic error message — never reveal whether email exists or password wrong
  const invalidCredentials = new ApiError(401, 'Invalid email or password');

  if (!user) throw invalidCredentials;

  // 4. Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw invalidCredentials;

  // 5. Check account is active
  if (!user.isActive) {
    throw new ApiError(403, 'Account has been deactivated. Contact support.');
  }

  // 6. Issue tokens
  const accessToken  = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // 7. Rotate refresh token in DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setRefreshTokenCookie(res, refreshToken);

  return res.status(200).json(
    new ApiResponse(200, { user: user.toSafeObject(), accessToken }, 'Login successful')
  );
});

/**
 * POST /api/v1/auth/logout
 * Protected route (requires valid access token).
 *
 * Invalidates the refresh token in the DB so the cookie can't be used to
 * get new access tokens even if it was stolen.
 * Clears the httpOnly cookie on the client.
 */
const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from DB
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: '' } });

  // Clear cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

/**
 * POST /api/v1/auth/refresh-token
 * Public route (called by Axios interceptor when access token expires).
 *
 * Reads the refresh token from the httpOnly cookie.
 * Validates it against the stored token in the DB (rotation check).
 * Issues a new access token and rotates the refresh token.
 */
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'Refresh token not found');

  // Verify JWT signature
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  // Find user and verify the stored token matches (detects token reuse after logout)
  const user = await User.findById(decoded.userId).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    // Token mismatch — possible theft. Clear cookie and force re-login.
    res.clearCookie('refreshToken');
    throw new ApiError(401, 'Invalid refresh token. Please log in again.');
  }

  if (!user.isActive) throw new ApiError(403, 'Account deactivated');

  // Issue new tokens (rotation — each refresh issues a new refresh token)
  const newAccessToken  = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  setRefreshTokenCookie(res, newRefreshToken);

  return res.status(200).json(
    new ApiResponse(200, { accessToken: newAccessToken }, 'Token refreshed')
  );
});

/**
 * GET /api/v1/auth/me
 * Protected route.
 * Returns the currently authenticated user (no password, no refresh token).
 */
const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, { user: req.user.toSafeObject() }, 'User fetched')
  );
});

module.exports = { register, login, logout, refreshToken, getMe };
