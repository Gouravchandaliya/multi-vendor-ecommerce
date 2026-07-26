const express = require('express');
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require('../controllers/payment.controller');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken); // All payment endpoints require authentication

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);

module.exports = router;
