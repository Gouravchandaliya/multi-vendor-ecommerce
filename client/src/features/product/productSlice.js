import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import productService from './productService';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

const handleError = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.errors?.[0]?.msg ||
  error.message ||
  fallback;

export const createProduct = createAsyncThunk(
  'product/create',
  async (formData, thunkAPI) => {
    try {
      return await productService.createProduct(formData);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to create product'));
    }
  }
);

export const fetchSellerProducts = createAsyncThunk(
  'product/fetchSeller',
  async (params, thunkAPI) => {
    try {
      return await productService.getSellerProducts(params);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch products'));
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'product/fetchById',
  async (id, thunkAPI) => {
    try {
      return await productService.getProductById(id);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch product details'));
    }
  }
);

export const updateProduct = createAsyncThunk(
  'product/update',
  async ({ id, formData }, thunkAPI) => {
    try {
      return await productService.updateProduct({ id, formData });
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to update product'));
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'product/delete',
  async (id, thunkAPI) => {
    try {
      await productService.deleteProduct(id);
      return id;
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to delete product'));
    }
  }
);

// ─── Public Thunks ────────────────────────────────────────────────────────────

export const fetchPublicProducts = createAsyncThunk(
  'product/fetchPublic',
  async (params, thunkAPI) => {
    try {
      return await productService.getPublicProducts(params);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch products'));
    }
  }
);

export const fetchPublicProductBySlug = createAsyncThunk(
  'product/fetchPublicBySlug',
  async (slug, thunkAPI) => {
    try {
      return await productService.getPublicProductBySlug(slug);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch product details'));
    }
  }
);

export const fetchRelatedProducts = createAsyncThunk(
  'product/fetchRelated',
  async (slug, thunkAPI) => {
    try {
      return await productService.getRelatedProducts(slug);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch related products'));
    }
  }
);

export const fetchPublicStoreProducts = createAsyncThunk(
  'product/fetchPublicStoreProducts',
  async ({ slug, params }, thunkAPI) => {
    try {
      return await productService.getPublicStoreProducts(slug, params);
    } catch (e) {
      return thunkAPI.rejectWithValue(handleError(e, 'Failed to fetch store products'));
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  products:       [],
  pagination:     null,
  currentProduct: null,
  relatedProducts: [],
  publicStore:    null,
  isLoading:      false,
  isSubmitting:   false,
  error:          null,
  successMessage: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    clearProductError:   (state) => { state.error = null; },
    clearProductSuccess: (state) => { state.successMessage = null; },
    resetCurrentProduct: (state) => { state.currentProduct = null; state.relatedProducts = []; },
  },
  extraReducers: (builder) => {
    // Create Product
    builder
      .addCase(createProduct.pending, (state) => {
        state.isSubmitting = true;
        state.error        = null;
      })
      .addCase(createProduct.fulfilled, (state) => {
        state.isSubmitting   = false;
        state.successMessage = 'Product added successfully.';
      })
      .addCase(createProduct.rejected, (state, { payload }) => {
        state.isSubmitting = false;
        state.error        = payload;
      });

    // Fetch Seller Products
    builder
      .addCase(fetchSellerProducts.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchSellerProducts.fulfilled, (state, { payload }) => {
        state.isLoading  = false;
        state.products   = payload.products;
        state.pagination = payload.pagination;
      })
      .addCase(fetchSellerProducts.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });

    // Fetch Product By ID
    builder
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchProductById.fulfilled, (state, { payload }) => {
        state.isLoading      = false;
        state.currentProduct = payload.product;
      })
      .addCase(fetchProductById.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });

    // Update Product
    builder
      .addCase(updateProduct.pending, (state) => {
        state.isSubmitting = true;
        state.error        = null;
      })
      .addCase(updateProduct.fulfilled, (state, { payload }) => {
        state.isSubmitting   = false;
        state.successMessage = 'Product updated successfully.';
        state.currentProduct = payload.product;
        const idx = state.products.findIndex((p) => p._id === payload.product._id);
        if (idx !== -1) state.products[idx] = payload.product;
      })
      .addCase(updateProduct.rejected, (state, { payload }) => {
        state.isSubmitting = false;
        state.error        = payload;
      });

    // Delete Product
    builder
      .addCase(deleteProduct.pending, (state) => {
        state.isSubmitting = true;
        state.error        = null;
      })
      .addCase(deleteProduct.fulfilled, (state, { payload }) => {
        state.isSubmitting   = false;
        state.successMessage = 'Product deleted successfully.';
        state.products       = state.products.filter((p) => p._id !== payload);
      })
      .addCase(deleteProduct.rejected, (state, { payload }) => {
        state.isSubmitting = false;
        state.error        = payload;
      });

    // Fetch Public Products
    builder
      .addCase(fetchPublicProducts.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchPublicProducts.fulfilled, (state, { payload }) => {
        state.isLoading  = false;
        state.products   = payload.products;
        state.pagination = payload.pagination;
      })
      .addCase(fetchPublicProducts.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });

    // Fetch Public Product By Slug
    builder
      .addCase(fetchPublicProductBySlug.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchPublicProductBySlug.fulfilled, (state, { payload }) => {
        state.isLoading      = false;
        state.currentProduct = payload.product;
      })
      .addCase(fetchPublicProductBySlug.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });

    // Fetch Related Products
    builder
      .addCase(fetchRelatedProducts.fulfilled, (state, { payload }) => {
        state.relatedProducts = payload.products;
      });

    // Fetch Public Store Products
    builder
      .addCase(fetchPublicStoreProducts.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchPublicStoreProducts.fulfilled, (state, { payload }) => {
        state.isLoading   = false;
        state.publicStore = payload.store;
        state.products    = payload.products;
        state.pagination  = payload.pagination;
      })
      .addCase(fetchPublicStoreProducts.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error     = payload;
      });
  },
});

export const { clearProductError, clearProductSuccess, resetCurrentProduct } = productSlice.actions;

// Selectors
export const selectSellerProducts = (state) => state.product.products;
export const selectProductPagination = (state) => state.product.pagination;
export const selectCurrentProduct = (state) => state.product.currentProduct;
export const selectRelatedProducts = (state) => state.product.relatedProducts;
export const selectPublicStore    = (state) => state.product.publicStore;
export const selectProductLoading = (state) => state.product.isLoading;
export const selectProductSubmitting = (state) => state.product.isSubmitting;
export const selectProductError   = (state) => state.product.error;
export const selectProductSuccess = (state) => state.product.successMessage;

export default productSlice.reducer;
