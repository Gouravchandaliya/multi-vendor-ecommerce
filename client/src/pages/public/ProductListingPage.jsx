import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router';
import {
  fetchPublicProducts,
  selectSellerProducts,
  selectProductPagination,
  selectProductLoading,
  selectProductError,
} from '../../features/product/productSlice';
import ProductCard from '../../components/common/ProductCard';
import Alert from '../../components/common/Alert';
import { PageSpinner } from '../../components/common/Spinner';

const CATEGORIES = [
  'All Categories',
  'Electronics',
  'Fashion',
  'Home & Living',
  'Beauty',
  'Sports',
  'Books',
  'Accessories',
];

const ProductListingPage = () => {
  const dispatch       = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const products   = useSelector(selectSellerProducts);
  const pagination = useSelector(selectProductPagination);
  const isLoading  = useSelector(selectProductLoading);
  const error      = useSelector(selectProductError);

  // Filter state initialized from URL search params
  const [search, setSearch]       = useState(searchParams.get('search') || '');
  const [category, setCategory]   = useState(searchParams.get('category') || '');
  const [brand, setBrand]         = useState(searchParams.get('brand') || '');
  const [minPrice, setMinPrice]   = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice]   = useState(searchParams.get('maxPrice') || '');
  const [inStock, setInStock]     = useState(searchParams.get('inStock') === 'true');
  const [sort, setSort]           = useState(searchParams.get('sort') || 'newest');
  const [page, setPage]           = useState(Number(searchParams.get('page')) || 1);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync state changes with URL query parameters
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (brand) params.brand = brand;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (inStock) params.inStock = 'true';
    if (sort && sort !== 'newest') params.sort = sort;
    if (page > 1) params.page = page.toString();

    setSearchParams(params, { replace: true });
    dispatch(fetchPublicProducts({ search, category, brand, minPrice, maxPrice, inStock: inStock ? 'true' : '', sort, page, limit: 12 }));
  }, [search, category, brand, minPrice, maxPrice, inStock, sort, page, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setInStock(false);
    setSort('newest');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Mobile Filter Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Explore Marketplace Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {search ? `Showing search results for "${search}"` : category ? `Category: ${category}` : 'Browse quality products from verified sellers'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFilterOpen((p) => !p)}
            className="md:hidden px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm flex items-center gap-2"
          >
            ⚙️ Filters
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <label htmlFor="sort" className="hidden sm:inline">Sort By:</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      <Alert type="error" message={error} />

      {/* Main Grid + Sidebar Layout */}
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Desktop Filter Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-6 hidden md:block">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Filters</h2>
              <button
                onClick={handleClearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition"
              >
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value === 'All Categories' ? '' : e.target.value); setPage(1); }}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat === 'All Categories' ? '' : cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Brand</label>
              <input
                type="text"
                placeholder="e.g. Sony, Apple..."
                value={brand}
                onChange={(e) => { setBrand(e.target.value); setPage(1); }}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Price Range ($)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                  className="w-1/2 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  className="w-1/2 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Availability Filter */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <input
                id="inStock"
                type="checkbox"
                checked={inStock}
                onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="inStock" className="text-xs font-semibold text-gray-700 cursor-pointer">
                In Stock Only
              </label>
            </div>

          </div>
        </aside>

        {/* Mobile Filter Drawer */}
        {isMobileFilterOpen && (
          <div className="md:hidden bg-white p-6 rounded-2xl border border-gray-200 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Filters</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="text-gray-400 font-bold text-lg">&times;</button>
            </div>
            {/* Same controls */}
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value === 'All Categories' ? '' : e.target.value); setPage(1); }}
              className="w-full p-2 border rounded-xl text-xs"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat === 'All Categories' ? '' : cat}>{cat}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input type="number" placeholder="Min $" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-1/2 p-2 border rounded-xl text-xs" />
              <input type="number" placeholder="Max $" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-1/2 p-2 border rounded-xl text-xs" />
            </div>
            <button onClick={handleClearFilters} className="w-full py-2 bg-gray-100 text-xs font-bold rounded-xl">Clear All</button>
          </div>
        )}

        {/* Product Grid & Content Area */}
        <main className="flex-1 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-gray-100 h-72 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-3">
              <span className="text-5xl">🔍</span>
              <h3 className="text-lg font-bold text-gray-900">No products found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                We couldn't find any products matching your selected search or filter criteria.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition mt-2"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition"
              >
                ← Previous
              </button>
              <span className="text-xs font-semibold text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Next →
              </button>
            </div>
          )}
        </main>

      </div>

    </div>
  );
};

export default ProductListingPage;
