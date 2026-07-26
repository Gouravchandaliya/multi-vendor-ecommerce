import { useState } from 'react';

const StarRating = ({
  rating = 0,
  maxStars = 5,
  size = 'md',
  readOnly = true,
  onRatingChange,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'text-sm gap-0.5',
    md: 'text-base gap-1',
    lg: 'text-2xl gap-1.5',
  };

  const handleStarClick = (val) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(val);
    }
  };

  return (
    <div className={`inline-flex items-center ${sizeClasses[size] || sizeClasses.md}`}>
      {[...Array(maxStars)].map((_, idx) => {
        const starValue = idx + 1;
        const currentActiveRating = hoverRating || rating;
        const isFilled = starValue <= Math.floor(currentActiveRating);
        const isHalf   = !isFilled && starValue === Math.ceil(currentActiveRating) && currentActiveRating % 1 !== 0;

        return (
          <button
            key={idx}
            type="button"
            disabled={readOnly}
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => !readOnly && setHoverRating(starValue)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
            className={`transition ${
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
          >
            <span
              className={
                isFilled
                  ? 'text-amber-400 font-bold'
                  : isHalf
                  ? 'text-amber-300 font-bold'
                  : 'text-gray-300'
              }
            >
              ★
            </span>
          </button>
        );
      })}

      {readOnly && (
        <span className="ml-1 font-extrabold text-gray-700 text-xs">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
