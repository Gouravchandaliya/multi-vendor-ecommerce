import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import {
  fetchCart,
  updateCartQuantity,
  removeCartItem,
  clearCart,
  updateGuestQuantity,
  removeGuestItem,
  clearGuestItems,
  selectCart,
  selectGuestItems,
  selectCartLoading,
  selectCartError,
  selectCartSuccess,
  clearCartError,
  clearCartSuccess,
} from '../../features/cart/cartSlice';
import { selectIsLoggedIn } from '../../features/auth/authSlice';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import { PageSpinner } from '../../components/common/Spinner';

const CartPage = () => {
  const dispatch   = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);

  const serverCart = useSelector(selectCart);
  const guestItems = useSelector(selectGuestItems);
  const isLoading  = useSelector(selectCartLoading);
  const error      = useSelector(selectCartError);
  const success    = useSelector(selectCartSuccess);

  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchCart());
    }
  }, [isLoggedIn, dispatch]);

  // Combine items & calculate multi-vendor grouping depending on auth state
  const rawItems = isLoggedIn ? (serverCart?.items || []) : guestItems;

  // Group items by store
  const storeGroups = rawItems.reduce((acc, item) => {
    const prod = item.product || {};
    const storeName = prod.store?.name || 'Independent Store';
    const storeSlug = prod.store?.slug || '';

    if (!acc[storeName]) {
      acc[storeName] = { storeName, storeSlug, items: [] };
    }
    acc[storeName].items.push(item);
    return acc;
  }, {});

  const subtotal = isLoggedIn
    ? (serverCart?.subtotal || 0)
    : rawItems.reduce((acc, i) => {
        const p = i.product || {};
        const price = (p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price) ? p.discountPrice : (p.price || 0);
        return acc + price * i.quantity;
      }, 0);

  const totalItemsCount = isLoggedIn
    ? (serverCart?.itemCount || 0)
    : rawItems.reduce((acc, i) => acc + i.quantity, 0);

  const handleQtyChange = (productId, newQty, maxStock) => {
    if (newQty < 1) return;
    if (maxStock && newQty > maxStock) return;

    if (isLoggedIn) {
      dispatch(updateCartQuantity({ productId, quantity: newQty }));
    } else {
      dispatch(updateGuestQuantity({ productId, quantity: newQty }));
    }
  };

  const handleRemove = (productId) => {
    if (isLoggedIn) {
      dispatch(removeCartItem(productId));
    } else {
      dispatch(removeGuestItem(productId));
    }
  };

  const handleClear = () => {
    if (isLoggedIn) {
      dispatch(clearCart());
    } else {
      dispatch(clearGuestItems());
    }
  };

  if (isLoading && isLoggedIn && !serverCart) return <PageSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Your Shopping Cart</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {totalItemsCount === 0 ? 'Your cart is empty' : `Reviewing ${totalItemsCount} item(s) in your cart`}
          </p>
        </div>
        {rawItems.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-red-600 hover:text-red-800 font-semibold transition self-start sm:self-auto"
          >
            Clear Cart
          </button>
        )}
      </div>

      <Alert type="error" message={error} onClose={() => dispatch(clearCartError())} />
      <Alert type="success" message={success} onClose={() => dispatch(clearCartSuccess())} />

      {rawItems.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          message="Looks like you haven't added anything to your cart yet. Explore our multi-vendor marketplace to discover great products!"
          actionLabel="Continue Shopping"
          actionTo="/products"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left: Cart Items Grouped By Store */}
          <div className="lg:col-span-2 space-y-6">
            {Object.values(storeGroups).map((group) => (
              <div key={group.storeName} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                
                {/* Store Banner Subheader */}
                <div className="bg-gray-50/80 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏪</span>
                    <span className="font-bold text-sm text-gray-900">{group.storeName}</span>
                  </div>
                  {group.storeSlug && (
                    <Link
                      to={`/stores/${group.storeSlug}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                    >
                      Visit Store &rarr;
                    </Link>
                  )}
                </div>

                {/* Store Items List */}
                <div className="divide-y divide-gray-100 p-6 space-y-6">
                  {group.items.map((item) => {
                    const prod = item.product || {};
                    const isAvailable = item.isAvailable !== false;
                    const unitPrice   = item.unitPrice || ((prod.discountPrice > 0 && prod.discountPrice < prod.price) ? prod.discountPrice : (prod.price || 0));
                    const itemTotal   = item.itemSubtotal || (unitPrice * item.quantity);
                    const prodImage   = prod.images && prod.images.length > 0 ? prod.images[0] : null;

                    return (
                      <div key={prod._id || item.productId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 first:pt-0">
                        
                        {/* Product Info */}
                        <div className="flex items-center gap-4 flex-1">
                          <Link to={prod.slug ? `/products/${prod.slug}` : '#'} className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden block">
                            {prodImage ? (
                              <img src={prodImage} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">📦</div>
                            )}
                          </Link>

                          <div className="space-y-1">
                            <Link to={prod.slug ? `/products/${prod.slug}` : '#'} className="font-bold text-sm text-gray-900 hover:text-blue-600 transition line-clamp-1">
                              {prod.name || 'Product Item'}
                            </Link>
                            <p className="text-xs text-gray-400 font-medium">${unitPrice.toFixed(2)} each</p>
                            
                            {!isAvailable && (
                              <span className="inline-block text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                ⚠️ {item.unavailabilityReason || 'Product is currently unavailable'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity & Controls */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                          
                          {/* Quantity Selector */}
                          <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                            <button
                              onClick={() => handleQtyChange(prod._id || item.productId, item.quantity - 1, prod.stock)}
                              disabled={item.quantity <= 1}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-200 font-bold text-xs disabled:opacity-40"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="px-3 text-xs font-bold text-gray-900">{item.quantity}</span>
                            <button
                              onClick={() => handleQtyChange(prod._id || item.productId, item.quantity + 1, prod.stock)}
                              disabled={prod.stock && item.quantity >= prod.stock}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-200 font-bold text-xs disabled:opacity-40"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          {/* Subtotal */}
                          <div className="text-right min-w-[70px]">
                            <span className="text-sm font-extrabold text-gray-900">${itemTotal.toFixed(2)}</span>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemove(prod._id || item.productId)}
                            className="text-gray-400 hover:text-red-600 transition p-1 text-base"
                            title="Remove item"
                            aria-label="Remove item from cart"
                          >
                            🗑️
                          </button>

                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>

          {/* Right: Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 sticky top-24">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs font-medium text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({totalItemsCount} items)</span>
                <span className="font-bold text-gray-900">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="flex justify-between text-gray-400">
                <span>Tax</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-extrabold text-gray-900">
                <span>Estimated Total</span>
                <span className="text-base text-blue-600">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <div className="space-y-2 pt-2">
              <Link
                to="/checkout"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-center"
              >
                <span>Proceed to Checkout &rarr;</span>
              </Link>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default CartPage;
