import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router';
import {
  fetchWishlist,
  removeFromWishlist,
  moveWishlistItemToCart,
  selectWishlistProducts,
  selectWishlistLoading,
  selectWishlistError,
} from '../../features/wishlist/wishlistSlice';
import { selectIsLoggedIn } from '../../features/auth/authSlice';
import Alert from '../../components/common/Alert';
import { PageSpinner } from '../../components/common/Spinner';

const WishlistPage = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const isLoggedIn = useSelector(selectIsLoggedIn);

  const products  = useSelector(selectWishlistProducts);
  const isLoading = useSelector(selectWishlistLoading);
  const error     = useSelector(selectWishlistError);

  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchWishlist());
    }
  }, [isLoggedIn, dispatch]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white rounded-3xl border border-gray-100 p-8 text-center space-y-4 shadow-sm">
        <span className="text-5xl">❤️</span>
        <h2 className="text-xl font-extrabold text-gray-900">Sign in to view your Wishlist</h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          Keep track of your favorite products across our multi-vendor marketplace by signing in.
        </p>
        <div className="flex gap-3 pt-2">
          <Link
            to="/login"
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && products.length === 0) return <PageSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-extrabold text-gray-900">Your Saved Wishlist</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {products.length === 0 ? 'Your wishlist is empty' : `Showing ${products.length} saved product(s)`}
        </p>
      </div>

      <Alert type="error" message={error} />

      {products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4 shadow-sm max-w-md mx-auto">
          <span className="text-6xl">🤍</span>
          <h2 className="text-xl font-extrabold text-gray-900">Your wishlist is empty</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Save items you like while browsing so you can easily find them later or move them to your cart.
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Explore Products &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
            const mainImage   = product.images && product.images.length > 0 ? product.images[0] : null;

            return (
              <div key={product._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col overflow-hidden">
                
                {/* Image Container */}
                <Link to={`/products/${product.slug}`} className="relative aspect-square bg-gray-50 overflow-hidden block">
                  {mainImage ? (
                    <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">📦</div>
                  )}

                  {/* Stock Status */}
                  <div className="absolute top-2.5 right-2.5">
                    {product.stock === 0 ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold text-[10px] rounded-md border border-red-200">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 font-bold text-[10px] rounded-md border border-green-200">
                        In Stock
                      </span>
                    )}
                  </div>
                </Link>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {product.store && (
                      <Link to={`/stores/${product.store.slug}`} className="text-[11px] font-semibold text-blue-600 block mb-1 truncate">
                        🏪 {product.store.name}
                      </Link>
                    )}

                    <Link to={`/products/${product.slug}`}>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 hover:text-blue-600 transition">
                        {product.name}
                      </h3>
                    </Link>
                  </div>

                  {/* Price & Actions */}
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div className="flex items-baseline gap-2">
                      {hasDiscount ? (
                        <>
                          <span className="text-base font-extrabold text-gray-900">${product.discountPrice}</span>
                          <span className="text-xs text-gray-400 line-through">${product.price}</span>
                        </>
                      ) : (
                        <span className="text-base font-extrabold text-gray-900">${product.price}</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => dispatch(moveWishlistItemToCart(product._id))}
                        disabled={product.stock === 0}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow disabled:opacity-50 transition"
                      >
                        Move to Cart
                      </button>
                      <button
                        onClick={() => dispatch(removeFromWishlist(product._id))}
                        className="p-2 border border-gray-200 hover:bg-red-50 hover:border-red-200 text-red-600 rounded-xl text-xs transition"
                        title="Remove from wishlist"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default WishlistPage;
