import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import wishlistService from './wishlistService';
import { fetchCart } from '../cart/cartSlice';

const handleError = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.errors?.[0]?.msg ||
  error.message ||
  fallback;

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async (_, thunkAPI) => {
    try {
      return await wishlistService.getWishlist();
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch wishlist'));
    }
  }
);

export const toggleWishlistItem = createAsyncThunk(
  'wishlist/toggle',
  async (productId, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const existing = state.wishlist.products.some(
        (p) => p._id === productId || p === productId
      );

      if (existing) {
        return await wishlistService.removeFromWishlist(productId);
      } else {
        return await wishlistService.addToWishlist(productId);
      }
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to update wishlist'));
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/remove',
  async (productId, thunkAPI) => {
    try {
      return await wishlistService.removeFromWishlist(productId);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to remove from wishlist'));
    }
  }
);

export const moveWishlistItemToCart = createAsyncThunk(
  'wishlist/moveToCart',
  async (productId, thunkAPI) => {
    try {
      const res = await wishlistService.moveToCart(productId);
      thunkAPI.dispatch(fetchCart());
      return res.wishlist;
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to move item to cart'));
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  wishlist: null,
  products: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  successMessage: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlistError: (state) => { state.error = null; },
    clearWishlistSuccess: (state) => { state.successMessage = null; },
    resetWishlist: (state) => {
      state.wishlist = null;
      state.products = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch Wishlist
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.wishlist  = payload;
        state.products  = payload.products || [];
      })
      .addCase(fetchWishlist.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });

    // Toggle Wishlist
    builder
      .addCase(toggleWishlistItem.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(toggleWishlistItem.fulfilled, (state, { payload }) => {
        state.isSubmitting = false;
        state.wishlist  = payload;
        state.products  = payload.products || [];
        state.successMessage = 'Wishlist updated.';
      })
      .addCase(toggleWishlistItem.rejected, (state, { payload }) => {
        state.isSubmitting = false;
        state.error     = payload;
      });

    // Remove from Wishlist
    builder
      .addCase(removeFromWishlist.fulfilled, (state, { payload }) => {
        state.wishlist = payload;
        state.products = payload.products || [];
        state.successMessage = 'Item removed from wishlist.';
      });

    // Move to Cart
    builder
      .addCase(moveWishlistItemToCart.fulfilled, (state, { payload }) => {
        state.wishlist = payload;
        state.products = payload.products || [];
        state.successMessage = 'Moved product to cart.';
      })
      .addCase(moveWishlistItemToCart.rejected, (state, { payload }) => {
        state.error = payload;
      });
  },
});

export const { clearWishlistError, clearWishlistSuccess, resetWishlist } = wishlistSlice.actions;

// Selectors
export const selectWishlistProducts = (state) => state.wishlist.products;
export const selectWishlistCount    = (state) => state.wishlist.products.length;
export const selectWishlistLoading  = (state) => state.wishlist.isLoading;
export const selectWishlistError    = (state) => state.wishlist.error;

export default wishlistSlice.reducer;
