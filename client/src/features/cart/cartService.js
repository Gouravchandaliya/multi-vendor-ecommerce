import api from '../../services/api';

const getCart = async () => {
  const response = await api.get('/cart');
  return response.data.data.cart;
};

const addToCart = async ({ productId, quantity = 1 }) => {
  const response = await api.post('/cart/items', { productId, quantity });
  return response.data.data.cart;
};

const updateCartItemQuantity = async ({ productId, quantity }) => {
  const response = await api.patch(`/cart/items/${productId}`, { quantity });
  return response.data.data.cart;
};

const removeCartItem = async (productId) => {
  const response = await api.delete(`/cart/items/${productId}`);
  return response.data.data.cart;
};

const clearCart = async () => {
  const response = await api.delete('/cart');
  return response.data.data.cart;
};

const mergeGuestCart = async (guestItems) => {
  const response = await api.post('/cart/merge', { guestItems });
  return response.data.data.cart;
};

const cartService = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  mergeGuestCart,
};

export default cartService;
