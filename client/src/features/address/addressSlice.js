import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import addressService from './addressService';

const handleError = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.errors?.[0]?.msg ||
  error.message ||
  fallback;

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchAddresses = createAsyncThunk(
  'address/fetch',
  async (_, thunkAPI) => {
    try {
      return await addressService.getAddresses();
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch addresses'));
    }
  }
);

export const createAddress = createAsyncThunk(
  'address/create',
  async (addressData, thunkAPI) => {
    try {
      return await addressService.createAddress(addressData);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to create address'));
    }
  }
);

export const updateAddress = createAsyncThunk(
  'address/update',
  async ({ id, addressData }, thunkAPI) => {
    try {
      return await addressService.updateAddress({ id, addressData });
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to update address'));
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'address/delete',
  async (id, thunkAPI) => {
    try {
      return await addressService.deleteAddress(id);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to delete address'));
    }
  }
);

export const setDefaultAddress = createAsyncThunk(
  'address/setDefault',
  async (id, thunkAPI) => {
    try {
      return await addressService.setDefaultAddress(id);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to set default address'));
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  addresses: [],
  selectedAddressId: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  successMessage: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    clearAddressError: (state) => { state.error = null; },
    clearAddressSuccess: (state) => { state.successMessage = null; },
    setSelectedAddressId: (state, action) => { state.selectedAddressId = action.payload; },
  },
  extraReducers: (builder) => {
    // Fetch Addresses
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.addresses = payload;
        const defaultAddr = payload.find((a) => a.isDefault) || payload[0];
        if (defaultAddr && !state.selectedAddressId) {
          state.selectedAddressId = defaultAddr._id;
        }
      })
      .addCase(fetchAddresses.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      });

    // Create Address
    builder
      .addCase(createAddress.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createAddress.fulfilled, (state, { payload }) => {
        state.isSubmitting = false;
        if (payload.isDefault) {
          state.addresses.forEach((a) => { a.isDefault = false; });
        }
        state.addresses.unshift(payload);
        state.selectedAddressId = payload._id;
        state.successMessage = 'Address added successfully.';
      })
      .addCase(createAddress.rejected, (state, { payload }) => {
        state.isSubmitting = false;
        state.error = payload;
      });

    // Update Address
    builder
      .addCase(updateAddress.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateAddress.fulfilled, (state, { payload }) => {
        state.isSubmitting = false;
        const idx = state.addresses.findIndex((a) => a._id === payload._id);
        if (idx > -1) {
          if (payload.isDefault) {
            state.addresses.forEach((a) => { a.isDefault = false; });
          }
          state.addresses[idx] = payload;
        }
        state.successMessage = 'Address updated successfully.';
      })
      .addCase(updateAddress.rejected, (state, { payload }) => {
        state.isSubmitting = false;
        state.error = payload;
      });

    // Delete Address
    builder
      .addCase(deleteAddress.fulfilled, (state, { payload }) => {
        state.addresses = state.addresses.filter((a) => a._id !== payload);
        if (state.selectedAddressId === payload) {
          state.selectedAddressId = state.addresses[0]?._id || null;
        }
        state.successMessage = 'Address deleted successfully.';
      });

    // Set Default Address
    builder
      .addCase(setDefaultAddress.fulfilled, (state, { payload }) => {
        state.addresses.forEach((a) => {
          a.isDefault = a._id === payload._id;
        });
        state.selectedAddressId = payload._id;
        state.successMessage = 'Default address updated.';
      });
  },
});

export const { clearAddressError, clearAddressSuccess, setSelectedAddressId } = addressSlice.actions;

// Selectors
export const selectAddresses         = (state) => state.address.addresses;
export const selectSelectedAddressId = (state) => state.address.selectedAddressId;
export const selectAddressLoading     = (state) => state.address.isLoading;
export const selectAddressSubmitting  = (state) => state.address.isSubmitting;
export const selectAddressError       = (state) => state.address.error;

export default addressSlice.reducer;
