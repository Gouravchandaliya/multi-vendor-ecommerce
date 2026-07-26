import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import {
  fetchMyReviews,
  editReview,
  removeReview,
  selectMyReviews,
  selectMyPagination,
  selectReviewLoading,
  selectReviewError,
  selectReviewSuccess,
  clearReviewError,
  clearReviewSuccess,
} from '../../features/review/reviewSlice';
import StarRating from '../../components/common/StarRating';
import Alert from '../../components/common/Alert';
import { PageSpinner } from '../../components/common/Spinner';

const MyReviewsPage = () => {
  const dispatch   = useDispatch();
  const reviews    = useSelector(selectMyReviews);
  const pagination = useSelector(selectMyPagination);
  const isLoading  = useSelector(selectReviewLoading);
  const error      = useSelector(selectReviewError);
  const success    = useSelector(selectReviewSuccess);

  const [page, setPage] = useState(1);
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating]       = useState(5);
  const [editComment, setEditComment]     = useState('');

  useEffect(() => {
    dispatch(fetchMyReviews({ page, limit: 10 }));
  }, [page, dispatch]);

  const handleStartEdit = (rev) => {
    setEditingReview(rev);
    setEditRating(rev.rating);
    setEditComment(rev.comment);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingReview) return;
    dispatch(editReview({ reviewId: editingReview._id, rating: editRating, comment: editComment }))
      .unwrap()
      .then(() => {
        setEditingReview(null);
        dispatch(fetchMyReviews({ page, limit: 10 }));
      });
  };

  const handleDelete = (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      dispatch(removeReview(reviewId))
        .unwrap()
        .then(() => {
          dispatch(fetchMyReviews({ page, limit: 10 }));
        });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-gray-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">My Reviews</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage product reviews you have written</p>
        </div>
        <Link
          to="/buyer/dashboard"
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to Account Dashboard
        </Link>
      </div>

      <Alert type="error" message={error} onClose={() => dispatch(clearReviewError())} />
      <Alert type="success" message={success} onClose={() => dispatch(clearReviewSuccess())} />

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="bg-gray-50 rounded-2xl border border-blue-200 p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3">
            <h3 className="font-bold text-sm text-gray-900">✏️ Edit Your Review</h3>
            <button
              onClick={() => setEditingReview(null)}
              className="text-xs text-gray-400 font-bold hover:text-gray-700"
            >
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Rating
              </label>
              <StarRating
                rating={editRating}
                size="lg"
                readOnly={false}
                onRatingChange={(val) => setEditRating(val)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Comment
              </label>
              <textarea
                rows={3}
                required
                minLength={5}
                maxLength={1000}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                className="w-full px-4 py-3 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="px-4 py-2 bg-white border border-gray-200 text-xs font-semibold text-gray-600 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Update Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {isLoading && reviews.length === 0 ? (
        <PageSpinner />
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3 shadow-sm max-w-md mx-auto">
          <span className="text-5xl">⭐</span>
          <h2 className="text-lg font-bold text-gray-900">No reviews written yet</h2>
          <p className="text-xs text-gray-500">
            Reviews you submit for delivered order items will appear here.
          </p>
          <Link
            to="/account/orders"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow hover:bg-blue-700 transition"
          >
            View Your Orders
          </Link>
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
                    <Link
                      to={`/products/${prod.slug}`}
                      className="font-bold text-sm text-gray-900 hover:text-blue-600 transition"
                    >
                      {prod.name || 'Product'}
                    </Link>

                    <div className="flex items-center gap-2">
                      <StarRating rating={rev.rating} size="sm" readOnly />
                      {rev.isVerifiedPurchase && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full">
                          ✓ Verified Purchase
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-700 pt-1 leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-gray-400 block pt-1">
                      Reviewed on {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                  <button
                    onClick={() => handleStartEdit(rev)}
                    className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(rev._id)}
                    className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition"
                  >
                    Delete
                  </button>
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

export default MyReviewsPage;
