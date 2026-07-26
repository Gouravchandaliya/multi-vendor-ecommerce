const express = require('express');
const { body } = require('express-validator');
const {
  createStore,
  getMyStore,
  updateMyStore,
  getPublicStores,
  getStoreBySlug,
  getPublicStoreProducts,
  getAllStores,
  getStoreById,
  updateStoreStatus,
  approveStore,
  rejectStore,
  suspendStore,
  reactivateStore,
} = require('../controllers/store.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation Rules
const createStoreValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Store name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('businessEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid business email'),
  body('businessPhone')
    .optional()
    .trim(),
];

const updateStoreValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
];

// ─── Public routes ────────────────────────────────────────────────────────────
router.get('/public', getPublicStores);
router.get('/public/:slug', getStoreBySlug);
router.get('/public/:slug/products', getPublicStoreProducts);

// ─── Seller routes ────────────────────────────────────────────────────────────
router.post('/',
  verifyToken, requireRole('buyer', 'seller'),
  createStoreValidation,
  createStore
);

router.get('/my',
  verifyToken, requireRole('seller'),
  getMyStore
);

router.put('/my',
  verifyToken, requireRole('seller'),
  updateStoreValidation,
  updateMyStore
);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get('/',
  verifyToken, requireRole('admin'),
  getAllStores
);

router.get('/admin/:id',
  verifyToken, requireRole('admin'),
  getStoreById
);

router.put('/:id/status',
  verifyToken, requireRole('admin'),
  updateStoreStatus
);

router.patch('/:id/approve',
  verifyToken, requireRole('admin'),
  approveStore
);

router.patch('/:id/reject',
  verifyToken, requireRole('admin'),
  rejectStore
);

router.patch('/:id/suspend',
  verifyToken, requireRole('admin'),
  suspendStore
);

router.patch('/:id/reactivate',
  verifyToken, requireRole('admin'),
  reactivateStore
);

module.exports = router;
