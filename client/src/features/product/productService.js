import api from '../../services/api';

/**
 * productService — all Axios calls for product CRUD & discovery.
 */

// ─── Seller CRUD ──────────────────────────────────────────────────────────────

const createProduct = async (formData) => {
  const response = await api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data; // { product }
};

const getSellerProducts = async ({ page = 1, limit = 10, search = '' } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append('search', search);
  const response = await api.get(`/products/seller?${params}`);
  return response.data.data; // { products, pagination }
};

const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data.data; // { product }
};

const updateProduct = async ({ id, formData }) => {
  const response = await api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data; // { product }
};

const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data.data;
};

// ─── Public Discovery ─────────────────────────────────────────────────────────

const getPublicProducts = async (queryParams = {}) => {
  const params = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      params.append(key, val);
    }
  });
  const response = await api.get(`/products/public?${params.toString()}`);
  return response.data.data; // { products, pagination }
};

const getPublicProductBySlug = async (slug) => {
  const response = await api.get(`/products/public/${slug}`);
  return response.data.data; // { product }
};

const getRelatedProducts = async (slug) => {
  const response = await api.get(`/products/public/${slug}/related`);
  return response.data.data; // { products }
};

const getPublicStoreProducts = async (slug, queryParams = {}) => {
  const params = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      params.append(key, val);
    }
  });
  const response = await api.get(`/stores/public/${slug}/products?${params.toString()}`);
  return response.data.data; // { store, products, pagination }
};

const productService = {
  createProduct,
  getSellerProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getPublicProducts,
  getPublicProductBySlug,
  getRelatedProducts,
  getPublicStoreProducts,
};

export default productService;
