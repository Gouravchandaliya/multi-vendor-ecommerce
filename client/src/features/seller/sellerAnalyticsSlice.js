import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import sellerAnalyticsService from './sellerAnalyticsService';

const handleError = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.errors?.[0]?.msg ||
  error.message ||
  fallback;

export const fetchSellerAnalytics = createAsyncThunk(
  'sellerAnalytics/fetch',
  async (range = '30d', thunkAPI) => {
    try {
      return await sellerAnalyticsService.getSellerAnalytics(range);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch seller analytics'));
    }
  }
);

const initialState = {
  analyticsData: null,
  range: '30d',
  isLoading: false,
  error: null,
};

const sellerAnalyticsSlice = createSlice({
  name: 'sellerAnalytics',
  initialState,
  reducers: {
    setRange: (state, action) => {
      state.range = action.payload;
    },
    clearAnalyticsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchSellerAnalytics.fulfilled, (state, { payload }) => {
        state.isLoading     = false;
        state.analyticsData = payload;
      })
      .addCase(fetchSellerAnalytics.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });
  },
});

export const { setRange, clearAnalyticsError } = sellerAnalyticsSlice.actions;

export const selectSellerAnalyticsData    = (state) => state.sellerAnalytics.analyticsData;
export const selectSellerAnalyticsRange   = (state) => state.sellerAnalytics.range;
export const selectSellerAnalyticsLoading = (state) => state.sellerAnalytics.isLoading;
export const selectSellerAnalyticsError   = (state) => state.sellerAnalytics.error;

export default sellerAnalyticsSlice.reducer;
