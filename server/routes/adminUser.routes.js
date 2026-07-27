const express = require('express');
const { getAllUsers, toggleUserStatus } = require('../controllers/adminUser.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Strict backend authorization enforcement: Requires valid token and admin role
router.use(verifyToken, requireRole('admin'));

router.get('/', getAllUsers);
router.patch('/:userId/toggle-status', toggleUserStatus);

module.exports = router;
