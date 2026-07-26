import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import {
  fetchSellerReviews,
  selectSellerReviews,
  selectSellerPagination,
  selectReviewLoading,
  selectReviewError,
} from '../../features/review/reviewSlice';
import StarRating from '../../components/common/StarRating';
import Alert from '../../components/common/Alert';
import { PageSpinner } from '../../components/common/Spinner';

const SellerReviewsPage = () => {
  const dispatch   = useDispatch();
  const reviews    = useSelector(selectSellerReviews);
  const pagination = useSelector(selectSellerPagination);
  const isLoading  = useSelector(selectReviewLoading);
  const error      = useSelector(selectReviewError);

  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchSellerReviews({ page, limit: 10 }));
  }, [page, dispatch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-gray-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Store Product Reviews</h1>
          <p className="text-gray-500 text-sm mt-0.5">Customer feedback for products sold by your store</p>
        </div>
        <Link
          to="/seller/dashboard"
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to Seller Dashboard
        </Link>
      </div>

      <Alert type="error" message={error} />

      {/* Reviews List */}
      {isLoading && reviews.length === 0 ? (
        <PageSpinner />
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3 shadow-sm max-w-md mx-auto">
          <span className="text-5xl">💬</span>
          <h2 className="text-lg font-bold text-gray-900">No store reviews yet</h2>
          <p className="text-xs text-gray-500">
            Reviews left by customers for your store products will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const prod = rev.product || {};
            const mainImg = prod.images && prod.images.length > 0 ? prod.images[0] : null;

            return (
              <div
                key={rev._id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-gray-300 transition"
              >
                <div className="flex items-start gap-4 flex-1">
                  {mainImg ? (
                    <img src={mainImg} alt={prod.name} className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center text-2xl border">📦</div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/products/${prod.slug}`}
                        className="font-bold text-sm text-gray-900 hover:text-blue-600 transition"
                      >
                        {prod.name || 'Product'}
                      </Link>
                      {rev.isVerifiedPurchase && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full">
                          ✓ Verified Purchase
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <StarRating rating={rev.rating} size="sm" readOnly />
                      <span className="text-xs text-gray-500 font-semibold">
                        Customer: <strong className="text-gray-800">{rev.user?.name || 'Verified Customer'}</strong>
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 pt-1 leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-gray-400 block pt-1">
                      Submitted on {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
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

export default SellerReviewsPage;
