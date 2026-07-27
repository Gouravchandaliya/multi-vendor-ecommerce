import api from '../../services/api';

const getSellerAnalytics = async (range = '30d') => {
  const response = await api.get(`/seller/orders/analytics?range=${range}`);
  return response.data.data;
};

const sellerAnalyticsService = {
  getSellerAnalytics,
};

export default sellerAnalyticsService;
