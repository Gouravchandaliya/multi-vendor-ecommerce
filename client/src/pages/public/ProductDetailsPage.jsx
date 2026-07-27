import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router';
import {
  fetchPublicProductBySlug,
  fetchRelatedProducts,
  resetCurrentProduct,
  selectCurrentProduct,
  selectRelatedProducts,
  selectProductLoading,
  selectProductError,
} from '../../features/product/productSlice';
import {
  fetchProductReviews,
  submitReview,
  editReview,
  removeReview,
  selectProductReviews,
  selectRatingsAverage,
  selectRatingsCount,
  selectRatingBreakdown,
  selectReviewPagination,
  selectReviewLoading,
  selectReviewSubmitting,
  selectReviewError,
  selectReviewSuccess,
  clearReviewError,
  clearReviewSuccess,
} from '../../features/review/reviewSlice';
import { addItemToCart, addGuestItem } from '../../features/cart/cartSlice';
import { toggleWishlistItem, selectWishlistProducts } from '../../features/wishlist/wishlistSlice';
import { selectIsLoggedIn, selectUser } from '../../features/auth/authSlice';
import ProductCard from '../../components/common/ProductCard';
import StarRating from '../../components/common/StarRating';
import ReviewCard from '../../components/common/ReviewCard';
import Alert from '../../components/common/Alert';
import { PageSpinner } from '../../components/common/Spinner';

const SORT_OPTIONS = [
  { key: 'recent',  label: 'Most Recent' },
  { key: 'highest', label: 'Highest Rating' },
  { key: 'lowest',  label: 'Lowest Rating' },
];

const ProductDetailsPage = () => {
  const { slug }    = useParams();
  const dispatch    = useDispatch();
  const navigate    = useNavigate();

  const isLoggedIn      = useSelector(selectIsLoggedIn);
  const currentUser     = useSelector(selectUser);
  const product         = useSelector(selectCurrentProduct);
  const relatedProducts = useSelector(selectRelatedProducts);
  const wishlist        = useSelector(selectWishlistProducts);
  const isLoading       = useSelector(selectProductLoading);
  const error           = useSelector(selectProductError);

  // Review state
  const reviews          = useSelector(selectProductReviews);
  const ratingsAverage   = useSelector(selectRatingsAverage);
  const ratingsCount     = useSelector(selectRatingsCount);
  const breakdown        = useSelector(selectRatingBreakdown);
  const reviewPagination = useSelector(selectReviewPagination);
  const isReviewLoading  = useSelector(selectReviewLoading);
  const isSubmitting     = useSelector(selectReviewSubmitting);
  const reviewError      = useSelector(selectReviewError);
  const reviewSuccess    = useSelector(selectReviewSuccess);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity]           = useState(1);
  const [cartSuccessAlert, setCartSuccessAlert] = useState('');

  // Review Form & Modal state
  const [reviewSort, setReviewSort]     = useState('recent');
  const [reviewPage, setReviewPage]     = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [formRating, setFormRating]     = useState(5);
  const [formComment, setFormComment]   = useState('');

  useEffect(() => {
    dispatch(fetchPublicProductBySlug(slug));
    dispatch(fetchRelatedProducts(slug));

    return () => {
      dispatch(resetCurrentProduct());
    };
  }, [slug, dispatch]);

  useEffect(() => {
    if (product?._id) {
      dispatch(fetchProductReviews({ productId: product._id, page: reviewPage, limit: 5, sort: reviewSort }));
    }
  }, [product?._id, reviewPage, reviewSort, dispatch]);

  if (isLoading) return <PageSpinner />;

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <Alert type="error" message={error || 'Product not found or unavailable'} />
        <Link
          to="/products"
          className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
        >
          &larr; Back to Products
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlist.some((p) => (p._id || p) === product._id);
  const hasDiscount  = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const images = product.images && product.images.length > 0 ? product.images : [];

  const handleAddToCart = () => {
    if (product.stock <= 0) return;

    if (isLoggedIn) {
      dispatch(addItemToCart({ productId: product._id, quantity }));
    } else {
      dispatch(addGuestItem({ product, quantity }));
    }

    setCartSuccessAlert(`Added ${quantity} item(s) to your cart!`);
    setTimeout(() => setCartSuccessAlert(''), 3000);
  };

  const handleWishlistToggle = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    dispatch(toggleWishlistItem(product._id));
  };

  const handleOpenEditReview = (rev) => {
    setEditingReviewId(rev._id);
    setFormRating(rev.rating);
    setFormComment(rev.comment);
    setShowReviewForm(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingReviewId) {
      dispatch(editReview({ reviewId: editingReviewId, rating: formRating, comment: formComment }))
        .unwrap()
        .then(() => {
          setShowReviewForm(false);
          setEditingReviewId(null);
          setFormComment('');
          dispatch(fetchPublicProductBySlug(slug));
          dispatch(fetchProductReviews({ productId: product._id, page: 1, sort: reviewSort }));
        });
    } else {
      dispatch(submitReview({ productId: product._id, rating: formRating, comment: formComment }))
        .unwrap()
        .then(() => {
          setShowReviewForm(false);
          setFormComment('');
          dispatch(fetchPublicProductBySlug(slug));
          dispatch(fetchProductReviews({ productId: product._id, page: 1, sort: reviewSort }));
        });
    }
  };

  const handleDeleteReview = (reviewId) => {
    if (window.confirm('Are you sure you want to delete your review?')) {
      dispatch(removeReview(reviewId))
        .unwrap()
        .then(() => {
          dispatch(fetchPublicProductBySlug(slug));
          dispatch(fetchProductReviews({ productId: product._id, page: 1, sort: reviewSort }));
        });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Navigation Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-blue-600">Products</Link>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-xs">{product.name}</span>
      </nav>

      <Alert type="error" message={error} />
      <Alert type="success" message={cartSuccessAlert} onClose={() => setCartSuccessAlert('')} />

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden flex items-center justify-center relative">
            {images.length > 0 ? (
              <img
                src={images[selectedImage] || images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-center space-y-2">
                <span className="text-5xl">📦</span>
                <p className="text-xs">No image available</p>
              </div>
            )}

            {/* Wishlist Heart Button */}
            <button
              onClick={handleWishlistToggle}
              className={`absolute top-4 right-4 p-2.5 rounded-full shadow-md backdrop-blur-md transition ${
                isWishlisted
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-white/80 text-gray-500 hover:text-red-600 hover:bg-white'
              }`}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              {isWishlisted ? '❤️' : '🤍'}
            </button>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition ${
                    selectedImage === idx ? 'border-blue-600 scale-95' : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details */}
        <div className="space-y-6">
          
          {/* Store & Category */}
          <div className="flex items-center justify-between">
            {product.store && (
              <Link
                to={`/stores/${product.store.slug}`}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-150 rounded-xl text-blue-700 text-xs font-bold hover:bg-blue-100 transition"
              >
                <span>🏪 {product.store.name}</span>
                <span className="text-[10px] text-blue-500 font-normal">Verified Seller &rarr;</span>
              </Link>
            )}
            <span className="text-xs text-gray-400 font-semibold">{product.category}</span>
          </div>

          {/* Title & Brand */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-gray-400 font-mono">Brand: {product.brand}</span>
              <span className="text-gray-300">•</span>
              
              {/* Star Rating Header */}
              <div className="flex items-center gap-1.5">
                <StarRating rating={ratingsAverage || product.ratingsAverage || 0} size="sm" readOnly />
                <span className="text-xs text-gray-500 font-bold">
                  ({ratingsCount || product.ratingsCount || 0} {ratingsCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>
          </div>

          {/* Price & Stock */}
          <div className="flex items-center justify-between border-y border-gray-100 py-4">
            <div>
              {hasDiscount ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-gray-900">${product.discountPrice}</span>
                  <span className="text-base text-gray-400 line-through">${product.price}</span>
                  <span className="px-2 py-0.5 bg-red-600 text-white font-extrabold text-xs rounded-lg">
                    -{discountPercent}% OFF
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-extrabold text-gray-900">${product.price}</span>
              )}
            </div>

            <div>
              {product.stock === 0 ? (
                <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full">
                  Out of Stock
                </span>
              ) : product.stock < 10 ? (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">
                  Low Stock ({product.stock} left)
                </span>
              ) : (
                <span className="px-3 py-1 bg-green-100 text-green-800 font-bold text-xs rounded-full">
                  In Stock ({product.stock} available)
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Quantity Selector UI */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="px-3.5 py-2 text-gray-600 hover:bg-gray-200 font-bold text-sm transition disabled:opacity-40"
                >
                  -
                </button>
                <span className="px-4 text-sm font-bold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock || 1, q + 1))}
                  disabled={quantity >= product.stock}
                  className="px-3.5 py-2 text-gray-600 hover:bg-gray-200 font-bold text-sm transition disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>🛒 Add to Cart</span>
              </button>

              <Link
                to="/cart"
                onClick={handleAddToCart}
                className="flex-1 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-center"
              >
                <span>⚡ Buy Now</span>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* ── RATINGS & CUSTOMER REVIEWS SECTION ───────────────────────────── */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-8">
        
        <div className="border-b border-gray-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Customer Reviews & Ratings</h2>
            <p className="text-xs text-gray-500 mt-0.5">Real verified purchase reviews from customers</p>
          </div>

          {isLoggedIn && (
            <button
              onClick={() => {
                setEditingReviewId(null);
                setFormRating(5);
                setFormComment('');
                setShowReviewForm(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              ✍️ Write a Review
            </button>
          )}
        </div>

        <Alert type="error" message={reviewError} onClose={() => dispatch(clearReviewError())} />
        <Alert type="success" message={reviewSuccess} onClose={() => dispatch(clearReviewSuccess())} />

        {/* Review Submission Form Modal / Drawer */}
        {showReviewForm && (
          <div className="bg-gray-50 rounded-2xl border border-blue-100 p-6 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="font-bold text-sm text-gray-900">
                {editingReviewId ? '✏️ Edit Your Review' : '✍️ Write a Verified Purchase Review'}
              </h3>
              <button
                onClick={() => setShowReviewForm(false)}
                className="text-xs text-gray-400 hover:text-gray-700 font-bold"
              >
                ✕ Cancel
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                  Select Rating
                </label>
                <StarRating
                  rating={formRating}
                  size="lg"
                  readOnly={false}
                  onRatingChange={(val) => setFormRating(val)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                  Your Review Comment
                </label>
                <textarea
                  rows={4}
                  required
                  minLength={5}
                  maxLength={1000}
                  placeholder="Share your experience with this product (build quality, performance, value)..."
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  className="w-full px-4 py-3 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
                <span className="text-[11px] text-gray-400 block text-right">
                  {formComment.length} / 1000 characters
                </span>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 bg-white border border-gray-200 text-xs font-semibold text-gray-600 rounded-xl hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : editingReviewId ? 'Update Review' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rating Breakdown Bar Chart & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-gray-50 rounded-2xl p-6 border border-gray-100">
          
          {/* Average Rating Block */}
          <div className="text-center md:text-left space-y-2">
            <span className="text-5xl font-black text-gray-900">
              {Number(ratingsAverage || 0).toFixed(1)}
            </span>
            <div className="flex items-center justify-center md:justify-start gap-1">
              <StarRating rating={ratingsAverage || 0} size="md" readOnly />
            </div>
            <p className="text-xs text-gray-500 font-semibold">
              Based on {ratingsCount || 0} verified customer {ratingsCount === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Star Percentage Bars */}
          <div className="md:col-span-2 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count   = breakdown[star] || 0;
              const percent = ratingsCount > 0 ? Math.round((count / ratingsCount) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-gray-700 w-8">{star} ★</span>
                  <div className="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-gray-400 w-12 text-right">{count} ({percent}%)</span>
                </div>
              );
            })}
          </div>

        </div>

        {/* Review Sorting Controls */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Showing {reviews.length} of {ratingsCount} Reviews
          </span>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Sort by:</span>
            <select
              value={reviewSort}
              onChange={(e) => {
                setReviewSort(e.target.value);
                setReviewPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 bg-white font-semibold focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Review List */}
        {isReviewLoading && reviews.length === 0 ? (
          <PageSpinner />
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <span className="text-4xl">💬</span>
            <h3 className="text-sm font-bold text-gray-900">No reviews yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Be the first customer to purchase and share feedback for this product!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <ReviewCard
                key={rev._id}
                review={rev}
                currentUserId={currentUser?._id}
                onEdit={handleOpenEditReview}
                onDelete={handleDeleteReview}
              />
            ))}

            {/* Pagination */}
            {reviewPagination && reviewPagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 pt-4">
                <button
                  onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                  disabled={reviewPage === 1}
                  className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="text-xs text-gray-600 font-semibold">
                  Page {reviewPagination.page} of {reviewPagination.totalPages}
                </span>
                <button
                  onClick={() => setReviewPage((p) => Math.min(reviewPagination.totalPages, p + 1))}
                  disabled={reviewPage === reviewPagination.totalPages}
                  className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((relProduct) => (
              <ProductCard key={relProduct._id} product={relProduct} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default ProductDetailsPage;
