import api from '../../services/api';

const getSellerOrders = async ({ status = 'all', search = '', page = 1, limit = 10 } = {}) => {
  const response = await api.get(`/seller/orders?status=${status}&search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`);
  return response.data.data; // { orders, pagination }
};

const getSellerOrderById = async (orderId) => {
  const response = await api.get(`/seller/orders/${orderId}`);
  return response.data.data.order;
};

const updateSellerOrderStatus = async ({ orderId, status, productId }) => {
  const response = await api.patch(`/seller/orders/${orderId}/status`, { status, productId });
  return response.data.data.order;
};

const getSellerMetrics = async () => {
  const response = await api.get('/seller/orders/metrics');
  return response.data.data;
};

const sellerOrderService = {
  getSellerOrders,
  getSellerOrderById,
  updateSellerOrderStatus,
  getSellerMetrics,
};

export default sellerOrderService;
