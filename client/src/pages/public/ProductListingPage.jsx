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
import Pagination from '../../components/common/Pagination';
import Alert from '../../components/common/Alert';

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

const RATING_OPTIONS = [
  { label: 'Any Rating', value: '' },
  { label: '4★ & above', value: '4' },
  { label: '3★ & above', value: '3' },
  { label: '2★ & above', value: '2' },
  { label: '1★ & above', value: '1' },
];

const ProductListingPage = () => {
  const dispatch       = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const products   = useSelector(selectSellerProducts);
  const pagination = useSelector(selectProductPagination);
  const isLoading  = useSelector(selectProductLoading);
  const error      = useSelector(selectProductError);

  // Filter state initialized from URL search params
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [search, setSearch]           = useState(searchParams.get('search') || '');
  const [category, setCategory]       = useState(searchParams.get('category') || '');
  const [brand, setBrand]             = useState(searchParams.get('brand') || '');
  const [minPrice, setMinPrice]       = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice]       = useState(searchParams.get('maxPrice') || '');
  const [rating, setRating]           = useState(searchParams.get('rating') || '');
  const [inStock, setInStock]         = useState(searchParams.get('inStock') === 'true');
  const [sort, setSort]               = useState(searchParams.get('sort') || 'newest');
  const [page, setPage]               = useState(Number(searchParams.get('page')) || 1);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // Sync state changes with URL query parameters & API dispatch
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (brand) params.brand = brand;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (rating) params.rating = rating;
    if (inStock) params.inStock = 'true';
    if (sort && sort !== 'newest') params.sort = sort;
    if (page > 1) params.page = page.toString();

    setSearchParams(params, { replace: true });
    dispatch(
      fetchPublicProducts({
        search,
        category,
        brand,
        minPrice,
        maxPrice,
        rating,
        inStock: inStock ? 'true' : '',
        sort,
        page,
        limit: 12,
      })
    );
  }, [search, category, brand, minPrice, maxPrice, rating, inStock, sort, page, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setCategory('');
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setInStock(false);
    setSort('newest');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Search Bar Component */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search products by name, description, brand..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 font-bold"
              >
                &times;
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow transition whitespace-nowrap"
          >
            Search
          </button>
        </form>
      </div>

      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Explore Marketplace Products</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {search
              ? `Showing results for "${search}"`
              : category
              ? `Category: ${category}`
              : 'Browse quality products from verified multi-vendor stores'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 shadow-sm flex items-center gap-2"
          >
            ⚙️ Filters
          </button>

          {/* Whitelisted Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
            <label htmlFor="sort" className="hidden sm:inline">Sort By:</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
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
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Filters</h2>
              <button
                onClick={handleClearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold transition"
              >
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value === 'All Categories' ? '' : e.target.value);
                  setPage(1);
                }}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat === 'All Categories' ? '' : cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Price Range ($)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPage(1);
                  }}
                  className="w-1/2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  className="w-1/2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Minimum Rating</label>
              <select
                value={rating}
                onChange={(e) => {
                  setRating(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {RATING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Brand</label>
              <input
                type="text"
                placeholder="e.g. Sony, Apple..."
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Availability Checkbox */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <input
                id="inStockDesktop"
                type="checkbox"
                checked={inStock}
                onChange={(e) => {
                  setInStock(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="inStockDesktop" className="text-xs font-bold text-gray-700 cursor-pointer">
                In Stock Only
              </label>
            </div>

          </div>
        </aside>

        {/* Mobile Filter Drawer Modal */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm md:hidden">
            <div className="ml-auto w-4/5 max-w-sm bg-white h-full p-6 space-y-5 overflow-y-auto shadow-2xl flex flex-col justify-between">
              
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <h3 className="font-extrabold text-base text-gray-900">Filter Products</h3>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="text-gray-400 hover:text-gray-700 font-bold text-xl"
                  >
                    &times;
                  </button>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value === 'All Categories' ? '' : e.target.value);
                      setPage(1);
                    }}
                    className="w-full p-2.5 border rounded-xl text-xs font-medium"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat === 'All Categories' ? '' : cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Price Range ($)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min $"
                      value={minPrice}
                      onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                      className="w-1/2 p-2 border rounded-xl text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Max $"
                      value={maxPrice}
                      onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                      className="w-1/2 p-2 border rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Rating */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Minimum Rating</label>
                  <select
                    value={rating}
                    onChange={(e) => { setRating(e.target.value); setPage(1); }}
                    className="w-full p-2.5 border rounded-xl text-xs font-medium"
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* In Stock */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="inStockMobile"
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="inStockMobile" className="text-xs font-bold text-gray-700">
                    In Stock Only
                  </label>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full py-3 bg-blue-600 text-white text-xs font-bold rounded-xl shadow"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="w-full py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Clear All
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Product Grid & Main Content */}
        <main className="flex-1 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-gray-100 h-80 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4 shadow-sm">
              <span className="text-5xl">🔍</span>
              <h3 className="text-lg font-extrabold text-gray-900">No products found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                We couldn't find any products matching your search or active filters. Try adjusting or clearing your criteria.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Server-Side Pagination Component */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(newPage) => setPage(newPage)}
            />
          )}
        </main>

      </div>

    </div>
  );
};

export default ProductListingPage;
