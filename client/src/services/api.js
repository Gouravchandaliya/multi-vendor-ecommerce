import axios from 'axios';

/**
 * Centralised Axios instance.
 * withCredentials: true sends the httpOnly refresh-token cookie on every request.
 *
 * The store is injected after creation via `setStore()` to break the
 * circular dependency:  store.js → authSlice → api.js → store.js
 * main.jsx calls setStore(store) immediately after creating the store.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Injected after store creation in main.jsx
let _store = null;
export const setStore = (store) => { _store = store; };

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = _store?.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop if the failed request IS an auth route itself
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/refresh-token') ||
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/logout');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute && _store) {
      originalRequest._retry = true;

      try {
        // Inline import avoids circular reference at build time
        const { refreshAccessToken, clearAuth } = await import('../features/auth/authSlice');
        const result = await _store.dispatch(refreshAccessToken());

        if (refreshAccessToken.fulfilled.match(result)) {
          const newToken = _store.getState().auth.accessToken;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }

        _store.dispatch(clearAuth());
      } catch {
        // Fall through on error
      }
    }

    return Promise.reject(error);
  }
);

export default api;
