import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '../../services/api';
import ProductCard from '../../components/common/ProductCard';

const CATEGORIES = [
  { name: 'Electronics', icon: '💻', count: 'Gadgets & Tech' },
  { name: 'Fashion', icon: '👕', count: 'Clothing & Style' },
  { name: 'Home & Living', icon: '🏠', count: 'Decor & Furniture' },
  { name: 'Beauty', icon: '✨', count: 'Skincare & Cosmetics' },
  { name: 'Sports', icon: '⚽', count: 'Fitness & Outdoors' },
  { name: 'Books', icon: '📚', count: 'Literature & Learning' },
  { name: 'Accessories', icon: '🎧', count: 'Audio & Wearables' },
];

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [topRatedProducts, setTopRatedProducts] = useState([]);
  const [featuredStores, setFeaturedStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, topRes, storeRes] = await Promise.all([
          api.get('/products/public?limit=8&sort=newest'),
          api.get('/products/public?limit=4&sort=rating'),
          api.get('/stores/public?limit=4'),
        ]);

        setFeaturedProducts(prodRes.data.data.products || []);
        setTopRatedProducts(topRes.data.data.products || []);
        setFeaturedStores(storeRes.data.data.stores || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-16 py-6">
      
      {/* ── 1. HERO SECTION ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-gray-900 rounded-3xl p-8 sm:p-14 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Subtle overlay effect */}
          <div className="absolute inset-0 bg-blue-600/10 pointer-events-none" />

          <div className="max-w-xl space-y-5 z-10 text-center md:text-left">
            <span className="px-3.5 py-1 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-full text-xs font-semibold uppercase tracking-wider">
              Multi-Vendor Marketplace
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Discover Products From Verified Sellers
            </h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Explore thousands of quality goods directly from independent stores nationwide. Transparent pricing, verified merchant ratings, and fast fulfillment.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <Link
                to="/products"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition"
              >
                Shop Now &rarr;
              </Link>
              <a
                href="#categories"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition"
              >
                Explore Categories
              </a>
            </div>
          </div>

          {/* Hero Visual Banner */}
          <div className="w-full md:w-1/2 max-w-sm aspect-square rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col justify-center items-center text-center space-y-4 backdrop-blur-sm z-10">
            <span className="text-6xl">🛍️</span>
            <h3 className="font-bold text-lg">Direct From Merchants</h3>
            <p className="text-xs text-gray-300">Support independent brands while enjoying safe marketplace transactions.</p>
            <Link to="/become-seller" className="text-xs text-blue-300 hover:text-white font-bold underline">
              Want to sell your products? Apply here &rarr;
            </Link>
          </div>

        </div>
      </section>

      {/* ── 2. SHOP BY CATEGORY ─────────────────────────────────────────── */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <p className="text-gray-500 text-sm mt-0.5">Browse products tailored to your needs</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-300 transition text-center group flex flex-col items-center justify-center space-y-2"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <h3 className="font-bold text-gray-900 text-sm">{cat.name}</h3>
              <span className="text-[10px] text-gray-400 font-medium">{cat.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 3. FEATURED PRODUCTS (NEW ARRIVALS) ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
            <p className="text-gray-500 text-sm mt-0.5">Recently listed items from our sellers</p>
          </div>
          <Link to="/products" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">
            View All Products &rarr;
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-gray-100 h-64 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 space-y-2">
            <span className="text-4xl">📦</span>
            <p className="text-sm font-medium text-gray-600">No products available yet</p>
            <p className="text-xs">Sellers will begin listing new products soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── 4. TOP RATED PRODUCTS ────────────────────────────────────────── */}
      {topRatedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">⭐ Top Rated Products</h2>
              <p className="text-gray-500 text-sm mt-0.5">Highest rated products according to verified customer reviews</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {topRatedProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── 5. FEATURED STORES ───────────────────────────────────────────── */}
      {featuredStores.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Stores</h2>
              <p className="text-gray-500 text-sm mt-0.5">Top verified merchants selling on MarketX</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredStores.map((store) => (
              <div key={store._id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl">
                    🏪
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">{store.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{store.description || 'Verified MarketX Seller'}</p>
                </div>
                <Link
                  to={`/stores/${store.slug}`}
                  className="w-full py-2 bg-gray-50 hover:bg-blue-50 text-blue-700 font-semibold text-xs rounded-xl text-center border border-gray-200 transition"
                >
                  Visit Store &rarr;
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 6. MARKETPLACE BENEFITS ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
          <div className="space-y-2 p-4">
            <span className="text-3xl">🛡️</span>
            <h4 className="font-bold text-gray-900 text-sm">Verified Sellers</h4>
            <p className="text-xs text-gray-500">Every store is manually reviewed and approved by site administrators.</p>
          </div>
          <div className="space-y-2 p-4">
            <span className="text-3xl">🚚</span>
            <h4 className="font-bold text-gray-900 text-sm">Fast Shipping</h4>
            <p className="text-xs text-gray-500">Direct dispatch from merchant warehouses across the country.</p>
          </div>
          <div className="space-y-2 p-4">
            <span className="text-3xl">💳</span>
            <h4 className="font-bold text-gray-900 text-sm">Secure Transactions</h4>
            <p className="text-xs text-gray-500">Encrypted payment architecture and buyer protection guarantees.</p>
          </div>
          <div className="space-y-2 p-4">
            <span className="text-3xl">💬</span>
            <h4 className="font-bold text-gray-900 text-sm">Dedicated Support</h4>
            <p className="text-xs text-gray-500">Our customer service team is ready to assist with any questions.</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
