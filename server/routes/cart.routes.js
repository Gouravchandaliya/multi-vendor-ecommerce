const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  mergeGuestCart,
} = require('../controllers/cart.controller');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken); // All cart routes require authentication

router.get('/', getCart);
router.post('/items', addToCart);
router.patch('/items/:productId', updateCartItemQuantity);
router.delete('/items/:productId', removeCartItem);
router.delete('/', clearCart);
router.post('/merge', mergeGuestCart);

module.exports = router;
