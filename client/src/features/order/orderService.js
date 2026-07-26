import api from '../../services/api';

const createRazorpayOrder = async () => {
  const response = await api.post('/payments/create-order');
  return response.data.data; // { razorpayOrderId, amount, currency, keyId, orderNumber, totalAmount }
};

const verifyRazorpayPayment = async (paymentData) => {
  const response = await api.post('/payments/verify', paymentData);
  return response.data.data.order;
};

const getMyOrders = async ({ page = 1, limit = 10 } = {}) => {
  const response = await api.get(`/orders/my-orders?page=${page}&limit=${limit}`);
  return response.data.data; // { orders, pagination }
};

const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data.data.order;
};

const orderService = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyOrders,
  getOrderById,
};

export default orderService;
