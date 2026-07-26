import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { addItemToCart, addGuestItem } from '../../features/cart/cartSlice';
import { toggleWishlistItem, selectWishlistProducts } from '../../features/wishlist/wishlistSlice';
import { selectIsLoggedIn } from '../../features/auth/authSlice';
import StarRating from './StarRating';

const ProductCard = ({ product }) => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const wishlist   = useSelector(selectWishlistProducts);

  const [imageError, setImageError] = useState(false);

  if (!product) return null;

  const isWishlisted = wishlist.some((p) => (p._id || p) === product._id);
  const hasDiscount  = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) return;

    if (isLoggedIn) {
      dispatch(addItemToCart({ productId: product._id, quantity: 1 }));
    } else {
      dispatch(addGuestItem({ product, quantity: 1 }));
    }
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    dispatch(toggleWishlistItem(product._id));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col overflow-hidden relative">
      
      {/* Image Container */}
      <Link to={`/products/${product.slug}`} className="relative aspect-square bg-gray-50 overflow-hidden block">
        {mainImage && !imageError ? (
          <img
            src={mainImage}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
            <span className="text-3xl">📦</span>
            <span className="text-[11px] font-medium mt-1">No Image</span>
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-red-600 text-white font-extrabold text-[11px] rounded-lg shadow-sm">
            -{discountPercent}% OFF
          </span>
        )}

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full shadow-sm backdrop-blur-md transition ${
            isWishlisted
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-white/80 text-gray-500 hover:text-red-600 hover:bg-white'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          {isWishlisted ? '❤️' : '🤍'}
        </button>
      </Link>

      {/* Card Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Store Name Link */}
          {product.store && (
            <Link
              to={`/stores/${product.store.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition block mb-1 truncate"
            >
              🏪 {product.store.name}
            </Link>
          )}

          {/* Product Name */}
          <Link to={`/products/${product.slug}`} className="block">
            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 hover:text-blue-600 transition leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Real Star Rating & Count */}
          <div className="mt-1.5 flex items-center gap-1.5">
            {product.ratingsCount > 0 ? (
              <>
                <StarRating rating={product.ratingsAverage} size="sm" readOnly />
                <span className="text-[11px] text-gray-400 font-medium">({product.ratingsCount})</span>
              </>
            ) : (
              <span className="text-[11px] text-gray-400 italic">No reviews yet</span>
            )}
          </div>
        </div>

        {/* Price & Action */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          <div>
            {hasDiscount ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-gray-900">${product.discountPrice}</span>
                <span className="text-xs text-gray-400 line-through">${product.price}</span>
              </div>
            ) : (
              <span className="text-base font-extrabold text-gray-900">${product.price}</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              product.stock <= 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
            }`}
          >
            {product.stock <= 0 ? 'Sold Out' : '+ Cart'}
          </button>
        </div>

      </div>

    </div>
  );
};

export default ProductCard;
