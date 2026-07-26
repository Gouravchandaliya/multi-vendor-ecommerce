const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, refreshToken, getMe } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ─── Validation rules ─────────────────────────────────────────────────────────
// Defined here alongside the routes so it's easy to see what each endpoint expects.
// express-validator checks happen inside each controller (validationResult).

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  body('role')
    .optional()
    .isIn(['buyer', 'seller']).withMessage('Role must be buyer or seller'),
    // Note: even if 'admin' is submitted here it's ignored in the controller
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ─── Routes ──────────────────────────────────────────────────────────────────

// Public routes
router.post('/register',      registerValidation, register);
router.post('/login',         loginValidation,    login);
router.post('/refresh-token',                     refreshToken);

// Protected routes
router.post('/logout', verifyToken, logout);
router.get('/me',      verifyToken, getMe);

module.exports = router;
