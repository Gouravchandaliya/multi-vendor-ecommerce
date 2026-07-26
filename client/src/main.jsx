import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './app/store';
import { setStore } from './services/api';
import AppRouter from './routes/AppRouter';
import { refreshAccessToken, fetchCurrentUser } from './features/auth/authSlice';
import './index.css';

// Inject store into Axios so interceptors can read/dispatch without circular imports
setStore(store);

/**
 * Silent session restore on every page load/refresh.
 * 1. POST /auth/refresh-token  — httpOnly cookie sent automatically
 *    Success → new accessToken in state
 *    Failure → initialized = true, user = null (PrivateRoute → /login)
 * 2. GET /auth/me — populates user in state, sets initialized = true
 */
const initializeAuth = async () => {
  const result = await store.dispatch(refreshAccessToken());
  if (refreshAccessToken.fulfilled.match(result)) {
    await store.dispatch(fetchCurrentUser());
  }
};

initializeAuth();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <AppRouter />
    </Provider>
  </StrictMode>
);
