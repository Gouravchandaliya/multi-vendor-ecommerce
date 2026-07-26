const express = require('express');
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getMyReviews,
  getSellerProductReviews,
  getAdminReviews,
} = require('../controllers/review.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews);

// Authenticated buyer routes
router.use(verifyToken);
router.post('/product/:productId', createReview);
router.get('/my-reviews', getMyReviews);
router.patch('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);

// Seller & Admin routes
router.get('/seller/my-store', requireRole('seller', 'admin'), getSellerProductReviews);
router.get('/admin/all', requireRole('admin'), getAdminReviews);

module.exports = router;
