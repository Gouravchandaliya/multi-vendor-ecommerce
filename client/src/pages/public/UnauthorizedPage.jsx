import { Link, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../../features/auth/authSlice';

const getRoleHome = (role) => {
  switch (role) {
    case 'admin':  return '/admin/dashboard';
    case 'seller': return '/seller/dashboard';
    default:       return '/buyer/dashboard';
  }
};

const UnauthorizedPage = () => {
  const userRole = useSelector(selectUserRole);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">
          You don&apos;t have permission to view this page.
        </p>
        <Link
          to={userRole ? getRoleHome(userRole) : '/login'}
          className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg
            hover:bg-blue-700 transition text-sm"
        >
          {userRole ? 'Go to your dashboard' : 'Sign in'}
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
