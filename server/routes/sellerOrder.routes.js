const express = require('express');
const {
  getSellerOrders,
  getSellerOrderById,
  updateSellerOrderStatus,
  getSellerMetrics,
} = require('../controllers/sellerOrder.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, requireRole('seller', 'admin')); // Seller routes require authenticated seller/admin identity

router.get('/', getSellerOrders);
router.get('/metrics', getSellerMetrics);
router.get('/:orderId', getSellerOrderById);
router.patch('/:orderId/status', updateSellerOrderStatus);

module.exports = router;
