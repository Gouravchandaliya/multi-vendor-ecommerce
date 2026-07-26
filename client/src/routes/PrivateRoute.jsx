import { Navigate, Outlet, useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn, selectInitialized } from '../features/auth/authSlice';

/**
 * PrivateRoute — blocks unauthenticated users.
 *
 * Waits for the auth initialization check (GET /auth/me on app load) before
 * deciding to redirect. Without this, a page refresh would always redirect
 * to login because the Redux state is empty before the check completes.
 *
 * Saves the attempted URL in location.state so LoginPage can redirect back
 * after a successful login.
 */
const PrivateRoute = () => {
  const isLoggedIn   = useSelector(selectIsLoggedIn);
  const initialized  = useSelector(selectInitialized);
  const location     = useLocation();

  // Still checking session — show nothing (or a spinner) to avoid flash
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
