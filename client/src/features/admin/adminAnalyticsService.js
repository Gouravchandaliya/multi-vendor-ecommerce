import api from '../../services/api';

const getAdminAnalytics = async (range = '30d') => {
  const response = await api.get(`/admin/analytics?range=${range}`);
  return response.data.data;
};

const getUsers = async ({ role = '', search = '', page = 1, limit = 10 } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (role) params.append('role', role);
  if (search) params.append('search', search);
  const response = await api.get(`/admin/users?${params}`);
  return response.data.data;
};

const toggleUserStatus = async (userId) => {
  const response = await api.patch(`/admin/users/${userId}/toggle-status`);
  return response.data.data;
};

const adminAnalyticsService = {
  getAdminAnalytics,
  getUsers,
  toggleUserStatus,
};

export default adminAnalyticsService;
