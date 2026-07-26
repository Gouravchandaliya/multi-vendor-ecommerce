import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reviewService from './reviewService';

const handleError = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.errors?.[0]?.msg ||
  error.message ||
  fallback;

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchProductReviews = createAsyncThunk(
  'review/fetchProductReviews',
  async (params, thunkAPI) => {
    try {
      return await reviewService.getProductReviews(params);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch product reviews'));
    }
  }
);

export const submitReview = createAsyncThunk(
  'review/submitReview',
  async (payload, thunkAPI) => {
    try {
      return await reviewService.createReview(payload);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to submit review'));
    }
  }
);

export const editReview = createAsyncThunk(
  'review/editReview',
  async (payload, thunkAPI) => {
    try {
      return await reviewService.updateReview(payload);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to edit review'));
    }
  }
);

export const removeReview = createAsyncThunk(
  'review/removeReview',
  async (reviewId, thunkAPI) => {
    try {
      await reviewService.deleteReview(reviewId);
      return reviewId;
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to delete review'));
    }
  }
);

export const fetchMyReviews = createAsyncThunk(
  'review/fetchMyReviews',
  async (params, thunkAPI) => {
    try {
      return await reviewService.getMyReviews(params);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch your reviews'));
    }
  }
);

export const fetchSellerReviews = createAsyncThunk(
  'review/fetchSellerReviews',
  async (params, thunkAPI) => {
    try {
      return await reviewService.getSellerReviews(params);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch seller reviews'));
    }
  }
);

export const fetchAdminReviews = createAsyncThunk(
  'review/fetchAdminReviews',
  async (params, thunkAPI) => {
    try {
      return await reviewService.getAdminReviews(params);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch admin reviews'));
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  productReviews: [],
  ratingsAverage: 0,
  ratingsCount: 0,
  breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  pagination: null,

  myReviews: [],
  myPagination: null,

  sellerReviews: [],
  sellerPagination: null,

  adminReviews: [],
  adminPagination: null,

  isLoading: false,
  isSubmitting: false,
  error: null,
  successMessage: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    clearReviewError: (state) => { state.error = null; },
    clearReviewSuccess: (state) => { state.successMessage = null; },
  },
  extraReducers: (builder) => {
    // Product Reviews
    builder
      .addCase(fetchProductReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, { payload }) => {
        state.isLoading      = false;
        state.productReviews = payload.reviews;
        state.ratingsAverage = payload.ratingsAverage;
        state.ratingsCount   = payload.ratingsCount;
        state.breakdown      = payload.breakdown;
        state.pagination     = payload.pagination;
      })
      .addCase(fetchProductReviews.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });

    // Submit Review
    builder
      .addCase(submitReview.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitReview.fulfilled, (state, { payload }) => {
        state.isSubmitting = false;
        state.productReviews.unshift(payload);
        state.successMessage = 'Review submitted successfully!';
      })
      .addCase(submitReview.rejected, (state, { payload }) => {
        state.isSubmitting = false;
        state.error        = payload;
      });

    // Edit Review
    builder
      .addCase(editReview.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(editReview.fulfilled, (state, { payload }) => {
        state.isSubmitting = false;
        const idx = state.productReviews.findIndex((r) => r._id === payload._id);
        if (idx > -1) state.productReviews[idx] = payload;
        const myIdx = state.myReviews.findIndex((r) => r._id === payload._id);
        if (myIdx > -1) state.myReviews[myIdx] = payload;
        state.successMessage = 'Review updated successfully!';
      })
      .addCase(editReview.rejected, (state, { payload }) => {
        state.isSubmitting = false;
        state.error        = payload;
      });

    // Remove Review
    builder
      .addCase(removeReview.fulfilled, (state, { payload: reviewId }) => {
        state.productReviews = state.productReviews.filter((r) => r._id !== reviewId);
        state.myReviews      = state.myReviews.filter((r) => r._id !== reviewId);
        state.sellerReviews  = state.sellerReviews.filter((r) => r._id !== reviewId);
        state.adminReviews   = state.adminReviews.filter((r) => r._id !== reviewId);
        state.successMessage = 'Review deleted successfully.';
      });

    // My Reviews
    builder
      .addCase(fetchMyReviews.fulfilled, (state, { payload }) => {
        state.myReviews    = payload.reviews;
        state.myPagination = payload.pagination;
      });

    // Seller Reviews
    builder
      .addCase(fetchSellerReviews.fulfilled, (state, { payload }) => {
        state.sellerReviews    = payload.reviews;
        state.sellerPagination = payload.pagination;
      });

    // Admin Reviews
    builder
      .addCase(fetchAdminReviews.fulfilled, (state, { payload }) => {
        state.adminReviews    = payload.reviews;
        state.adminPagination = payload.pagination;
      });
  },
});

export const { clearReviewError, clearReviewSuccess } = reviewSlice.actions;

// Selectors
export const selectProductReviews   = (state) => state.review.productReviews;
export const selectRatingsAverage   = (state) => state.review.ratingsAverage;
export const selectRatingsCount     = (state) => state.review.ratingsCount;
export const selectRatingBreakdown  = (state) => state.review.breakdown;
export const selectReviewPagination = (state) => state.review.pagination;
export const selectMyReviews        = (state) => state.review.myReviews;
export const selectMyPagination     = (state) => state.review.myPagination;
export const selectSellerReviews    = (state) => state.review.sellerReviews;
export const selectSellerPagination  = (state) => state.review.sellerPagination;
export const selectAdminReviews     = (state) => state.review.adminReviews;
export const selectAdminPagination   = (state) => state.review.adminPagination;
export const selectReviewLoading    = (state) => state.review.isLoading;
export const selectReviewSubmitting = (state) => state.review.isSubmitting;
export const selectReviewError      = (state) => state.review.error;
export const selectReviewSuccess    = (state) => state.review.successMessage;

export default reviewSlice.reducer;
