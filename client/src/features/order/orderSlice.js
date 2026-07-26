import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import orderService from './orderService';
import { clearCart } from '../cart/cartSlice';

const handleError = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.errors?.[0]?.msg ||
  error.message ||
  fallback;

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const initRazorpayOrder = createAsyncThunk(
  'order/initPayment',
  async (_, thunkAPI) => {
    try {
      return await orderService.createRazorpayOrder();
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to initialize payment'));
    }
  }
);

export const verifyPayment = createAsyncThunk(
  'order/verifyPayment',
  async (paymentData, thunkAPI) => {
    try {
      const createdOrder = await orderService.verifyRazorpayPayment(paymentData);
      thunkAPI.dispatch(clearCart());
      return createdOrder;
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Payment verification failed'));
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  'order/fetchMyOrders',
  async (params, thunkAPI) => {
    try {
      return await orderService.getMyOrders(params);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch orders'));
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'order/fetchById',
  async (id, thunkAPI) => {
    try {
      return await orderService.getOrderById(id);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch order details'));
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  orders: [],
  pagination: null,
  currentOrder: null,
  razorpayOrder: null,
  isProcessingPayment: false,
  isVerifyingPayment: false,
  isLoading: false,
  error: null,
  successMessage: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearOrderError: (state) => { state.error = null; },
    clearOrderSuccess: (state) => { state.successMessage = null; },
    resetCurrentOrder: (state) => { state.currentOrder = null; state.razorpayOrder = null; },
  },
  extraReducers: (builder) => {
    // Init Payment
    builder
      .addCase(initRazorpayOrder.pending, (state) => {
        state.isProcessingPayment = true;
        state.error = null;
      })
      .addCase(initRazorpayOrder.fulfilled, (state, { payload }) => {
        state.isProcessingPayment = false;
        state.razorpayOrder = payload;
      })
      .addCase(initRazorpayOrder.rejected, (state, { payload }) => {
        state.isProcessingPayment = false;
        state.error = payload;
      });

    // Verify Payment
    builder
      .addCase(verifyPayment.pending, (state) => {
        state.isVerifyingPayment = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, { payload }) => {
        state.isVerifyingPayment = false;
        state.currentOrder = payload;
        state.razorpayOrder = null;
        state.successMessage = 'Payment successful! Order placed.';
      })
      .addCase(verifyPayment.rejected, (state, { payload }) => {
        state.isVerifyingPayment = false;
        state.error = payload;
      });

    // Fetch My Orders
    builder
      .addCase(fetchMyOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, { payload }) => {
        state.isLoading  = false;
        state.orders     = payload.orders;
        state.pagination = payload.pagination;
      })
      .addCase(fetchMyOrders.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });

    // Fetch Order By ID
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, { payload }) => {
        state.isLoading    = false;
        state.currentOrder = payload;
      })
      .addCase(fetchOrderById.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });
  },
});

export const { clearOrderError, clearOrderSuccess, resetCurrentOrder } = orderSlice.actions;

// Selectors
export const selectMyOrders            = (state) => state.order.orders;
export const selectOrderPagination     = (state) => state.order.pagination;
export const selectCurrentOrder        = (state) => state.order.currentOrder;
export const selectRazorpayOrder       = (state) => state.order.razorpayOrder;
export const selectIsProcessingPayment = (state) => state.order.isProcessingPayment;
export const selectIsVerifyingPayment  = (state) => state.order.isVerifyingPayment;
export const selectOrderLoading        = (state) => state.order.isLoading;
export const selectOrderError          = (state) => state.order.error;

export default orderSlice.reducer;
