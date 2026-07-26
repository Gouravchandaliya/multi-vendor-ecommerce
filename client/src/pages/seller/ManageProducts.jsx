import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import {
  fetchSellerProducts,
  deleteProduct,
  clearProductError,
  clearProductSuccess,
  selectSellerProducts,
  selectProductPagination,
  selectProductLoading,
  selectProductSubmitting,
  selectProductError,
  selectProductSuccess,
} from '../../features/product/productSlice';
import Alert from '../../components/common/Alert';
import { PageSpinner } from '../../components/common/Spinner';

const ManageProducts = () => {
  const dispatch     = useDispatch();
  const products     = useSelector(selectSellerProducts);
  const pagination   = useSelector(selectProductPagination);
  const isLoading    = useSelector(selectProductLoading);
  const isSubmitting = useSelector(selectProductSubmitting);
  const error        = useSelector(selectProductError);
  const success      = useSelector(selectProductSuccess);

  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // Product object to delete

  const load = (s = search, p = page) => {
    dispatch(fetchSellerProducts({ search: s, page: p, limit: 10 }));
  };

  useEffect(() => {
    load();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-clear success message
  useEffect(() => {
    if (success) {
      setDeleteConfirm(null);
      const t = setTimeout(() => dispatch(clearProductSuccess()), 4000);
      return () => clearTimeout(t);
    }
  }, [success, dispatch]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    load(search, 1);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    dispatch(deleteProduct(deleteConfirm._id)).then(() => load());
  };

  if (isLoading && products.length === 0) return <PageSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products Catalog</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and update your store products</p>
          </div>
          <Link
            to="/seller/products/add"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold
              rounded-xl shadow-sm hover:shadow transition flex items-center gap-2 self-start sm:self-auto"
          >
            <span>➕</span> Add Product
          </Link>
        </div>

        {/* Alerts */}
        <Alert type="success" message={success} onClose={() => dispatch(clearProductSuccess())} />
        <Alert type="error"   message={error}   onClose={() => dispatch(clearProductError())} />

        {/* Search / Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Search products by name..."
              value={search}
              onChange={handleSearchChange}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl text-sm transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-405">
              <span className="text-4xl mb-2">📦</span>
              <p className="text-sm font-medium text-gray-550">No products found</p>
              <p className="text-xs text-gray-400 mt-1">Try creating a product to see it listed here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{product.brand}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600 font-medium">
                        {product.category}
                      </td>
                      <td className="px-5 py-4">
                        {product.discountPrice && product.discountPrice > 0 ? (
                          <div>
                            <span className="font-bold text-gray-900">${product.discountPrice}</span>
                            <span className="text-xs text-gray-450 line-through ml-1.5">${product.price}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-gray-900">${product.price}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {product.stock === 0 ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-750 font-bold rounded-full text-xs">Out of Stock</span>
                        ) : product.stock < 10 ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-750 font-bold rounded-full text-xs">Low Stock ({product.stock})</span>
                        ) : (
                          <span className="text-gray-700 font-medium">{product.stock} units</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex w-2.5 h-2.5 rounded-full mr-1.5 ${product.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-gray-700 font-medium capitalize">{product.isActive ? 'Active' : 'Draft'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                          <Link
                            to={`/seller/products/edit/${product._id}`}
                            className="text-blue-600 hover:text-blue-800 font-semibold transition"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm(product)}
                            className="text-red-650 hover:text-red-800 font-semibold transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg
                hover:bg-gray-50 disabled:opacity-40 transition"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-655">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg
                hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Next →
            </button>
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Product</h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-gray-800">"{deleteConfirm.name}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm
                  font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-red-600 rounded-lg text-sm font-medium
                  text-white hover:bg-red-750 disabled:bg-red-400 transition
                  flex items-center justify-center gap-2"
              >
                {isSubmitting
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting...</>
                  : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageProducts;
