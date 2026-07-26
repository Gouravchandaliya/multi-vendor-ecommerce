import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router';
import {
  fetchAddresses,
  createAddress,
  selectAddresses,
  selectSelectedAddressId,
  setSelectedAddressId,
  selectAddressLoading,
  selectAddressSubmitting,
} from '../../features/address/addressSlice';
import {
  fetchCart,
  selectCart,
  selectCartLoading,
} from '../../features/cart/cartSlice';
import {
  initRazorpayOrder,
  verifyPayment,
  selectIsProcessingPayment,
  selectIsVerifyingPayment,
  selectOrderError,
  clearOrderError,
} from '../../features/order/orderSlice';
import { selectUser, selectIsLoggedIn } from '../../features/auth/authSlice';
import Alert from '../../components/common/Alert';
import FormInput from '../../components/common/FormInput';
import { PageSpinner } from '../../components/common/Spinner';

// Helper to load external Razorpay JS SDK script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user       = useSelector(selectUser);

  const addresses         = useSelector(selectAddresses);
  const selectedAddressId = useSelector(selectSelectedAddressId);
  const addressLoading    = useSelector(selectAddressLoading);
  const addressSubmitting = useSelector(selectAddressSubmitting);

  const cart        = useSelector(selectCart);
  const cartLoading = useSelector(selectCartLoading);

  const isProcessingPayment = useSelector(selectIsProcessingPayment);
  const isVerifyingPayment  = useSelector(selectIsVerifyingPayment);
  const orderError          = useSelector(selectOrderError);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm]         = useState({
    fullName: user?.name || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: true,
  });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: { pathname: '/checkout' } }, replace: true });
      return;
    }

    dispatch(fetchAddresses());
    dispatch(fetchCart());
    loadRazorpayScript();
  }, [isLoggedIn, navigate, dispatch]);

  const items = cart?.items || [];

  // If cart is loaded and empty, redirect to /cart
  useEffect(() => {
    if (!cartLoading && cart && items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cart, cartLoading, items.length, navigate]);

  // Group items by store
  const storeGroups = items.reduce((acc, item) => {
    const prod = item.product || {};
    const storeName = prod.store?.name || 'Independent Store';
    if (!acc[storeName]) acc[storeName] = { storeName, items: [] };
    acc[storeName].items.push(item);
    return acc;
  }, {});

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(createAddress(addressForm));
    if (createAddress.fulfilled.match(result)) {
      setShowAddressForm(false);
      setAddressForm({
        fullName: user?.name || '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: false,
      });
    }
  };

  const handlePaySecurely = async () => {
    if (!selectedAddressId) {
      alert('Please select or add a shipping address before proceeding.');
      return;
    }

    // 1. Initialize Razorpay order on backend
    const result = await dispatch(initRazorpayOrder());

    if (!initRazorpayOrder.fulfilled.match(result)) {
      return;
    }

    const { razorpayOrderId, amount, currency, keyId } = result.payload;

    // 2. Load SDK and open checkout modal
    const isScriptLoaded = await loadRazorpayScript();

    if (!isScriptLoaded || !window.Razorpay) {
      // Test Mode Fallback if SDK fails to load or in offline dev environment
      const mockResult = await dispatch(verifyPayment({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: `pay_test_${Date.now()}`,
        razorpay_signature: 'mock_signature',
        shippingAddressId: selectedAddressId,
      }));

      if (verifyPayment.fulfilled.match(mockResult)) {
        navigate(`/order-success/${mockResult.payload._id}`);
      }
      return;
    }

    const selectedAddress = addresses.find((a) => a._id === selectedAddressId);

    const options = {
      key: keyId,
      amount: amount,
      currency: currency,
      name: 'MarketX Marketplace',
      description: `Payment for Order`,
      order_id: razorpayOrderId.startsWith('order_test_') ? undefined : razorpayOrderId,
      prefill: {
        name: selectedAddress?.fullName || user?.name,
        email: user?.email,
        contact: selectedAddress?.phone || '',
      },
      theme: { color: '#2563EB' },
      handler: async (response) => {
        const verifyRes = await dispatch(verifyPayment({
          razorpay_order_id: response.razorpay_order_id || razorpayOrderId,
          razorpay_payment_id: response.razorpay_payment_id || `pay_test_${Date.now()}`,
          razorpay_signature: response.razorpay_signature || 'test_sig',
          shippingAddressId: selectedAddressId,
        }));

        if (verifyPayment.fulfilled.match(verifyRes)) {
          navigate(`/order-success/${verifyRes.payload._id}`);
        }
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal dismissed by user');
        },
      },
    };

    // If mock order in test environment without real key, execute mock verification directly
    if (razorpayOrderId.startsWith('order_test_') || keyId === 'rzp_test_mockKeyId') {
      const mockRes = await dispatch(verifyPayment({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: `pay_test_${Date.now()}`,
        razorpay_signature: 'mock_sig',
        shippingAddressId: selectedAddressId,
      }));

      if (verifyPayment.fulfilled.match(mockRes)) {
        navigate(`/order-success/${mockRes.payload._id}`);
      }
      return;
    }

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (cartLoading || addressLoading) return <PageSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Navigation Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/cart" className="hover:text-blue-600">Cart</Link>
        <span>/</span>
        <span className="text-gray-900 font-bold">Checkout</span>
      </nav>

      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-extrabold text-gray-900">Secure Marketplace Checkout</h1>
        <p className="text-gray-500 text-sm mt-0.5">Select a shipping address and complete your test payment</p>
      </div>

      <Alert type="error" message={orderError} onClose={() => dispatch(clearOrderError())} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Address Selection & Order Review */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Shipping Address */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>📍 1. Shipping Address</span>
              </h2>
              <button
                onClick={() => setShowAddressForm((p) => !p)}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold transition"
              >
                {showAddressForm ? 'Cancel' : '+ Add New Address'}
              </button>
            </div>

            {/* Address List */}
            {addresses.length > 0 && !showAddressForm && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <label
                    key={addr._id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between space-y-2 ${
                      selectedAddressId === addr._id
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="shippingAddress"
                          checked={selectedAddressId === addr._id}
                          onChange={() => dispatch(setSelectedAddressId(addr._id))}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="font-bold text-sm text-gray-900">{addr.fullName}</span>
                      </div>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 space-y-0.5 pl-6">
                      <p>{addr.addressLine1} {addr.addressLine2}</p>
                      <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                      <p className="font-mono text-gray-400">📞 {addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Add Address Form */}
            {(showAddressForm || addresses.length === 0) && (
              <form onSubmit={handleAddressSubmit} className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wide">New Shipping Address</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Full Name"
                    name="fullName"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    required
                  />
                  <FormInput
                    label="Phone Number"
                    name="phone"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    required
                  />
                </div>

                <FormInput
                  label="Address Line 1"
                  name="addressLine1"
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  placeholder="Street address, house number"
                  required
                />

                <FormInput
                  label="Address Line 2 (Optional)"
                  name="addressLine2"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  placeholder="Apartment, suite, unit"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <FormInput
                    label="City"
                    name="city"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    required
                  />
                  <FormInput
                    label="State"
                    name="state"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    required
                  />
                  <FormInput
                    label="Postal Code"
                    name="postalCode"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={addressSubmitting}
                  className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  {addressSubmitting ? 'Saving Address...' : 'Save & Select Address'}
                </button>
              </form>
            )}

          </div>

          {/* Section 2: Order Items Review (Grouped By Store) */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">📦 2. Review Items in Order</h2>
            {Object.values(storeGroups).map((group) => (
              <div key={group.storeName} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-bold text-xs text-gray-900 flex items-center gap-2">
                  <span>🏪 Store: {group.storeName}</span>
                </div>
                <div className="p-6 divide-y divide-gray-100 space-y-4">
                  {group.items.map((item) => {
                    const prod = item.product || {};
                    const unitPrice = item.unitPrice || prod.discountPrice || prod.price || 0;
                    return (
                      <div key={prod._id} className="flex items-center justify-between pt-3 first:pt-0">
                        <div className="flex items-center gap-3">
                          {prod.images?.[0] && (
                            <img src={prod.images[0]} alt={prod.name} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                          )}
                          <div>
                            <p className="font-bold text-xs text-gray-900">{prod.name}</p>
                            <p className="text-[11px] text-gray-400">Qty: {item.quantity} × ${unitPrice.toFixed(2)}</p>
                          </div>
                        </div>
                        <span className="font-bold text-xs text-gray-900">${(unitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Column: Order Summary & Pay Action */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 sticky top-24">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            Payment Summary
          </h2>

          <div className="space-y-3 text-xs font-medium text-gray-600">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-bold text-gray-900">${(cart?.subtotal || 0).toFixed(2)}</span>
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
              <span>Total Payable</span>
              <span className="text-blue-600">${(cart?.subtotal || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handlePaySecurely}
              disabled={isProcessingPayment || isVerifyingPayment || !selectedAddressId}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessingPayment ? (
                <span>Preparing Payment...</span>
              ) : isVerifyingPayment ? (
                <span>Confirming Payment...</span>
              ) : (
                <span>🔒 Pay Securely with Razorpay</span>
              )}
            </button>
            <p className="text-[11px] text-gray-400 text-center">
              Razorpay TEST MODE enabled. No real money will be charged.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default CheckoutPage;
