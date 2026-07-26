import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import {
  fetchPublicStoreProducts,
  selectSellerProducts,
  selectPublicStore,
  selectProductPagination,
  selectProductLoading,
  selectProductError,
} from '../../features/product/productSlice';
import ProductCard from '../../components/common/ProductCard';
import Alert from '../../components/common/Alert';
import { PageSpinner } from '../../components/common/Spinner';

const PublicStorePage = () => {
  const { slug }  = useParams();
  const dispatch  = useDispatch();

  const store      = useSelector(selectPublicStore);
  const products   = useSelector(selectSellerProducts);
  const pagination = useSelector(selectProductPagination);
  const isLoading  = useSelector(selectProductLoading);
  const error      = useSelector(selectProductError);

  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const loadStoreProducts = (s = search, p = page) => {
    dispatch(fetchPublicStoreProducts({ slug, params: { search: s, page: p, limit: 12 } }));
  };

  useEffect(() => {
    loadStoreProducts(search, page);
  }, [slug, page, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadStoreProducts(search, 1);
  };

  if (isLoading && !store) return <PageSpinner />;

  return (
    <div className="space-y-8 py-6">
      
      {/* Store Banner & Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-gray-900 rounded-3xl p-8 sm:p-12 text-white shadow-lg relative overflow-hidden space-y-6">
          
          {/* Top Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-white text-gray-900 flex items-center justify-center text-4xl shadow-md border-2 border-white/20 flex-shrink-0 overflow-hidden">
              {store?.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                '🏪'
              )}
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{store?.name}</h1>
                <span className="px-2.5 py-0.5 bg-green-500/20 text-green-300 border border-green-400/30 text-xs font-bold rounded-full">
                  ✓ Verified Merchant
                </span>
              </div>
              <p className="text-xs text-gray-300 font-mono">/{store?.slug}</p>
              {store?.city && (
                <p className="text-xs text-gray-400">📍 Based in {store.city}, {store.country}</p>
              )}
            </div>
          </div>

          {/* Description */}
          {store?.description && (
            <p className="text-sm text-gray-300 max-w-3xl leading-relaxed border-t border-white/10 pt-4 relative z-10">
              {store.description}
            </p>
          )}

        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <Alert type="error" message={error} />

        {/* Search within store */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Store Products ({pagination?.total || products.length})
          </h2>

          <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 flex gap-2">
            <input
              type="text"
              placeholder={`Search in ${store?.name || 'store'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-gray-100 h-64 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 space-y-2">
            <span className="text-4xl">📦</span>
            <p className="text-sm font-medium text-gray-600">No products available for this store</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
            >
              ← Previous
            </button>
            <span className="text-xs text-gray-600 font-semibold">Page {pagination.page} of {pagination.totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}

      </div>

    </div>
  );
};

export default PublicStorePage;
