import api from '../../services/api';

const getWishlist = async () => {
  const response = await api.get('/wishlist');
  return response.data.data.wishlist;
};

const addToWishlist = async (productId) => {
  const response = await api.post(`/wishlist/${productId}`);
  return response.data.data.wishlist;
};

const removeFromWishlist = async (productId) => {
  const response = await api.delete(`/wishlist/${productId}`);
  return response.data.data.wishlist;
};

const moveToCart = async (productId) => {
  const response = await api.post(`/wishlist/${productId}/move-to-cart`);
  return response.data.data; // { wishlist }
};

const wishlistService = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
};

export default wishlistService;
