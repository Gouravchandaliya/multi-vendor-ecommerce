import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import {
  fetchMyStore,
  selectMyStore,
  selectMyStoreLoaded,
  selectStoreLoading,
} from '../../features/store/storeSlice';
import {
  fetchSellerMetrics,
  selectSellerMetricsData,
} from '../../features/seller/sellerOrderSlice';
import { selectUser } from '../../features/auth/authSlice';
import StatusBadge from '../../components/common/StatusBadge';
import { PageSpinner } from '../../components/common/Spinner';
import SellerSidebar from '../../components/layout/SellerSidebar';

const SellerDashboard = () => {
  const dispatch  = useDispatch();
  const user      = useSelector(selectUser);
  const myStore   = useSelector(selectMyStore);
  const isLoaded  = useSelector(selectMyStoreLoaded);
  const isLoading = useSelector(selectStoreLoading);

  const metrics   = useSelector(selectSellerMetricsData);

  useEffect(() => {
    dispatch(fetchMyStore());
    dispatch(fetchSellerMetrics());
  }, [dispatch]);

  if (!isLoaded || isLoading) return <PageSpinner />;

  // Calculate store profile completeness
  const calculateCompleteness = (store) => {
    if (!store) return 0;
    let score = 0;
    if (store.name) score += 20;
    if (store.description) score += 20;
    if (store.businessEmail) score += 15;
    if (store.businessPhone) score += 15;
    if (store.address && store.city) score += 20;
    if (store.logo || store.banner) score += 10;
    return score;
  };

  const completeness = calculateCompleteness(myStore);
  const isApproved   = myStore?.status === 'approved';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SellerSidebar isApproved={isApproved} />

      <main className="flex-1 p-8 space-y-6 max-w-6xl">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user?.name}</p>
          </div>
          {myStore && (
            <div className="flex items-center gap-3">
              <StatusBadge status={myStore.status} />
              <Link
                to="/seller/store-settings"
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-700 rounded-xl transition"
              >
                Store Settings ⚙️
              </Link>
            </div>
          )}
        </div>

        {!myStore ? (
          /* No Application / Apply CTA */
          <div className="bg-white rounded-2xl border border-blue-100 p-8 shadow-sm text-center space-y-4">
            <span className="text-4xl">🏪</span>
            <h2 className="text-xl font-bold text-gray-900">Start Selling on MarketX</h2>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              You haven't submitted a seller application yet. Set up your store profile to begin.
            </p>
            <Link
              to="/become-seller"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow transition"
            >
              Apply to Become a Seller &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Status Alert Banner */}
            {myStore.status === 'pending' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 flex items-start gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <h3 className="font-bold text-sm">Seller Application Pending Approval</h3>
                  <p className="text-xs text-amber-800 mt-1">
                    Your store application is under review by our team. Product creation will be unlocked upon approval.
                  </p>
                </div>
              </div>
            )}

            {myStore.status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-green-900 flex items-start gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="font-bold text-sm">Store Active & Approved</h3>
                  <p className="text-xs text-green-800 mt-1">
                    Your store is verified. Manage your product listings and fulfill incoming customer orders.
                  </p>
                </div>
              </div>
            )}

            {myStore.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-900 flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <h3 className="font-bold text-sm">Seller Application Rejected</h3>
                  <p className="text-xs text-red-800 mt-1">
                    Reason: <span className="font-semibold">{myStore.rejectionReason || 'Verification requirements not met.'}</span>
                  </p>
                  <Link to="/seller/store-settings" className="text-xs text-red-700 underline font-bold mt-2 inline-block">
                    Update store information & re-apply &rarr;
                  </Link>
                </div>
              </div>
            )}

            {myStore.status === 'suspended' && (
              <div className="bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-bold text-sm">Selling Privileges Suspended</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Your store privileges have been temporarily suspended by site management. Please contact support.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Action Navigation */}
            {isApproved && (
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/seller/orders"
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
                >
                  <span>📦 Manage Orders</span>
                  <span className="bg-blue-800 px-2 py-0.5 rounded text-[10px]">
                    {metrics?.pendingOrders || 0} Pending
                  </span>
                </Link>
                <Link
                  to="/seller/products"
                  className="px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  <span>🏷️ Manage Products</span>
                </Link>
              </div>
            )}

            {/* Live Real Statistic Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Seller Orders</span>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics?.totalOrders || 0}</p>
                <span className="text-[11px] text-blue-600 mt-1 block font-semibold">Store Orders</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pending / Processing</span>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {(metrics?.pendingOrders || 0) + (metrics?.processingOrders || 0)}
                </p>
                <span className="text-[11px] text-gray-400 mt-1 block">Needs fulfillment</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Shipped / Delivered</span>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {(metrics?.shippedOrders || 0) + (metrics?.deliveredOrders || 0)}
                </p>
                <span className="text-[11px] text-gray-400 mt-1 block">Completed / In transit</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Seller Sales</span>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${(metrics?.sellerSales || 0).toFixed(2)}
                </p>
                <span className="text-[11px] text-gray-400 mt-1 block">Gross store revenue</span>
              </div>
            </div>

            {/* Profile Completeness Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-sm font-bold text-gray-800">
                <span>Store Profile Completeness</span>
                <span>{completeness}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default SellerDashboard;
