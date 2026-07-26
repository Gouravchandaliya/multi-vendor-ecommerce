import { Link, useLocation } from 'react-router';

const SellerSidebar = ({ isApproved = false }) => {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/seller/dashboard', icon: '📊', enabled: true },
    { name: 'Orders', path: '/seller/orders', icon: '📦', enabled: isApproved },
    { name: 'Products', path: '/seller/products', icon: '🏷️', enabled: isApproved },
    { name: 'Reviews', path: '/seller/reviews', icon: '💬', enabled: isApproved },
    { name: 'Store Settings', path: '/seller/store-settings', icon: '⚙️', enabled: true },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col gap-2 flex-shrink-0 hidden md:flex">
      <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
        Seller Console
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.path;

          if (!link.enabled) {
            return (
              <div
                key={link.name}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-50/60 cursor-not-allowed select-none"
              >
                <div className="flex items-center gap-3">
                  <span>{link.icon}</span>
                  <span>{link.name}</span>
                </div>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-semibold">
                  Locked
                </span>
              </div>
            );
          }

          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default SellerSidebar;
