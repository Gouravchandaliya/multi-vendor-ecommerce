import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import {
  fetchSellerOrders,
  selectSellerOrders,
  selectSellerOrderPagination,
  selectSellerOrderLoading,
  selectSellerOrderError,
} from '../../features/seller/sellerOrderSlice';
import Alert from '../../components/common/Alert';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { PageSpinner } from '../../components/common/Spinner';

const STATUS_TABS = [
  { key: 'all',              label: 'All Orders' },
  { key: 'placed',           label: 'Placed' },
  { key: 'confirmed',        label: 'Confirmed' },
  { key: 'processing',       label: 'Processing' },
  { key: 'shipped',          label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered',        label: 'Delivered' },
  { key: 'cancelled',        label: 'Cancelled' },
];

const SellerOrdersPage = () => {
  const dispatch   = useDispatch();
  const orders     = useSelector(selectSellerOrders);
  const pagination = useSelector(selectSellerOrderPagination);
  const isLoading  = useSelector(selectSellerOrderLoading);
  const error      = useSelector(selectSellerOrderError);

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);

  useEffect(() => {
    dispatch(fetchSellerOrders({ status: activeTab, search, page, limit: 10 }));
  }, [activeTab, search, page, dispatch]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-gray-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Seller Order Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage and fulfill customer orders for your store products</p>
        </div>
        <Link
          to="/seller/dashboard"
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to Seller Dashboard
        </Link>
      </div>

      <Alert type="error" message={error} />

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
        
        {/* Search Bar */}
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Search by Order Number (e.g. ORD-1001)..."
            value={search}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-gray-100 pt-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Orders List */}
      {isLoading && orders.length === 0 ? (
        <PageSpinner />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No seller orders found"
          message="No customer orders match the selected filter status or search query."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord._id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-200 transition"
            >
              {/* Left Order Information */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-sm text-gray-900">{ord.orderNumber}</span>
                  <StatusBadge status={ord.paymentStatus} />
                  <StatusBadge status={ord.sellerFulfillmentStatus} />
                </div>

                <div className="text-xs text-gray-500 flex flex-wrap gap-4">
                  <span>Order Date: {new Date(ord.createdAt).toLocaleDateString()}</span>
                  <span>Deliver To: {ord.shippingAddress?.fullName} ({ord.shippingAddress?.city})</span>
                </div>

                {/* Seller's Items Snapshot */}
                <div className="pt-2 flex flex-wrap gap-3">
                  {ord.sellerItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 text-xs">
                      {item.productImage && (
                        <img src={item.productImage} alt={item.productName} className="w-6 h-6 rounded object-cover" />
                      )}
                      <span className="font-medium text-gray-900 truncate max-w-[150px]">{item.productName}</span>
                      <span className="text-gray-400">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Action & Seller Total */}
              <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">Store Total</span>
                  <span className="text-lg font-extrabold text-blue-600">${ord.sellerSubtotal.toFixed(2)}</span>
                </div>

                <Link
                  to={`/seller/orders/${ord._id}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Manage Order &rarr;
                </Link>
              </div>

            </div>
          ))}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-xs text-gray-600 font-semibold">Page {pagination.page} of {pagination.totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default SellerOrdersPage;
