import api from '../../services/api';

/**
 * storeService — all Axios calls for the store module.
 */

// Seller: create their store / Become a Seller
const createStore = async (storeData) => {
  const response = await api.post('/stores', storeData);
  return response.data.data; // { store, user }
};

// Seller: get their own store
const getMyStore = async () => {
  const response = await api.get('/stores/my');
  return response.data.data; // { store }
};

// Seller: update their own store
const updateMyStore = async (storeData) => {
  const response = await api.put('/stores/my', storeData);
  return response.data.data; // { store }
};

// Public: get store by slug
const getStoreBySlug = async (slug) => {
  const response = await api.get(`/stores/public/${slug}`);
  return response.data.data; // { store }
};

// Admin: get all stores
const getAllStores = async ({ status = '', page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (status) params.append('status', status);
  const response = await api.get(`/stores?${params}`);
  return response.data.data; // { stores, pagination }
};

// Admin: update store status (general)
const updateStoreStatus = async ({ id, status, rejectionReason }) => {
  const response = await api.put(`/stores/${id}/status`, { status, rejectionReason });
  return response.data.data; // { store }
};

// Admin: approve store
const approveStore = async (id) => {
  const response = await api.patch(`/stores/${id}/approve`);
  return response.data.data; // { store }
};

// Admin: reject store with reason
const rejectStore = async ({ id, rejectionReason }) => {
  const response = await api.patch(`/stores/${id}/reject`, { rejectionReason });
  return response.data.data; // { store }
};

// Admin: suspend store
const suspendStore = async (id) => {
  const response = await api.patch(`/stores/${id}/suspend`);
  return response.data.data; // { store }
};

// Admin: reactivate store
const reactivateStore = async (id) => {
  const response = await api.patch(`/stores/${id}/reactivate`);
  return response.data.data; // { store }
};

// Admin: get single store by id
const getStoreById = async (id) => {
  const response = await api.get(`/stores/admin/${id}`);
  return response.data.data; // { store }
};

const storeService = {
  createStore,
  getMyStore,
  updateMyStore,
  getStoreBySlug,
  getAllStores,
  updateStoreStatus,
  approveStore,
  rejectStore,
  suspendStore,
  reactivateStore,
  getStoreById,
};

export default storeService;
