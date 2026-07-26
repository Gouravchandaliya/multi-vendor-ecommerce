import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router';
import {
  fetchOrderById,
  selectCurrentOrder,
  selectOrderLoading,
} from '../../features/order/orderSlice';
import { PageSpinner } from '../../components/common/Spinner';

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const dispatch    = useDispatch();

  const order     = useSelector(selectCurrentOrder);
  const isLoading = useSelector(selectOrderLoading);

  useEffect(() => {
    dispatch(fetchOrderById(orderId));
  }, [orderId, dispatch]);

  if (isLoading || !order) return <PageSpinner />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      
      {/* Success Hero Header */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto font-bold">
          ✓
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Payment Successful!</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Thank you for your purchase. Your order has been placed successfully and dispatched to merchant stores.
        </p>

        <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-700">
          <span>Order Number:</span>
          <span className="font-bold text-blue-600">{order.orderNumber}</span>
        </div>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Order Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-gray-600">
          <div>
            <h3 className="font-bold text-gray-900 uppercase tracking-wide mb-1">Shipping Address</h3>
            <p className="font-semibold text-gray-800">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.addressLine1}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p className="font-mono text-gray-400">📞 {order.shippingAddress.phone}</p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 uppercase tracking-wide mb-1">Payment & Status</h3>
            <p><span className="text-gray-400">Method:</span> <span className="font-semibold capitalize">{order.paymentMethod}</span></p>
            <p><span className="text-gray-400">Payment Status:</span> <span className="font-bold text-green-600 uppercase">{order.paymentStatus}</span></p>
            <p><span className="text-gray-400">Order Status:</span> <span className="font-bold text-blue-600 uppercase">{order.orderStatus}</span></p>
            <p className="font-mono text-gray-400 mt-1">Total Paid: <span className="text-sm font-extrabold text-gray-900">${order.totalAmount}</span></p>
          </div>
        </div>

        {/* Items Summary */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wide">Purchased Items ({order.items.length})</h3>
          <div className="divide-y divide-gray-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {item.productImage && (
                    <img src={item.productImage} alt={item.productName} className="w-10 h-10 rounded-lg object-cover border" />
                  )}
                  <div>
                    <p className="font-bold text-gray-900">{item.productName}</p>
                    <p className="text-[11px] text-gray-400">Qty: {item.quantity} × ${item.unitPrice}</p>
                  </div>
                </div>
                <span className="font-bold text-gray-900">${item.subtotal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/account/orders"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow text-center transition"
        >
          View My Orders &rarr;
        </Link>
        <Link
          to="/products"
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl text-center transition"
        >
          Continue Shopping
        </Link>
      </div>

    </div>
  );
};

export default OrderSuccessPage;
