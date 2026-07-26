import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router';
import api from '../../services/api';
import {
  fetchOrderById,
  resetCurrentOrder,
  selectCurrentOrder,
  selectOrderLoading,
  selectOrderError,
} from '../../features/order/orderSlice';
import Alert from '../../components/common/Alert';
import OrderTimeline from '../../components/common/OrderTimeline';
import { PageSpinner } from '../../components/common/Spinner';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const dispatch    = useDispatch();

  const order     = useSelector(selectCurrentOrder);
  const isLoading = useSelector(selectOrderLoading);
  const error     = useSelector(selectOrderError);

  useEffect(() => {
    dispatch(fetchOrderById(orderId));
    return () => {
      dispatch(resetCurrentOrder());
    };
  }, [orderId, dispatch]);

  if (isLoading || !order) return <PageSpinner />;

  const handleCancelItem = async (productId) => {
    if (!window.confirm('Are you sure you want to cancel this order item? Stock will be restored.')) {
      return;
    }

    try {
      await api.patch(`/orders/${order._id}/cancel`, { productId });
      dispatch(fetchOrderById(orderId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel item');
    }
  };

  // Group items by store
  const storeGroups = (order.items || []).reduce((acc, item) => {
    const storeObj = item.store || {};
    const storeName = typeof storeObj === 'object' ? (storeObj.name || 'Store') : 'Store';
    const storeSlug = typeof storeObj === 'object' ? storeObj.slug : '';

    if (!acc[storeName]) {
      acc[storeName] = { storeName, storeSlug, items: [] };
    }
    acc[storeName].items.push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Navigation Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/account/orders" className="hover:text-blue-600">My Orders</Link>
        <span>/</span>
        <span className="text-gray-900 font-bold">{order.orderNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900">{order.orderNumber}</h1>
            <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-xs font-bold uppercase rounded-full">
              ✓ {order.paymentStatus}
            </span>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold uppercase rounded-full">
              Overall: {order.orderStatus}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <Link
          to="/account/orders"
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to All Orders
        </Link>
      </div>

      <Alert type="error" message={error} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Shipping Address & Store Fulfillment Groups */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">📍 Shipping Address</h2>
            <div className="text-xs text-gray-600 space-y-0.5">
              <p className="font-bold text-gray-900 text-sm">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1} {order.shippingAddress.addressLine2}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
              <p className="font-mono text-gray-400 pt-1">📞 {order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Items Grouped By Store with Visual Fulfillment Timeline */}
          <div className="space-y-6">
            <h2 className="text-base font-bold text-gray-900">📦 Store Fulfillment Timelines</h2>

            {Object.values(storeGroups).map((group) => {
              // Calculate store status for this group
              const storeStatuses = group.items.map((i) => i.status);
              const storeStatus = storeStatuses[0] || 'placed';

              return (
                <div key={group.storeName} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm space-y-4">
                  
                  {/* Store Header */}
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏪</span>
                      <span className="font-bold text-sm text-gray-900">{group.storeName}</span>
                    </div>
                    {group.storeSlug && (
                      <Link to={`/stores/${group.storeSlug}`} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition">
                        Visit Store &rarr;
                      </Link>
                    )}
                  </div>

                  {/* Store Order Timeline Tracker */}
                  <div className="px-6">
                    <OrderTimeline currentStatus={storeStatus} />
                  </div>

                  {/* Store Items List */}
                  <div className="divide-y divide-gray-100 p-6 space-y-4 border-t border-gray-100">
                    {group.items.map((item, idx) => {
                      const canCancel   = ['placed', 'confirmed', 'processing'].includes(item.status);
                      const isDelivered = item.status === 'delivered';

                      return (
                        <div key={idx} className="flex items-center justify-between pt-3 first:pt-0">
                          <div className="flex items-center gap-4">
                            {item.productImage ? (
                              <img src={item.productImage} alt={item.productName} className="w-14 h-14 rounded-xl object-cover border border-gray-100" />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 text-xl border">📦</div>
                            )}
                            <div>
                              <p className="font-bold text-sm text-gray-900">{item.productName}</p>
                              <p className="text-xs text-gray-400">Qty: {item.quantity} × ${item.unitPrice}</p>
                              <span className="inline-block text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold uppercase mt-1">
                                Item Status: {item.status}
                              </span>
                            </div>
                          </div>

                          <div className="text-right space-y-2">
                            <span className="text-sm font-extrabold text-gray-900 block">${item.subtotal}</span>
                            
                            {canCancel && (
                              <button
                                onClick={() => handleCancelItem(item.product)}
                                className="text-[11px] font-bold text-red-600 hover:text-red-800 transition underline block ml-auto"
                              >
                                Cancel Item
                              </button>
                            )}

                            {isDelivered && (
                              <Link
                                to={`/products/${item.product?.slug || item.product}`}
                                className="px-3 py-1 bg-green-50 text-green-800 border border-green-200 hover:bg-green-100 rounded-lg text-xs font-bold transition inline-block ml-auto"
                              >
                                ✍️ Write a Review
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Financial Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 sticky top-24">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Payment Summary</h2>

          <div className="space-y-3 text-xs font-medium text-gray-600">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-bold text-gray-900">${order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-green-600 font-semibold">FREE</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes</span>
              <span>$0.00</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-extrabold text-gray-900">
              <span>Total Amount Paid</span>
              <span className="text-blue-600">${order.totalAmount}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-1 font-mono text-gray-600">
            <p className="font-bold text-gray-800 font-sans mb-1">Razorpay Transaction Details</p>
            <p className="truncate"><span className="text-gray-400">Payment ID:</span> {order.razorpayPaymentId || 'N/A'}</p>
            <p className="truncate"><span className="text-gray-400">Order ID:</span> {order.razorpayOrderId || 'N/A'}</p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default OrderDetailsPage;
