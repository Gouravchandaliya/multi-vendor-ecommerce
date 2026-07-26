import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router';
import { logoutUser, selectUser } from '../../features/auth/authSlice';

const BuyerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user     = useSelector(selectUser);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Welcome Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Buyer Account Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition"
            >
              Sign out
            </button>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            
            <Link
              to="/account/orders"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-5 shadow transition flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">📦</span>
                <span className="text-xs font-bold bg-blue-800 text-blue-100 px-2 py-0.5 rounded">
                  View &rarr;
                </span>
              </div>
              <div className="mt-4">
                <h2 className="text-base font-bold">My Orders</h2>
                <p className="text-xs text-blue-100 mt-0.5">Track & manage orders</p>
              </div>
            </Link>

            <Link
              to="/account/reviews"
              className="bg-white hover:border-gray-300 border border-gray-200 text-gray-900 rounded-xl p-5 shadow-sm transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">⭐</span>
                <span className="text-xs font-bold text-blue-600">Reviews</span>
              </div>
              <div className="mt-4">
                <h2 className="text-base font-bold text-gray-900">My Reviews</h2>
                <p className="text-xs text-gray-500 mt-0.5">Edit submitted reviews</p>
              </div>
            </Link>

            <Link
              to="/wishlist"
              className="bg-white hover:border-gray-300 border border-gray-200 text-gray-900 rounded-xl p-5 shadow-sm transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">🤍</span>
                <span className="text-xs font-bold text-blue-600">Favorites</span>
              </div>
              <div className="mt-4">
                <h2 className="text-base font-bold text-gray-900">Wishlist</h2>
                <p className="text-xs text-gray-500 mt-0.5">Your saved items</p>
              </div>
            </Link>

            <Link
              to="/cart"
              className="bg-white hover:border-gray-300 border border-gray-200 text-gray-900 rounded-xl p-5 shadow-sm transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">🛒</span>
                <span className="text-xs font-bold text-blue-600">Cart</span>
              </div>
              <div className="mt-4">
                <h2 className="text-base font-bold text-gray-900">Shopping Cart</h2>
                <p className="text-xs text-gray-500 mt-0.5">Ready for order</p>
              </div>
            </Link>

          </div>

          {/* User Account Details */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              Account Details
            </h2>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <dt className="text-gray-500 font-medium">Name</dt>
                <dd className="font-bold text-gray-900 mt-0.5">{user?.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Email</dt>
                <dd className="font-bold text-gray-900 mt-0.5 truncate">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Account Role</dt>
                <dd className="mt-0.5">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold uppercase">
                    {user?.role}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Member Since</dt>
                <dd className="font-bold text-gray-900 mt-0.5">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Become a Seller Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-blue-900">
                  Want to sell on MarketX?
                </h2>
                <p className="text-xs text-blue-700 mt-1">
                  Apply as a seller and create your store in seconds. Start listing products once approved!
                </p>
              </div>
              <Link
                to="/become-seller"
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition whitespace-nowrap"
              >
                Become a Seller &rarr;
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default BuyerDashboard;
