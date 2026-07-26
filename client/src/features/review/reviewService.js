import api from '../../services/api';

const createReview = async ({ productId, rating, comment }) => {
  const response = await api.post(`/reviews/product/${productId}`, { rating, comment });
  return response.data.data.review;
};

const getProductReviews = async ({ productId, page = 1, limit = 5, sort = 'recent' }) => {
  const response = await api.get(`/reviews/product/${productId}?page=${page}&limit=${limit}&sort=${sort}`);
  return response.data.data; // { reviews, ratingsAverage, ratingsCount, breakdown, pagination }
};

const updateReview = async ({ reviewId, rating, comment }) => {
  const response = await api.patch(`/reviews/${reviewId}`, { rating, comment });
  return response.data.data.review;
};

const deleteReview = async (reviewId) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
};

const getMyReviews = async ({ page = 1, limit = 10 } = {}) => {
  const response = await api.get(`/reviews/my-reviews?page=${page}&limit=${limit}`);
  return response.data.data; // { reviews, pagination }
};

const getSellerReviews = async ({ page = 1, limit = 10 } = {}) => {
  const response = await api.get(`/reviews/seller/my-store?page=${page}&limit=${limit}`);
  return response.data.data; // { reviews, pagination }
};

const getAdminReviews = async ({ page = 1, limit = 10, search = '' } = {}) => {
  const response = await api.get(`/reviews/admin/all?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  return response.data.data; // { reviews, pagination }
};

const reviewService = {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getMyReviews,
  getSellerReviews,
  getAdminReviews,
};

export default reviewService;
