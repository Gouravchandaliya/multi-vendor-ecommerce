import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import sellerOrderService from './sellerOrderService';

const handleError = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.errors?.[0]?.msg ||
  error.message ||
  fallback;

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchSellerOrders = createAsyncThunk(
  'sellerOrder/fetchList',
  async (params, thunkAPI) => {
    try {
      return await sellerOrderService.getSellerOrders(params);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch seller orders'));
    }
  }
);

export const fetchSellerOrderById = createAsyncThunk(
  'sellerOrder/fetchById',
  async (orderId, thunkAPI) => {
    try {
      return await sellerOrderService.getSellerOrderById(orderId);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch seller order details'));
    }
  }
);

export const updateOrderStatusThunk = createAsyncThunk(
  'sellerOrder/updateStatus',
  async (payload, thunkAPI) => {
    try {
      return await sellerOrderService.updateSellerOrderStatus(payload);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to update order status'));
    }
  }
);

export const fetchSellerMetrics = createAsyncThunk(
  'sellerOrder/fetchMetrics',
  async (_, thunkAPI) => {
    try {
      return await sellerOrderService.getSellerMetrics();
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch seller metrics'));
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  orders: [],
  pagination: null,
  currentOrder: null,
  metrics: null,
  isLoading: false,
  isUpdatingStatus: false,
  error: null,
  successMessage: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const sellerOrderSlice = createSlice({
  name: 'sellerOrder',
  initialState,
  reducers: {
    clearSellerOrderError: (state) => { state.error = null; },
    clearSellerOrderSuccess: (state) => { state.successMessage = null; },
    resetCurrentSellerOrder: (state) => { state.currentOrder = null; },
  },
  extraReducers: (builder) => {
    // List
    builder
      .addCase(fetchSellerOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSellerOrders.fulfilled, (state, { payload }) => {
        state.isLoading  = false;
        state.orders     = payload.orders;
        state.pagination = payload.pagination;
      })
      .addCase(fetchSellerOrders.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });

    // Single Details
    builder
      .addCase(fetchSellerOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSellerOrderById.fulfilled, (state, { payload }) => {
        state.isLoading    = false;
        state.currentOrder = payload;
      })
      .addCase(fetchSellerOrderById.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });

    // Update Status
    builder
      .addCase(updateOrderStatusThunk.pending, (state) => {
        state.isUpdatingStatus = true;
        state.error = null;
      })
      .addCase(updateOrderStatusThunk.fulfilled, (state, { payload }) => {
        state.isUpdatingStatus = false;
        state.currentOrder     = payload;
        const idx = state.orders.findIndex((o) => o._id === payload._id);
        if (idx > -1) {
          state.orders[idx] = payload;
        }
        state.successMessage = 'Order status updated successfully.';
      })
      .addCase(updateOrderStatusThunk.rejected, (state, { payload }) => {
        state.isUpdatingStatus = false;
        state.error            = payload;
      });

    // Metrics
    builder
      .addCase(fetchSellerMetrics.fulfilled, (state, { payload }) => {
        state.metrics = payload;
      });
  },
});

export const { clearSellerOrderError, clearSellerOrderSuccess, resetCurrentSellerOrder } = sellerOrderSlice.actions;

// Selectors
export const selectSellerOrders          = (state) => state.sellerOrder.orders;
export const selectSellerOrderPagination = (state) => state.sellerOrder.pagination;
export const selectCurrentSellerOrder    = (state) => state.sellerOrder.currentOrder;
export const selectSellerMetricsData     = (state) => state.sellerOrder.metrics;
export const selectSellerOrderLoading    = (state) => state.sellerOrder.isLoading;
export const selectIsUpdatingStatus      = (state) => state.sellerOrder.isUpdatingStatus;
export const selectSellerOrderError      = (state) => state.sellerOrder.error;
export const selectSellerOrderSuccess    = (state) => state.sellerOrder.successMessage;

export default sellerOrderSlice.reducer;
