const express = require('express');
const { getAdminAnalytics } = require('../controllers/adminAnalytics.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Strict backend authorization enforcement: Requires valid token and admin role
router.use(verifyToken, requireRole('admin'));

router.get('/', getAdminAnalytics);

module.exports = router;
