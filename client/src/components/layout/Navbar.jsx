import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import {
  logoutUser,
  selectUser,
  selectIsLoggedIn,
  selectUserRole,
} from '../../features/auth/authSlice';
import { fetchCart, selectCartItemCount } from '../../features/cart/cartSlice';
import { fetchWishlist, selectWishlistCount } from '../../features/wishlist/wishlistSlice';

const CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Living',
  'Beauty',
  'Sports',
  'Books',
  'Accessories',
];

const Navbar = () => {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();

  const user       = useSelector(selectUser);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const userRole   = useSelector(selectUserRole);

  const cartItemCount = useSelector((state) => selectCartItemCount(state, isLoggedIn));
  const wishlistCount = useSelector(selectWishlistCount);

  const [searchTerm, setSearchTerm]   = useState(searchParams.get('search') || '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCatOpen, setIsCatOpen]     = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [isLoggedIn, dispatch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  const getDashboardPath = () => {
    switch (userRole) {
      case 'admin':  return '/admin/dashboard';
      case 'seller': return '/seller/dashboard';
      default:       return '/buyer/dashboard';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      
      {/* Primary Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
            M
          </span>
          <span className="font-extrabold text-xl text-gray-900 tracking-tight hidden sm:inline">
            Market<span className="text-blue-600">X</span>
          </span>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg relative hidden sm:block">
          <input
            type="text"
            placeholder="Search products, brands, or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50"
          />
          <button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition"
            title="Search"
          >
            🔍
          </button>
        </form>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-4">
          
          {/* Wishlist Link */}
          <Link
            to="/wishlist"
            className="relative text-xl p-1.5 hover:bg-gray-100 rounded-xl transition"
            title="Wishlist"
          >
            <span>🤍</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Link */}
          <Link
            to="/cart"
            className="relative text-xl p-1.5 hover:bg-gray-100 rounded-xl transition"
            title="Shopping Cart"
          >
            <span>🛒</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* Auth State */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                to="/account/orders"
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition hidden sm:flex items-center gap-1.5"
                title="My Orders"
              >
                <span>📦</span>
                <span>My Orders</span>
              </Link>

              <Link
                to={getDashboardPath()}
                className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-semibold transition flex items-center gap-2"
              >
                <span>Dashboard</span>
                <span className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs capitalize hidden lg:inline">
                  {userRole}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition hidden sm:block"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen((p) => !p)}
            className="p-2 text-gray-600 hover:text-gray-900 sm:hidden"
          >
            ☰
          </button>

        </div>

      </div>

      {/* Sub Navbar Links & Category Dropdown */}
      <div className="bg-gray-50/80 border-t border-gray-100 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center gap-6 text-xs font-semibold text-gray-600">
          
          <Link to="/" className="hover:text-blue-600 transition">
            Home
          </Link>

          <Link to="/products" className="hover:text-blue-600 transition">
            All Products
          </Link>

          {/* Categories Dropdown */}
          <div className="relative" onMouseLeave={() => setIsCatOpen(false)}>
            <button
              onMouseEnter={() => setIsCatOpen(true)}
              onClick={() => setIsCatOpen((p) => !p)}
              className="flex items-center gap-1 hover:text-blue-600 transition"
            >
              Categories ▾
            </button>
            {isCatOpen && (
              <div
                onMouseEnter={() => setIsCatOpen(true)}
                className="absolute top-full left-0 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 animate-fadeIn"
              >
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    to={`/products?category=${encodeURIComponent(cat)}`}
                    onClick={() => setIsCatOpen(false)}
                    className="block px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/become-seller" className="hover:text-blue-600 transition text-blue-600 font-bold ml-auto">
            Become a Seller &rarr;
          </Link>

        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">🔍</button>
          </form>

          <nav className="flex flex-col gap-2 pt-2 text-sm font-semibold text-gray-700">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link to="/products" onClick={() => setIsMobileMenuOpen(false)}>All Products</Link>
            <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}>Shopping Cart ({cartItemCount})</Link>
            <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)}>Wishlist ({wishlistCount})</Link>
            <Link to="/become-seller" onClick={() => setIsMobileMenuOpen(false)} className="text-blue-600">Become a Seller</Link>
          </nav>
        </div>
      )}

    </header>
  );
};

export default Navbar;
