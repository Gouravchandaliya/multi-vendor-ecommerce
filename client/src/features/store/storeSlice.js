import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import storeService from './storeService';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

const handleError = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.errors?.[0]?.msg ||
  error.message ||
  fallback;

export const createStore = createAsyncThunk(
  'store/create',
  async (storeData, thunkAPI) => {
    try { return await storeService.createStore(storeData); }
    catch (e) { return thunkAPI.rejectWithValue(handleError(e, 'Failed to create store')); }
  }
);

export const fetchMyStore = createAsyncThunk(
  'store/fetchMy',
  async (_, thunkAPI) => {
    try { return await storeService.getMyStore(); }
    catch (e) {
      if (e.response?.status === 404) return thunkAPI.rejectWithValue('NO_STORE');
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch store'));
    }
  }
);

export const updateMyStore = createAsyncThunk(
  'store/updateMy',
  async (storeData, thunkAPI) => {
    try { return await storeService.updateMyStore(storeData); }
    catch (e) { return thunkAPI.rejectWithValue(handleError(e, 'Failed to update store')); }
  }
);

export const fetchAllStores = createAsyncThunk(
  'store/fetchAll',
  async (params, thunkAPI) => {
    try { return await storeService.getAllStores(params); }
    catch (e) { return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch stores')); }
  }
);

export const changeStoreStatus = createAsyncThunk(
  'store/changeStatus',
  async ({ id, status, rejectionReason }, thunkAPI) => {
    try { return await storeService.updateStoreStatus({ id, status, rejectionReason }); }
    catch (e) { return thunkAPI.rejectWithValue(handleError(e, 'Failed to update status')); }
  }
);

export const approveStoreAction = createAsyncThunk(
  'store/approve',
  async (id, thunkAPI) => {
    try { return await storeService.approveStore(id); }
    catch (e) { return thunkAPI.rejectWithValue(handleError(e, 'Failed to approve store')); }
  }
);

export const rejectStoreAction = createAsyncThunk(
  'store/reject',
  async ({ id, rejectionReason }, thunkAPI) => {
    try { return await storeService.rejectStore({ id, rejectionReason }); }
    catch (e) { return thunkAPI.rejectWithValue(handleError(e, 'Failed to reject store')); }
  }
);

export const suspendStoreAction = createAsyncThunk(
  'store/suspend',
  async (id, thunkAPI) => {
    try { return await storeService.suspendStore(id); }
    catch (e) { return thunkAPI.rejectWithValue(handleError(e, 'Failed to suspend store')); }
  }
);

export const reactivateStoreAction = createAsyncThunk(
  'store/reactivate',
  async (id, thunkAPI) => {
    try { return await storeService.reactivateStore(id); }
    catch (e) { return thunkAPI.rejectWithValue(handleError(e, 'Failed to reactivate store')); }
  }
);

export const fetchStoreById = createAsyncThunk(
  'store/fetchById',
  async (id, thunkAPI) => {
    try { return await storeService.getStoreById(id); }
    catch (e) { return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch store')); }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  myStore:     null,
  myStoreLoaded: false,
  stores:      [],
  pagination:  null,
  currentStore: null,
  isLoading:   false,
  isSubmitting: false,
  error:       null,
  successMessage: null,
};

// Helper to update store in list
const updateStoreInState = (state, updatedStore, message) => {
  state.isSubmitting = false;
  state.successMessage = message;
  const idx = state.stores.findIndex((s) => s._id === updatedStore._id);
  if (idx !== -1) state.stores[idx] = updatedStore;
  if (state.currentStore?._id === updatedStore._id) {
    state.currentStore = updatedStore;
  }
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const storeSlice = createSlice({
  name: 'store',
  initialState,
  reducers: {
    clearStoreError:   (state) => { state.error = null; },
    clearStoreSuccess: (state) => { state.successMessage = null; },
    resetMyStore:      (state) => { state.myStore = null; state.myStoreLoaded = false; },
  },
  extraReducers: (builder) => {
    // Create store
    builder
      .addCase(createStore.pending,   (state) => { state.isSubmitting = true;  state.error = null; })
      .addCase(createStore.fulfilled, (state, { payload }) => {
        state.isSubmitting  = false;
        state.myStore       = payload.store;
        state.myStoreLoaded = true;
        state.successMessage = 'Your seller application has been submitted.';
      })
      .addCase(createStore.rejected,  (state, { payload }) => {
        state.isSubmitting = false;
        state.error        = payload;
      });

    // Fetch my store
    builder
      .addCase(fetchMyStore.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchMyStore.fulfilled, (state, { payload }) => {
        state.isLoading     = false;
        state.myStore       = payload.store;
        state.myStoreLoaded = true;
      })
      .addCase(fetchMyStore.rejected,  (state, { payload }) => {
        state.isLoading     = false;
        state.myStoreLoaded = true;
        if (payload !== 'NO_STORE') state.error = payload;
      });

    // Update my store
    builder
      .addCase(updateMyStore.pending,   (state) => { state.isSubmitting = true; state.error = null; })
      .addCase(updateMyStore.fulfilled, (state, { payload }) => {
        state.isSubmitting   = false;
        state.myStore        = payload.store;
        state.successMessage = 'Store details updated successfully.';
      })
      .addCase(updateMyStore.rejected,  (state, { payload }) => {
        state.isSubmitting = false;
        state.error        = payload;
      });

    // Fetch all stores (admin)
    builder
      .addCase(fetchAllStores.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchAllStores.fulfilled, (state, { payload }) => {
        state.isLoading  = false;
        state.stores     = payload.stores;
        state.pagination = payload.pagination;
      })
      .addCase(fetchAllStores.rejected,  (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });

    // Change status / Approve / Reject / Suspend / Reactivate
    [changeStoreStatus, approveStoreAction, rejectStoreAction, suspendStoreAction, reactivateStoreAction].forEach((actionThunk) => {
      builder
        .addCase(actionThunk.pending, (state) => { state.isSubmitting = true; state.error = null; })
        .addCase(actionThunk.fulfilled, (state, { payload }) => {
          updateStoreInState(state, payload.store, `Store status updated to ${payload.store.status}.`);
        })
        .addCase(actionThunk.rejected, (state, { payload }) => {
          state.isSubmitting = false;
          state.error = payload;
        });
    });

    // Fetch store by ID
    builder
      .addCase(fetchStoreById.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchStoreById.fulfilled, (state, { payload }) => {
        state.isLoading   = false;
        state.currentStore = payload.store;
      })
      .addCase(fetchStoreById.rejected,  (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });
  },
});

export const { clearStoreError, clearStoreSuccess, resetMyStore } = storeSlice.actions;

// Selectors
export const selectMyStore        = (state) => state.store.myStore;
export const selectMyStoreLoaded  = (state) => state.store.myStoreLoaded;
export const selectStores         = (state) => state.store.stores;
export const selectStorePagination = (state) => state.store.pagination;
export const selectCurrentStore   = (state) => state.store.currentStore;
export const selectStoreLoading   = (state) => state.store.isLoading;
export const selectStoreSubmitting = (state) => state.store.isSubmitting;
export const selectStoreError     = (state) => state.store.error;
export const selectStoreSuccess   = (state) => state.store.successMessage;
export const selectHasStore       = (state) => !!state.store.myStore;
export const selectStoreStatus    = (state) => state.store.myStore?.status;

export default storeSlice.reducer;
