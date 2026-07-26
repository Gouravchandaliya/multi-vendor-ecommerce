import api from '../../services/api';

/**
 * authService — all Axios calls related to authentication.
 * These are plain async functions (not thunks).
 * The slice's createAsyncThunk calls these and handles loading/error state.
 */

const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data.data; // { user, accessToken }
};

const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data.data; // { user, accessToken }
};

const logout = async () => {
  await api.post('/auth/logout');
};

const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data.data; // { user }
};

const refreshToken = async () => {
  const response = await api.post('/auth/refresh-token');
  return response.data.data; // { accessToken }
};

const authService = { register, login, logout, getMe, refreshToken };
export default authService;
