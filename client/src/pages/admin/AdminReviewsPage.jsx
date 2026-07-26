import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import {
  fetchAdminReviews,
  removeReview,
  selectAdminReviews,
  selectReviewLoading,
  selectReviewError,
  selectReviewSuccess,
  clearReviewError,
  clearReviewSuccess,
} from '../../features/review/reviewSlice';
import StarRating from '../../components/common/StarRating';
import Alert from '../../components/common/Alert';
import { PageSpinner } from '../../components/common/Spinner';

const AdminReviewsPage = () => {
  const dispatch  = useDispatch();
  const reviews   = useSelector(selectAdminReviews);
  const isLoading = useSelector(selectReviewLoading);
  const error     = useSelector(selectReviewError);
  const success   = useSelector(selectReviewSuccess);

  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  useEffect(() => {
    dispatch(fetchAdminReviews({ page, limit: 10, search }));
  }, [search, page, dispatch]);

  const handleDeleteReview = (reviewId) => {
    if (window.confirm('Admin Moderation: Are you sure you want to delete this customer review?')) {
      dispatch(removeReview(reviewId))
        .unwrap()
        .then(() => {
          dispatch(fetchAdminReviews({ page, limit: 10, search }));
        });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-gray-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Admin Review Moderation</h1>
          <p className="text-gray-500 text-sm mt-0.5">Platform-wide overview and moderation of customer reviews</p>
        </div>
        <Link
          to="/admin/dashboard"
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to Admin Dashboard
        </Link>
      </div>

      <Alert type="error" message={error} onClose={() => dispatch(clearReviewError())} />
      <Alert type="success" message={success} onClose={() => dispatch(clearReviewSuccess())} />

      {/* Search Input */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <input
          type="text"
          placeholder="Search reviews by comment text..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-md px-4 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
        />
      </div>

      {/* Reviews List */}
      {isLoading && reviews.length === 0 ? (
        <PageSpinner />
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3 shadow-sm max-w-md mx-auto">
          <span className="text-5xl">🛡️</span>
          <h2 className="text-lg font-bold text-gray-900">No reviews found</h2>
          <p className="text-xs text-gray-500">No reviews match your search query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev._id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-gray-300 transition"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-bold text-sm text-gray-900">{rev.product?.name || 'Product'}</span>
                  <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                    Store: {rev.store?.name || 'N/A'}
                  </span>
                  {rev.isVerifiedPurchase && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full">
                      ✓ Verified Purchase
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <StarRating rating={rev.rating} size="sm" readOnly />
                  <span className="text-xs text-gray-500">
                    By: <strong className="text-gray-800">{rev.user?.name}</strong> ({rev.user?.email})
                  </span>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed font-normal">{rev.comment}</p>

                <span className="text-[10px] text-gray-400 block font-mono">
                  Submitted: {new Date(rev.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-end pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                <button
                  onClick={() => handleDeleteReview(rev._id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Delete Review 🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default AdminReviewsPage;
