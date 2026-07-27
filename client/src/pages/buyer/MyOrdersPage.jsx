import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import {
  fetchMyOrders,
  selectMyOrders,
  selectOrderPagination,
  selectOrderLoading,
  selectOrderError,
} from '../../features/order/orderSlice';
import Alert from '../../components/common/Alert';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { PageSpinner } from '../../components/common/Spinner';

const MyOrdersPage = () => {
  const dispatch   = useDispatch();
  const orders     = useSelector(selectMyOrders);
  const pagination = useSelector(selectOrderPagination);
  const isLoading  = useSelector(selectOrderLoading);
  const error      = useSelector(selectOrderError);

  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchMyOrders({ page, limit: 10 }));
  }, [page, dispatch]);

  if (isLoading && orders.length === 0) return <PageSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-extrabold text-gray-900">My Order History</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track and view details for all your marketplace purchases</p>
      </div>

      <Alert type="error" message={error} />

      {orders.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title="No orders placed yet"
          message="When you complete purchases on MarketX, your order history and tracking will appear here."
          actionLabel="Start Shopping"
          actionTo="/products"
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-200 transition">
              
              {/* Order Basic Summary */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-sm text-gray-900">{order.orderNumber}</span>
                  <StatusBadge status={order.paymentStatus} />
                  <StatusBadge status={order.orderStatus} />
                </div>

                <div className="text-xs text-gray-500 flex flex-wrap gap-4">
                  <span>Placing Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                  <span>Items: {order.items.length} item(s)</span>
                  <span>Deliver To: {order.shippingAddress?.fullName} ({order.shippingAddress?.city})</span>
                </div>
              </div>

              {/* Price & Action */}
              <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">Total Amount</span>
                  <span className="text-lg font-extrabold text-gray-900">${order.totalAmount}</span>
                </div>

                <Link
                  to={`/account/orders/${order.orderNumber}`}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition"
                >
                  View Details &rarr;
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

export default MyOrdersPage;
