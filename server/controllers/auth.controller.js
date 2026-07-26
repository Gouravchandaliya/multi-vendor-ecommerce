const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─────────────────────────────────────────────────────────────────────────────
// Environment / Cookie Helpers
// ─────────────────────────────────────────────────────────────────────────────

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Common refresh-token cookie options.
 *
 * Development:
 *   secure: false
 *   sameSite: lax
 *
 * Production:
 *   secure: true
 *   sameSite: none
 *
 * Production needs SameSite=None because:
 * Frontend -> Vercel
 * Backend  -> Render
 *
 * They are different sites.
 */
const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

/**
 * Options used when deleting the refresh-token cookie.
 *
 * Keep path, secure and sameSite consistent with the cookie
 * that was originally created.
 */
const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
});

// ─────────────────────────────────────────────────────────────────────────────
// Token Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate short-lived access token.
 *
 * Access token is returned to frontend and kept in Redux memory.
 */
const generateAccessToken = (userId) =>
  jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    }
  );

/**
 * Generate long-lived refresh token.
 *
 * Refresh token is:
 * 1. Stored in MongoDB
 * 2. Stored in browser as httpOnly cookie
 */
const generateRefreshToken = (userId) =>
  jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    }
  );

/**
 * Set refresh token cookie.
 */
const setRefreshTokenCookie = (res, token) => {
  res.cookie(
    'refreshToken',
    token,
    getRefreshCookieOptions()
  );
};

/**
 * Clear refresh token cookie.
 */
const clearRefreshTokenCookie = (res) => {
  res.clearCookie(
    'refreshToken',
    getClearCookieOptions()
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// POST /api/v1/auth/register
// ─────────────────────────────────────────────────────────────────────────────

const register = asyncHandler(async (req, res) => {

  // Validate request body
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ApiError(
      400,
      'Validation failed',
      errors.array()
    );
  }

  const {
    name,
    email,
    password,
    role,
  } = req.body;

  // Users cannot create admin accounts themselves.
  const allowedRoles = ['buyer', 'seller'];

  const assignedRole = allowedRoles.includes(role)
    ? role
    : 'buyer';

  // Password hashing should happen in User model pre-save hook.
  const user = await User.create({
    name,
    email,
    password,
    role: assignedRole,
  });

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token in database
  user.refreshToken = refreshToken;

  await user.save({
    validateBeforeSave: false,
  });

  // Store refresh token in httpOnly browser cookie
  setRefreshTokenCookie(res, refreshToken);

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: user.toSafeObject(),
        accessToken,
      },
      'Registration successful'
    )
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────────────────────

const login = asyncHandler(async (req, res) => {

  // Validate login request
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ApiError(
      400,
      'Validation failed',
      errors.array()
    );
  }

  const {
    email,
    password,
  } = req.body;

  // Password has select:false in schema,
  // therefore explicitly request it.
  const user = await User
    .findOne({
      email: email.toLowerCase(),
    })
    .select('+password');

  const invalidCredentials = new ApiError(
    401,
    'Invalid email or password'
  );

  if (!user) {
    throw invalidCredentials;
  }

  // Compare entered password with hashed password.
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw invalidCredentials;
  }

  // Prevent disabled accounts from logging in.
  if (!user.isActive) {
    throw new ApiError(
      403,
      'Account has been deactivated. Contact support.'
    );
  }

  // Generate new tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Rotate stored refresh token
  user.refreshToken = refreshToken;

  await user.save({
    validateBeforeSave: false,
  });

  // IMPORTANT:
  // Production cookie will now be:
  //
  // HttpOnly = true
  // Secure   = true
  // SameSite = None
  // Path     = /
  //
  setRefreshTokenCookie(res, refreshToken);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: user.toSafeObject(),
        accessToken,
      },
      'Login successful'
    )
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// POST /api/v1/auth/logout
// ─────────────────────────────────────────────────────────────────────────────

const logout = asyncHandler(async (req, res) => {

  // Remove stored refresh token from MongoDB.
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: '',
      },
    }
  );

  // Delete refresh-token cookie from browser.
  clearRefreshTokenCookie(res);

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      'Logged out successfully'
    )
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// REFRESH ACCESS TOKEN
// POST /api/v1/auth/refresh-token
// ─────────────────────────────────────────────────────────────────────────────

const refreshToken = asyncHandler(async (req, res) => {

  // Read httpOnly refresh-token cookie.
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new ApiError(
      401,
      'Refresh token not found'
    );
  }

  // Verify refresh token JWT.
  let decoded;

  try {

    decoded = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET
    );

  } catch (error) {

    clearRefreshTokenCookie(res);

    throw new ApiError(
      401,
      'Invalid or expired refresh token'
    );
  }

  // Find corresponding user.
  //
  // refreshToken is select:false,
  // therefore explicitly request it.
  const user = await User
    .findById(decoded.userId)
    .select('+refreshToken');

  // Check token against the token stored in MongoDB.
  if (!user || user.refreshToken !== token) {

    clearRefreshTokenCookie(res);

    throw new ApiError(
      401,
      'Invalid refresh token. Please log in again.'
    );
  }

  // Check account status.
  if (!user.isActive) {

    clearRefreshTokenCookie(res);

    throw new ApiError(
      403,
      'Account deactivated'
    );
  }

  // Generate new tokens.
  //
  // Refresh-token rotation:
  // every refresh creates a new refresh token.
  const newAccessToken =
    generateAccessToken(user._id);

  const newRefreshToken =
    generateRefreshToken(user._id);

  // Replace old refresh token in MongoDB.
  user.refreshToken = newRefreshToken;

  await user.save({
    validateBeforeSave: false,
  });

  // Replace old browser cookie.
  setRefreshTokenCookie(
    res,
    newRefreshToken
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken: newAccessToken,
      },
      'Token refreshed'
    )
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET CURRENT USER
// GET /api/v1/auth/me
// ─────────────────────────────────────────────────────────────────────────────

const getMe = asyncHandler(async (req, res) => {

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: req.user.toSafeObject(),
      },
      'User fetched'
    )
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
};