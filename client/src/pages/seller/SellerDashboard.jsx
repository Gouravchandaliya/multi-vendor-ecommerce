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
  fetchSellerAnalytics,
  setRange,
  selectSellerAnalyticsData,
  selectSellerAnalyticsRange,
  selectSellerAnalyticsLoading,
  selectSellerAnalyticsError,
} from '../../features/seller/sellerAnalyticsSlice';
import { selectUser } from '../../features/auth/authSlice';
import StatusBadge from '../../components/common/StatusBadge';
import { PageSpinner } from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import SellerSidebar from '../../components/layout/SellerSidebar';
import RevenueChart from '../../components/common/RevenueChart';
import OrderStatusDonut from '../../components/common/OrderStatusDonut';

const RANGES = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '1 Year', value: '1y' },
];

const SellerDashboard = () => {
  const dispatch  = useDispatch();
  const user      = useSelector(selectUser);
  const myStore   = useSelector(selectMyStore);
  const isLoaded  = useSelector(selectMyStoreLoaded);
  const storeLoading = useSelector(selectStoreLoading);

  const analytics    = useSelector(selectSellerAnalyticsData);
  const currentRange = useSelector(selectSellerAnalyticsRange);
  const analyticsLoading = useSelector(selectSellerAnalyticsLoading);
  const analyticsError   = useSelector(selectSellerAnalyticsError);

  useEffect(() => {
    dispatch(fetchMyStore());
  }, [dispatch]);

  useEffect(() => {
    if (myStore && myStore.status === 'approved') {
      dispatch(fetchSellerAnalytics(currentRange));
    }
  }, [dispatch, myStore, currentRange]);

  if (!isLoaded || storeLoading) return <PageSpinner />;

  const isApproved = myStore?.status === 'approved';
  const overview   = analytics?.overview || {};

  const handleRangeChange = (newRange) => {
    dispatch(setRange(newRange));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SellerSidebar isApproved={isApproved} />

      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl">
        
        {/* Top Header & Range Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Seller Dashboard & Analytics</h1>
            <p className="text-gray-500 text-xs mt-0.5">Welcome back, {user?.name}</p>
          </div>

          {myStore && (
            <div className="flex items-center gap-3">
              <StatusBadge status={myStore.status} />
              <Link
                to="/seller/store-settings"
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 rounded-xl transition"
              >
                Store Settings ⚙️
              </Link>
            </div>
          )}
        </div>

        {/* State Banner: No Store Application */}
        {!myStore && (
          <div className="bg-white rounded-2xl border border-blue-100 p-10 shadow-sm text-center space-y-4">
            <span className="text-5xl">🏪</span>
            <h2 className="text-xl font-bold text-gray-900">Start Selling on MarketX</h2>
            <p className="text-gray-600 text-xs max-w-md mx-auto">
              You haven't created a store application yet. Set up your store profile to start listing products.
            </p>
            <Link
              to="/become-seller"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Apply to Become a Seller &rarr;
            </Link>
          </div>
        )}

        {/* State Banner: Pending / Rejected / Suspended */}
        {myStore && myStore.status === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 flex items-start gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <h3 className="font-bold text-sm">Store Application Pending Admin Approval</h3>
              <p className="text-xs text-amber-800 mt-1">
                Your store application is currently under review by marketplace administrators.
              </p>
            </div>
          </div>
        )}

        {myStore && myStore.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-900 flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <h3 className="font-bold text-sm">Application Rejected</h3>
              <p className="text-xs text-red-800 mt-1">
                Reason: {myStore.rejectionReason || 'Requirements not met.'}
              </p>
            </div>
          </div>
        )}

        {/* Approved Store Real-Time Analytics View */}
        {isApproved && (
          <div className="space-y-6">
            
            {/* Header Control Row: Quick Actions + Range Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/seller/products/add"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  + Add Product
                </Link>
                <Link
                  to="/seller/orders"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition"
                >
                  📦 Orders ({overview.pendingOrders || 0} Pending)
                </Link>
                <Link
                  to="/seller/products"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition"
                >
                  🏷️ Products
                </Link>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                {RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => handleRangeChange(r.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      currentRange === r.value
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <Alert type="error" message={analyticsError} />

            {/* 6 Real KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
                <span className="text-xl">💵</span>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
                <p className="text-xl font-extrabold text-gray-900">${(overview.totalRevenue || 0).toFixed(2)}</p>
                <span className="text-[10px] font-semibold text-green-600">Paid seller items</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
                <span className="text-xl">📦</span>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
                <p className="text-xl font-extrabold text-gray-900">{overview.totalOrders || 0}</p>
                <span className="text-[10px] font-semibold text-gray-500">In selected window</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
                <span className="text-xl">🏷️</span>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Products</p>
                <p className="text-xl font-extrabold text-gray-900">{overview.totalProducts || 0}</p>
                <span className="text-[10px] font-semibold text-blue-600">{overview.activeProducts || 0} active</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
                <span className="text-xl">👥</span>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Customers</p>
                <p className="text-xl font-extrabold text-gray-900">{overview.totalCustomers || 0}</p>
                <span className="text-[10px] font-semibold text-gray-500">Unique buyers</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
                <span className="text-xl">⏳</span>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending Orders</p>
                <p className="text-xl font-extrabold text-amber-600">{overview.pendingOrders || 0}</p>
                <span className="text-[10px] font-semibold text-amber-600">Needs fulfillment</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
                <span className="text-xl">⚠️</span>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Low Stock</p>
                <p className="text-xl font-extrabold text-red-600">{overview.lowStockCount || 0}</p>
                <span className="text-[10px] font-semibold text-red-600">{overview.outOfStockCount || 0} out of stock</span>
              </div>

            </div>

            {/* Revenue Overview Trend Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">📈 Revenue Overview Trend</h2>
                <span className="text-xs text-gray-500 font-semibold">Range: {currentRange}</span>
              </div>

              {analyticsLoading ? (
                <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
              ) : (
                <RevenueChart trendData={analytics?.revenueTrend || []} />
              )}
            </div>

            {/* Middle Grid: Order Status Distribution & Top Selling Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Order Status Breakdown Donut */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                  📊 Order Fulfillment Status
                </h2>
                <OrderStatusDonut breakdown={analytics?.orderStatusBreakdown || []} />
              </div>

              {/* Top Selling Products List */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                  🔥 Top Selling Products
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
                            <p className="text-gray-400 text-[11px]">{p.totalSold} units sold</p>
                          </div>
                        </div>
                        <span className="font-extrabold text-blue-600">${p.totalRevenue.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Grid: Recent Orders & Low Stock Inventory Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Recent 5 Orders Table */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">📋 Recent Orders</h2>
                  <Link to="/seller/orders" className="text-xs font-bold text-blue-600 hover:text-blue-800">
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
                          <th className="pb-2 font-bold">Customer</th>
                          <th className="pb-2 font-bold">Date</th>
                          <th className="pb-2 font-bold">Amount</th>
                          <th className="pb-2 font-bold">Payment</th>
                          <th className="pb-2 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                        {analytics.recentOrders.map((ord) => (
                          <tr key={ord._id} className="hover:bg-gray-50">
                            <td className="py-3 font-bold text-blue-600">{ord.orderNumber}</td>
                            <td className="py-3 font-bold text-gray-900">{ord.buyerName}</td>
                            <td className="py-3 text-gray-400">{new Date(ord.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 font-bold text-gray-900">${ord.sellerSubtotal.toFixed(2)}</td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded font-bold uppercase text-[10px]">
                                {ord.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <Link
                                to={`/seller/orders/${ord._id}`}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Low Stock Products Alert */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">⚠️ Low Stock Alerts</h2>
                  <Link to="/seller/products" className="text-xs font-bold text-blue-600 hover:text-blue-800">
                    Manage &rarr;
                  </Link>
                </div>

                {(!analytics?.lowStockItems || analytics.lowStockItems.length === 0) ? (
                  <div className="text-center py-6 space-y-1">
                    <span className="text-2xl">✅</span>
                    <p className="text-xs font-bold text-gray-700">Inventory Health Good</p>
                    <p className="text-[11px] text-gray-400">All products have stock &gt; 5 units.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 space-y-3">
                    {analytics.lowStockItems.map((prod) => (
                      <div key={prod._id} className="flex items-center justify-between pt-3 first:pt-0 text-xs">
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{prod.name}</p>
                          <p className="text-[10px] text-gray-400">${prod.price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              prod.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {prod.stock === 0 ? 'Out of stock' : `${prod.stock} left`}
                          </span>
                          <Link
                            to={`/seller/products/edit/${prod._id}`}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                          >
                            Restock
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default SellerDashboard;
