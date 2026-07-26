import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router';
import {
  fetchSellerOrderById,
  updateOrderStatusThunk,
  resetCurrentSellerOrder,
  selectCurrentSellerOrder,
  selectSellerOrderLoading,
  selectIsUpdatingStatus,
  selectSellerOrderError,
  selectSellerOrderSuccess,
  clearSellerOrderError,
  clearSellerOrderSuccess,
} from '../../features/seller/sellerOrderSlice';
import Alert from '../../components/common/Alert';
import OrderTimeline from '../../components/common/OrderTimeline';
import { PageSpinner } from '../../components/common/Spinner';

const NEXT_ACTION_LABELS = {
  confirmed:        'Confirm Order',
  processing:       'Start Processing',
  shipped:          'Mark as Shipped',
  out_for_delivery: 'Mark Out for Delivery',
  delivered:        'Mark Delivered',
  cancelled:        'Cancel Order',
};

const getNextStatuses = (currentStatus) => {
  switch (currentStatus) {
    case 'placed':           return ['confirmed', 'cancelled'];
    case 'confirmed':        return ['processing', 'cancelled'];
    case 'processing':       return ['shipped', 'cancelled'];
    case 'shipped':          return ['out_for_delivery'];
    case 'out_for_delivery': return ['delivered'];
    default:                 return [];
  }
};

const SellerOrderDetailsPage = () => {
  const { orderId } = useParams();
  const dispatch    = useDispatch();

  const order            = useSelector(selectCurrentSellerOrder);
  const isLoading        = useSelector(selectSellerOrderLoading);
  const isUpdatingStatus = useSelector(selectIsUpdatingStatus);
  const error            = useSelector(selectSellerOrderError);
  const successMessage   = useSelector(selectSellerOrderSuccess);

  useEffect(() => {
    dispatch(fetchSellerOrderById(orderId));
    return () => {
      dispatch(resetCurrentSellerOrder());
    };
  }, [orderId, dispatch]);

  if (isLoading || !order) return <PageSpinner />;

  const handleStatusUpdate = (targetStatus) => {
    if (targetStatus === 'cancelled' && !window.confirm('Are you sure you want to cancel this order item? Stock will be restored.')) {
      return;
    }

    dispatch(updateOrderStatusThunk({ orderId: order._id, status: targetStatus }));
  };

  const currentStatus = order.sellerFulfillmentStatus || 'placed';
  const validNextStatuses = getNextStatuses(currentStatus);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Navigation Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/seller/orders" className="hover:text-blue-600">Seller Orders</Link>
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
              Status: {currentStatus}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Order Date: {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <Link
          to="/seller/orders"
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to Orders List
        </Link>
      </div>

      <Alert type="error" message={error} onClose={() => dispatch(clearSellerOrderError())} />
      <Alert type="success" message={successMessage} onClose={() => dispatch(clearSellerOrderSuccess())} />

      {/* Step-by-Step Fulfillment Progress Tracker */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Fulfillment Lifecycle</h2>
        <OrderTimeline currentStatus={currentStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Customer Shipping Info & Seller Items */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Customer Shipping Address (Only necessary fields exposed) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">📍 Customer Shipping Address</h2>
            <div className="text-xs text-gray-600 space-y-0.5">
              <p className="font-bold text-gray-900 text-sm">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.addressLine1} {order.shippingAddress?.addressLine2}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}, {order.shippingAddress?.country}</p>
              <p className="font-mono text-gray-400 pt-1">📞 {order.shippingAddress?.phone}</p>
            </div>
          </div>

          {/* Seller Items Only */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-bold text-xs text-gray-900">
              📦 Products to Fulfill for Your Store ({order.sellerItems.length})
            </div>

            <div className="divide-y divide-gray-100 p-6 space-y-4">
              {order.sellerItems.map((item, idx) => (
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

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-gray-900">${item.subtotal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Status Update Actions & Seller Financial Summary */}
        <div className="space-y-6 sticky top-24">
          
          {/* Status Update Control Panel (Only valid next state actions shown) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">⚡ Fulfill Action</h2>
            <p className="text-xs text-gray-500">Advance order fulfillment to the next state in sequence</p>

            {validNextStatuses.length === 0 ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-xs text-gray-500 font-semibold">
                No further actions available ({currentStatus})
              </div>
            ) : (
              <div className="space-y-2">
                {validNextStatuses.map((st) => {
                  const isCancel = st === 'cancelled';
                  return (
                    <button
                      key={st}
                      onClick={() => handleStatusUpdate(st)}
                      disabled={isUpdatingStatus}
                      className={`w-full py-3 text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-2 ${
                        isCancel
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isUpdatingStatus ? 'Updating...' : NEXT_ACTION_LABELS[st] || `Mark as ${st}`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seller Financial Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
              Store Sales Summary
            </h2>
            <div className="flex justify-between text-sm font-extrabold text-gray-900">
              <span>Your Store Total</span>
              <span className="text-blue-600">${order.sellerSubtotal.toFixed(2)}</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default SellerOrderDetailsPage;
