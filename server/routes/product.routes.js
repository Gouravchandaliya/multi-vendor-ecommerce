const express = require('express');
const { body } = require('express-validator');
const {
  createProduct,
  getSellerProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getPublicProducts,
  getPublicProductBySlug,
  getRelatedProducts,
} = require('../controllers/product.controller');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Validation Rules
const productValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
  body('brand')
    .trim()
    .notEmpty().withMessage('Brand is required'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('discountPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Discount price must be a non-negative number'),
  body('stock')
    .notEmpty().withMessage('Stock quantity is required')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get('/public', getPublicProducts);
router.get('/public/:slug', getPublicProductBySlug);
router.get('/public/:slug/related', getRelatedProducts);

// ─── Seller Routes ────────────────────────────────────────────────────────────
router.get('/seller',
  verifyToken, requireRole('seller'),
  getSellerProducts
);

router.get('/:id',
  verifyToken, requireRole('seller', 'admin'),
  getProductById
);

router.post('/',
  verifyToken, requireRole('seller'),
  upload.array('images', 5),
  productValidation,
  createProduct
);

router.put('/:id',
  verifyToken, requireRole('seller'),
  upload.array('images', 5),
  updateProduct
);

router.delete('/:id',
  verifyToken, requireRole('seller'),
  deleteProduct
);

module.exports = router;
