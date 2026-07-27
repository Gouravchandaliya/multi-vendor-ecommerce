import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminAnalyticsService from './adminAnalyticsService';

const handleError = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.errors?.[0]?.msg ||
  error.message ||
  fallback;

export const fetchAdminAnalytics = createAsyncThunk(
  'adminAnalytics/fetch',
  async (range = '30d', thunkAPI) => {
    try {
      return await adminAnalyticsService.getAdminAnalytics(range);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch admin analytics'));
    }
  }
);

const initialState = {
  analyticsData: null,
  range: '30d',
  isLoading: false,
  error: null,
};

const adminAnalyticsSlice = createSlice({
  name: 'adminAnalytics',
  initialState,
  reducers: {
    setAdminRange: (state, action) => {
      state.range = action.payload;
    },
    clearAdminAnalyticsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchAdminAnalytics.fulfilled, (state, { payload }) => {
        state.isLoading     = false;
        state.analyticsData = payload;
      })
      .addCase(fetchAdminAnalytics.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });
  },
});

export const { setAdminRange, clearAdminAnalyticsError } = adminAnalyticsSlice.actions;

export const selectAdminAnalyticsData    = (state) => state.adminAnalytics.analyticsData;
export const selectAdminAnalyticsRange   = (state) => state.adminAnalytics.range;
export const selectAdminAnalyticsLoading = (state) => state.adminAnalytics.isLoading;
export const selectAdminAnalyticsError   = (state) => state.adminAnalytics.error;

export default adminAnalyticsSlice.reducer;
