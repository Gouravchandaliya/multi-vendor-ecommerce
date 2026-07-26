import { Navigate, Outlet } from 'react-router';
import { useSelector } from 'react-redux';
import { selectUserRole, selectIsLoggedIn } from '../features/auth/authSlice';

/**
 * RoleRoute — blocks authenticated users who don't have the required role.
 *
 * Always placed inside a PrivateRoute so we know the user is logged in.
 * Reads the role from Redux state (which was set from the DB record) —
 * never from anything the client can forge.
 *
 * Usage in AppRouter:
 *   <Route element={<PrivateRoute />}>
 *     <Route element={<RoleRoute roles={['seller']} />}>
 *       <Route path="/seller/dashboard" element={<SellerDashboard />} />
 *     </Route>
 *   </Route>
 */
const RoleRoute = ({ roles = [] }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const userRole   = useSelector(selectUserRole);

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  if (!roles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
