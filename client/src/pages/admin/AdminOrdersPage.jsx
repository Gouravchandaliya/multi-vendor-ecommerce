import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '../../services/api';
import Alert from '../../components/common/Alert';
import { PageSpinner } from '../../components/common/Spinner';

const STATUS_OPTIONS = [
  'all',
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const AdminOrdersPage = () => {
  const [orders, setOrders]         = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState(null);

  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  useEffect(() => {
    const fetchAdminOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/orders/admin/all?status=${status}&search=${encodeURIComponent(search)}&page=${page}&limit=${10}`);
        setOrders(response.data.data.orders);
        setPagination(response.data.data.pagination);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to fetch admin orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminOrders();
  }, [status, search, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-gray-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Admin Marketplace Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">Overview of all multi-vendor orders across the platform</p>
        </div>
        <Link
          to="/admin/dashboard"
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to Admin Dashboard
        </Link>
      </div>

      <Alert type="error" message={error} />

      {/* Filter controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search by Order Number..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-72 px-4 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
        />

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-600">Filter Status:</span>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 bg-white font-semibold focus:outline-none"
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>{st.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List Table / Cards */}
      {isLoading ? (
        <PageSpinner />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3 shadow-sm max-w-md mx-auto">
          <span className="text-5xl">📋</span>
          <h2 className="text-lg font-bold text-gray-900">No marketplace orders</h2>
          <p className="text-xs text-gray-500">No orders match the specified criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            // Group unique store names
            const storeNames = Array.from(
              new Set(
                (ord.items || [])
                  .map((i) => i.store?.name)
                  .filter(Boolean)
              )
            ).join(', ');

            return (
              <div
                key={ord._id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-gray-300 transition"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-extrabold text-sm text-gray-900">{ord.orderNumber}</span>
                    <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold uppercase rounded-full">
                      ✓ {ord.paymentStatus}
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase rounded-full">
                      {ord.orderStatus}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 flex flex-wrap gap-4">
                    <span>Buyer: <strong className="text-gray-800">{ord.buyer?.name}</strong> ({ord.buyer?.email})</span>
                    <span>Stores Involved: <strong className="text-blue-700">{storeNames || 'N/A'}</strong></span>
                    <span>Date: {new Date(ord.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Order Total</span>
                    <span className="text-lg font-extrabold text-gray-900">${ord.totalAmount}</span>
                  </div>
                </div>
              </div>
            );
          })}

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

export default AdminOrdersPage;
