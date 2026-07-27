import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import {
  fetchAdminAnalytics,
  setAdminRange,
  selectAdminAnalyticsData,
  selectAdminAnalyticsRange,
  selectAdminAnalyticsLoading,
  selectAdminAnalyticsError,
} from '../../features/admin/adminAnalyticsSlice';
import { selectUser } from '../../features/auth/authSlice';
import { PageSpinner } from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import RevenueChart from '../../components/common/RevenueChart';
import OrderStatusDonut from '../../components/common/OrderStatusDonut';

const RANGES = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '1 Year', value: '1y' },
];

const AdminDashboard = () => {
  const dispatch  = useDispatch();
  const user      = useSelector(selectUser);

  const analytics    = useSelector(selectAdminAnalyticsData);
  const currentRange = useSelector(selectAdminAnalyticsRange);
  const isLoading    = useSelector(selectAdminAnalyticsLoading);
  const error        = useSelector(selectAdminAnalyticsError);

  useEffect(() => {
    dispatch(fetchAdminAnalytics(currentRange));
  }, [dispatch, currentRange]);

  const overview = analytics?.overview || {};

  const handleRangeChange = (newRange) => {
    dispatch(setAdminRange(newRange));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Control Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Admin Platform Control Center</h1>
            <p className="text-gray-500 text-xs mt-0.5">Marketplace-wide analytics and system administration</p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => handleRangeChange(r.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  currentRange === r.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <Alert type="error" message={error} />

        {/* 8 Real Marketplace KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-xl">💰</span>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gross Revenue</p>
            <p className="text-lg font-extrabold text-gray-900">${(overview.totalRevenue || 0).toFixed(2)}</p>
            <span className="text-[9px] font-semibold text-green-600">Paid marketplace orders</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-xl">📦</span>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
            <p className="text-lg font-extrabold text-gray-900">{overview.totalOrders || 0}</p>
            <span className="text-[9px] font-semibold text-gray-400">All vendors</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-xl">👥</span>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
            <p className="text-lg font-extrabold text-gray-900">{overview.totalUsers || 0}</p>
            <span className="text-[9px] font-semibold text-blue-600">{overview.totalBuyers || 0} buyers</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-xl">🏢</span>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Sellers</p>
            <p className="text-lg font-extrabold text-gray-900">{overview.totalSellers || 0}</p>
            <span className="text-[9px] font-semibold text-purple-600">{overview.approvedStores || 0} approved stores</span>
          </div>

          <Link
            to="/admin/manage-stores?status=pending"
            className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-sm hover:shadow transition group space-y-1"
          >
            <span className="text-xl">⏳</span>
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Pending Stores</p>
            <p className="text-lg font-extrabold text-amber-900">{overview.pendingStores || 0}</p>
            <span className="text-[9px] font-bold text-amber-700 underline group-hover:text-amber-900">Review &rarr;</span>
          </Link>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-xl">🏪</span>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Stores</p>
            <p className="text-lg font-extrabold text-gray-900">{overview.totalStores || 0}</p>
            <span className="text-[9px] font-semibold text-gray-400">{overview.rejectedStores || 0} rejected</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-xl">🏷️</span>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Products</p>
            <p className="text-lg font-extrabold text-gray-900">{overview.totalProducts || 0}</p>
            <span className="text-[9px] font-semibold text-green-600">{overview.activeProducts || 0} active</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-xl">⚠️</span>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Low Stock</p>
            <p className="text-lg font-extrabold text-red-600">{overview.lowStockCount || 0}</p>
            <span className="text-[9px] font-semibold text-red-600">{overview.outOfStockCount || 0} out of stock</span>
          </div>

        </div>

        {/* Quick Action Admin Links */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Quick Navigation:</span>
          <Link to="/admin/manage-stores" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition">
            🏢 Store Approvals
          </Link>
          <Link to="/admin/users" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow transition">
            👥 User Directory
          </Link>
          <Link to="/admin/orders" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition">
            📦 Marketplace Orders
          </Link>
          <Link to="/admin/reviews" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition">
            ⭐ Review Moderation
          </Link>
        </div>

        {/* Revenue Overview Trend Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">📈 Marketplace Revenue Overview</h2>
            <span className="text-xs text-gray-500 font-semibold">Range: {currentRange}</span>
          </div>

          {isLoading ? (
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <RevenueChart trendData={analytics?.revenueTrend || []} />
          )}
        </div>

        {/* Middle Grid: Order Fulfillment Status & Top Stores/Sellers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Order Status Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
              📊 Order Fulfillment Distribution
            </h2>
            <OrderStatusDonut breakdown={analytics?.orderStatusBreakdown || []} />
          </div>

          {/* Top 5 Stores / Sellers */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">🏆 Top Performing Stores</h2>
              <Link to="/admin/manage-stores" className="text-xs font-bold text-blue-600 hover:text-blue-800">
                View All Stores &rarr;
              </Link>
            </div>

            {(!analytics?.topSellers || analytics.topSellers.length === 0) ? (
              <p className="text-xs text-gray-400 py-6 text-center">No store revenue recorded yet.</p>
            ) : (
              <div className="divide-y divide-gray-100 space-y-3">
                {analytics.topSellers.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between pt-3 first:pt-0 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center text-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-gray-900">{s.storeName}</p>
                        <p className="text-gray-400 text-[10px]">{s.totalSold} items sold ({s.totalOrders} orders)</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-green-600">${s.totalRevenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Bottom Grid: Top Best-Selling Products & Recent Marketplace Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Top Selling Products */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
              🔥 Best Selling Products
            </h2>

            {(!analytics?.topProducts || analytics.topProducts.length === 0) ? (
              <p className="text-xs text-gray-400 py-6 text-center">No product sales recorded yet.</p>
            ) : (
              <div className="divide-y divide-gray-100 space-y-3">
                {analytics.topProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between pt-3 first:pt-0 text-xs">
                    <div className="flex items-center gap-3">
                      {p.productImage ? (
                        <img src={p.productImage} alt={p.productName} className="w-10 h-10 rounded-lg object-cover border" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">📦</div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900 line-clamp-1">{p.productName}</p>
                        <p className="text-gray-400 text-[10px]">{p.totalSold} units sold</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-blue-600">${p.totalRevenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent 5 Marketplace Orders */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">📋 Recent Marketplace Orders</h2>
              <Link to="/admin/orders" className="text-xs font-bold text-blue-600 hover:text-blue-800">
                View All Orders &rarr;
              </Link>
            </div>

            {(!analytics?.recentOrders || analytics.recentOrders.length === 0) ? (
              <p className="text-xs text-gray-400 py-6 text-center">No orders placed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-400 uppercase text-[10px] border-b border-gray-100">
                      <th className="pb-2 font-bold">Order #</th>
                      <th className="pb-2 font-bold">Buyer</th>
                      <th className="pb-2 font-bold">Amount</th>
                      <th className="pb-2 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {analytics.recentOrders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-gray-50">
                        <td className="py-3 font-bold text-blue-600">{ord.orderNumber}</td>
                        <td className="py-3 font-bold text-gray-900">{ord.buyerName}</td>
                        <td className="py-3 font-bold text-gray-900">${ord.totalAmount.toFixed(2)}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded font-bold uppercase text-[10px]">
                            {ord.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
