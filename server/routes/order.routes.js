const express = require('express');
const {
  getMyOrders,
  getOrderById,
  cancelBuyerOrder,
  getAdminOrders,
} = require('../controllers/order.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken); // All order endpoints require authentication

router.get('/my-orders', getMyOrders);
router.get('/admin/all', requireRole('admin'), getAdminOrders);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelBuyerOrder);

module.exports = router;
