import { Link } from 'react-router';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 text-sm border-t border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand & Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-base font-bold shadow-md">
                M
              </span>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Market<span className="text-blue-500">X</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              The premium multi-vendor marketplace connecting verified independent sellers with customers nationwide.
            </p>
          </div>

          {/* Column 2: Marketplace Discovery */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">Marketplace</h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/products" className="hover:text-white transition">All Products</Link></li>
              <li><Link to="/products?category=Electronics" className="hover:text-white transition">Electronics</Link></li>
              <li><Link to="/products?category=Fashion" className="hover:text-white transition">Fashion & Apparel</Link></li>
              <li><Link to="/products?category=Home%20%26%20Living" className="hover:text-white transition">Home & Living</Link></li>
            </ul>
          </div>

          {/* Column 3: Sell With Us */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">Sell With Us</h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/become-seller" className="hover:text-white transition font-medium text-blue-400">Apply to Become a Seller</Link></li>
              <li><Link to="/seller/dashboard" className="hover:text-white transition">Seller Dashboard</Link></li>
              <li><Link to="/seller/store-settings" className="hover:text-white transition">Store Settings</Link></li>
            </ul>
          </div>

          {/* Column 4: Customer Service & Admin */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">Account & Help</h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/account/orders" className="hover:text-white transition font-bold text-blue-400">📦 My Orders</Link></li>
              <li><Link to="/buyer/dashboard" className="hover:text-white transition">My Account</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Sign In / Register</Link></li>
              <li><Link to="/admin/dashboard" className="hover:text-white transition">Admin Portal</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} MarketX Marketplace Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-400 cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
