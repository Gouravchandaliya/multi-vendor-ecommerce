const express = require('express');
const { generateProductContent } = require('../controllers/sellerAi.controller');
const { verifyToken, requireRole } = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');

const router = express.Router();

// Protected: Requires valid token, seller/admin role, and rate limiting
router.use(verifyToken, requireRole('seller', 'admin'));

router.post('/generate-product-content', aiRateLimiter, generateProductContent);

module.exports = router;
