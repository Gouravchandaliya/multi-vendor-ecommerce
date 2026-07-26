import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        error.message ||
        'Registration failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, thunkAPI) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Login failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, thunkAPI) => {
    try {
      await authService.logout();
    } catch {
      // Even if the server call fails, clear local state
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/getMe',
  async (_, thunkAPI) => {
    try {
      return await authService.getMe();
    } catch (error) {
      return thunkAPI.rejectWithValue('Session expired');
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, thunkAPI) => {
    try {
      return await authService.refreshToken();
    } catch (error) {
      return thunkAPI.rejectWithValue('Session expired');
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  user:        null,        // { _id, name, email, role, isActive, ... }
  accessToken: null,        // stored in-memory only — never localStorage
  isLoading:   false,
  error:       null,
  initialized: false,       // true after the initial /auth/me check completes
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Clears auth state locally without calling the server.
     * Used by the Axios interceptor when refresh fails.
     */
    clearAuth: (state) => {
      state.user        = null;
      state.accessToken = null;
      state.error       = null;
      state.initialized = true;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── Register ──
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading  = false;
        state.user       = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.initialized = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      });

    // ── Login ──
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading   = false;
        state.user        = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.initialized = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      });

    // ── Logout ──
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user        = null;
        state.accessToken = null;
        state.initialized = true;
      });

    // ── Get current user (on app load) ──
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading   = false;
        state.user        = action.payload.user;
        state.initialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading   = false;
        state.user        = null;
        state.accessToken = null;
        state.initialized = true;
      });

    // ── Refresh token ──
    builder
      .addCase(refreshAccessToken.pending, (state) => {
        // Don't set isLoading here — this runs silently on app boot
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        // initialized stays false here — fetchCurrentUser (called after) will set it
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        // No valid refresh token — user is not logged in, mark as initialized
        state.user        = null;
        state.accessToken = null;
        state.initialized = true;
      })
      // Upgrade user role if returned by store/create
      .addCase('store/create/fulfilled', (state, action) => {
        if (action.payload.user) {
          state.user = action.payload.user;
        }
      });
  },
});

export const { clearAuth, clearError } = authSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectUser        = (state) => state.auth.user;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectIsLoading   = (state) => state.auth.isLoading;
export const selectAuthError   = (state) => state.auth.error;
export const selectInitialized = (state) => state.auth.initialized;
export const selectIsLoggedIn  = (state) => !!state.auth.user;
export const selectUserRole    = (state) => state.auth.user?.role;

export default authSlice.reducer;
