import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartService from './cartService';

const GUEST_CART_KEY = 'marketx_guest_cart';

const getGuestCartStorage = () => {
  try {
    const data = localStorage.getItem(GUEST_CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveGuestCartStorage = (items) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save guest cart to storage:', e);
  }
};

const clearGuestCartStorage = () => {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch (e) {
    console.error('Failed to clear guest cart storage:', e);
  }
};

const handleError = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.errors?.[0]?.msg ||
  error.message ||
  fallback;

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, thunkAPI) => {
    try {
      return await cartService.getCart();
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch cart'));
    }
  }
);

export const addItemToCart = createAsyncThunk(
  'cart/addItem',
  async ({ productId, quantity = 1 }, thunkAPI) => {
    try {
      return await cartService.addToCart({ productId, quantity });
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to add item to cart'));
    }
  }
);

export const updateCartQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ productId, quantity }, thunkAPI) => {
    try {
      return await cartService.updateCartItemQuantity({ productId, quantity });
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to update item quantity'));
    }
  }
);

export const removeCartItem = createAsyncThunk(
  'cart/removeItem',
  async (productId, thunkAPI) => {
    try {
      return await cartService.removeCartItem(productId);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to remove item'));
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clear',
  async (_, thunkAPI) => {
    try {
      return await cartService.clearCart();
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to clear cart'));
    }
  }
);

export const mergeGuestCartThunk = createAsyncThunk(
  'cart/mergeGuest',
  async (_, thunkAPI) => {
    try {
      const guestItems = getGuestCartStorage().map((item) => ({
        productId: item.product._id || item.productId,
        quantity: item.quantity,
      }));

      if (guestItems.length === 0) {
        return await cartService.getCart();
      }

      const cart = await cartService.mergeGuestCart(guestItems);
      clearGuestCartStorage();
      return cart;
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to merge guest cart'));
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  cart: null,
  guestItems: getGuestCartStorage(),
  isLoading: false,
  isSubmitting: false,
  error: null,
  successMessage: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartError: (state) => { state.error = null; },
    clearCartSuccess: (state) => { state.successMessage = null; },
    
    // Guest Cart Local Actions
    addGuestItem: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const idx = state.guestItems.findIndex(
        (i) => (i.product._id || i.productId) === (product._id || product.productId)
      );

      if (idx > -1) {
        const targetQty = Math.min(product.stock || 99, state.guestItems[idx].quantity + quantity);
        state.guestItems[idx].quantity = targetQty;
      } else {
        state.guestItems.push({
          productId: product._id,
          product,
          quantity: Math.min(product.stock || 99, quantity),
        });
      }

      saveGuestCartStorage(state.guestItems);
      state.successMessage = 'Added to guest cart.';
    },

    updateGuestQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const idx = state.guestItems.findIndex(
        (i) => (i.product._id || i.productId) === productId
      );

      if (idx > -1 && quantity >= 1) {
        const maxStock = state.guestItems[idx].product.stock || 99;
        state.guestItems[idx].quantity = Math.min(maxStock, quantity);
        saveGuestCartStorage(state.guestItems);
      }
    },

    removeGuestItem: (state, action) => {
      const productId = action.payload;
      state.guestItems = state.guestItems.filter(
        (i) => (i.product._id || i.productId) !== productId
      );
      saveGuestCartStorage(state.guestItems);
      state.successMessage = 'Item removed from guest cart.';
    },

    clearGuestItems: (state) => {
      state.guestItems = [];
      clearGuestCartStorage();
    },
  },

  extraReducers: (builder) => {
    // Fetch Cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.cart = payload;
      })
      .addCase(fetchCart.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      });

    // Add Item
    builder
      .addCase(addItemToCart.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(addItemToCart.fulfilled, (state, { payload }) => {
        state.isSubmitting = false;
        state.cart = payload;
        state.successMessage = 'Item added to cart.';
      })
      .addCase(addItemToCart.rejected, (state, { payload }) => {
        state.isSubmitting = false;
        state.error = payload;
      });

    // Update Quantity
    builder
      .addCase(updateCartQuantity.fulfilled, (state, { payload }) => {
        state.cart = payload;
      })
      .addCase(updateCartQuantity.rejected, (state, { payload }) => {
        state.error = payload;
      });

    // Remove Item
    builder
      .addCase(removeCartItem.fulfilled, (state, { payload }) => {
        state.cart = payload;
        state.successMessage = 'Item removed from cart.';
      })
      .addCase(removeCartItem.rejected, (state, { payload }) => {
        state.error = payload;
      });

    // Clear Cart
    builder
      .addCase(clearCart.fulfilled, (state, { payload }) => {
        state.cart = payload;
        state.successMessage = 'Cart cleared.';
      })
      .addCase(clearCart.rejected, (state, { payload }) => {
        state.error = payload;
      });

    // Merge Guest Cart
    builder
      .addCase(mergeGuestCartThunk.fulfilled, (state, { payload }) => {
        state.cart = payload;
        state.guestItems = [];
      });
  },
});

export const {
  clearCartError,
  clearCartSuccess,
  addGuestItem,
  updateGuestQuantity,
  removeGuestItem,
  clearGuestItems,
} = cartSlice.actions;

// Selectors
export const selectCart            = (state) => state.cart.cart;
export const selectGuestItems      = (state) => state.cart.guestItems;
export const selectCartLoading     = (state) => state.cart.isLoading;
export const selectCartSubmitting  = (state) => state.cart.isSubmitting;
export const selectCartError        = (state) => state.cart.error;
export const selectCartSuccess      = (state) => state.cart.successMessage;

// Computed Total Item Count (Logged in or Guest)
export const selectCartItemCount = (state, isLoggedIn) => {
  if (isLoggedIn && state.cart.cart) {
    return state.cart.cart.itemCount || 0;
  }
  return state.cart.guestItems.reduce((acc, item) => acc + item.quantity, 0);
};

export default cartSlice.reducer;
