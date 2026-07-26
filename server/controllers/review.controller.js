const Review       = require('../models/Review.model');
const Product      = require('../models/Product.model');
const Order        = require('../models/Order.model');
const Store        = require('../models/Store.model');
const ApiError     = require('../utils/ApiError');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── Create Review ───────────────────────────────────────────────────────────
const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  // 1. Input Validation
  if (!rating || Number(rating) < 1 || Number(rating) > 5) {
    throw new ApiError(400, 'Rating must be an integer between 1 and 5');
  }
  if (!comment || comment.trim().length < 5 || comment.trim().length > 1000) {
    throw new ApiError(400, 'Comment must be between 5 and 1000 characters');
  }

  // 2. Product Existence
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  // 3. Unique Review Check
  const existingReview = await Review.findOne({ user: req.user._id, product: productId });
  if (existingReview) {
    throw new ApiError(400, 'You have already reviewed this product. You can update your existing review.');
  }

  // 4. Verified Purchase & Delivered Status Enforcement
  const buyerOrders = await Order.find({
    buyer: req.user._id,
    paymentStatus: 'paid',
    'items.product': productId,
  });

  let matchingOrder = null;
  let matchingItem  = null;

  for (const ord of buyerOrders) {
    const item = ord.items.find(
      (i) => i.product.toString() === productId.toString() && i.status === 'delivered'
    );
    if (item) {
      matchingOrder = ord;
      matchingItem  = item;
      break;
    }
  }

  if (!matchingOrder || !matchingItem) {
    throw new ApiError(
      403,
      'Only customers who have purchased and received this product can write a review.'
    );
  }

  // 5. Create Review Document (Backend controls isVerifiedPurchase)
  const review = await Review.create({
    user: req.user._id,
    product: productId,
    store: matchingItem.store,
    order: matchingOrder._id,
    rating: Number(rating),
    comment: comment.trim(),
    isVerifiedPurchase: true,
  });

  // 6. Recalculate Product Ratings
  await Review.calcAverageRating(productId);

  const populatedReview = await Review.findById(review._id).populate('user', 'name');

  return res.status(201).json(
    new ApiResponse(201, { review: populatedReview }, 'Review submitted successfully')
  );
});

// ─── Get Product Reviews (Public with Pagination & Breakdown) ────────────────
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 5, sort = 'recent' } = req.query;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const skip = (Number(page) - 1) * Number(limit);

  // Sorting logic
  let sortCriteria = { createdAt: -1 };
  if (sort === 'highest') sortCriteria = { rating: -1, createdAt: -1 };
  if (sort === 'lowest')  sortCriteria = { rating: 1, createdAt: -1 };

  const totalReviews = await Review.countDocuments({ product: productId });
  const reviews = await Review.find({ product: productId })
    .populate('user', 'name')
    .sort(sortCriteria)
    .skip(skip)
    .limit(Number(limit));

  // Calculate Star Breakdown Stats (5, 4, 3, 2, 1)
  const breakdownRaw = await Review.aggregate([
    { $match: { product: product._id } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  breakdownRaw.forEach((item) => {
    if (breakdown[item._id] !== undefined) {
      breakdown[item._id] = item.count;
    }
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        ratingsAverage: product.ratingsAverage || 0,
        ratingsCount: product.ratingsCount || 0,
        breakdown,
        pagination: {
          total: totalReviews,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalReviews / Number(limit)) || 1,
        },
      },
      'Product reviews fetched successfully'
    )
  );
});

// ─── Update Review (Ownership Verified) ──────────────────────────────────────
const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  if (review.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied. You can edit only your own review.');
  }

  if (rating) {
    if (Number(rating) < 1 || Number(rating) > 5) {
      throw new ApiError(400, 'Rating must be an integer between 1 and 5');
    }
    review.rating = Number(rating);
  }

  if (comment) {
    if (comment.trim().length < 5 || comment.trim().length > 1000) {
      throw new ApiError(400, 'Comment must be between 5 and 1000 characters');
    }
    review.comment = comment.trim();
  }

  await review.save();

  // Recalculate Product Ratings
  await Review.calcAverageRating(review.product);

  const updatedReview = await Review.findById(review._id).populate('user', 'name');

  return res.status(200).json(
    new ApiResponse(200, { review: updatedReview }, 'Review updated successfully')
  );
});

// ─── Delete Review (Owner or Admin) ──────────────────────────────────────────
const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Access denied. You can delete only your own review.');
  }

  const productId = review.product;
  await Review.findByIdAndDelete(reviewId);

  // Recalculate Product Ratings
  await Review.calcAverageRating(productId);

  return res.status(200).json(new ApiResponse(200, {}, 'Review deleted successfully'));
});

// ─── Get Buyer's Submitted Reviews ───────────────────────────────────────────
const getMyReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const total = await Review.countDocuments({ user: req.user._id });
  const reviews = await Review.find({ user: req.user._id })
    .populate('product', 'name slug images price brand')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      'My reviews fetched successfully'
    )
  );
});

// ─── Seller View Product Reviews ─────────────────────────────────────────────
const getSellerProductReviews = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ seller: req.user._id });
  if (!store) throw new ApiError(403, 'Seller store not found');

  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const total = await Review.countDocuments({ store: store._id });
  const reviews = await Review.find({ store: store._id })
    .populate('user', 'name')
    .populate('product', 'name slug images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      'Seller product reviews fetched successfully'
    )
  );
});

// ─── Admin View All Reviews ──────────────────────────────────────────────────
const getAdminReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  let query = {};
  if (search) {
    query.comment = { $regex: search.trim(), $options: 'i' };
  }

  const total = await Review.countDocuments(query);
  const reviews = await Review.find(query)
    .populate('user', 'name email')
    .populate('product', 'name slug')
    .populate('store', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      'Admin reviews list fetched'
    )
  );
});

module.exports = {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getMyReviews,
  getSellerProductReviews,
  getAdminReviews,
};
