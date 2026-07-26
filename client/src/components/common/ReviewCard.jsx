import StarRating from './StarRating';

const ReviewCard = ({ review, currentUserId, onEdit, onDelete }) => {
  if (!review) return null;

  const isOwner = currentUserId && review.user && (review.user._id === currentUserId || review.user === currentUserId);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3 hover:border-gray-300 transition">
      
      {/* Header: User Avatar/Name, Rating & Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-extrabold text-sm uppercase">
            {review.user?.name ? review.user.name.charAt(0) : 'U'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900">
                {review.user?.name || 'Verified Customer'}
              </span>
              {review.isVerifiedPurchase && (
                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                  ✓ Verified Purchase
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              {new Date(review.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Edit / Delete for Owner */}
        {isOwner && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(review)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(review._id)}
                className="text-xs font-semibold text-red-600 hover:text-red-800 transition"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Star Rating */}
      <StarRating rating={review.rating} size="sm" readOnly />

      {/* Review Comment */}
      <p className="text-xs text-gray-700 leading-relaxed font-normal">
        {review.comment}
      </p>

    </div>
  );
};

export default ReviewCard;
