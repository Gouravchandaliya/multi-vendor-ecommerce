import { BrowserRouter, Routes, Route } from 'react-router';

// Layout
import Navbar          from '../components/layout/Navbar';
import Footer          from '../components/layout/Footer';

// Guards
import PrivateRoute    from './PrivateRoute';
import RoleRoute       from './RoleRoute';

// Public pages
import HomePage            from '../pages/public/HomePage';
import LoginPage           from '../pages/public/LoginPage';
import RegisterPage        from '../pages/public/RegisterPage';
import NotFoundPage        from '../pages/public/NotFoundPage';
import UnauthorizedPage    from '../pages/public/UnauthorizedPage';
import BecomeSeller        from '../pages/public/BecomeSeller';
import ProductListingPage  from '../pages/public/ProductListingPage';
import ProductDetailsPage  from '../pages/public/ProductDetailsPage';
import PublicStorePage     from '../pages/public/PublicStorePage';
import CartPage            from '../pages/public/CartPage';
import WishlistPage        from '../pages/public/WishlistPage';
import CheckoutPage        from '../pages/public/CheckoutPage';
import OrderSuccessPage    from '../pages/public/OrderSuccessPage';

// Protected pages
import BuyerDashboard          from '../pages/buyer/BuyerDashboard';
import MyOrdersPage            from '../pages/buyer/MyOrdersPage';
import OrderDetailsPage        from '../pages/buyer/OrderDetailsPage';
import MyReviewsPage           from '../pages/buyer/MyReviewsPage';
import SellerDashboard         from '../pages/seller/SellerDashboard';
import SellerOrdersPage        from '../pages/seller/SellerOrdersPage';
import SellerOrderDetailsPage  from '../pages/seller/SellerOrderDetailsPage';
import SellerReviewsPage       from '../pages/seller/SellerReviewsPage';
import StoreSettings           from '../pages/seller/StoreSettings';
import ManageProducts          from '../pages/seller/ManageProducts';
import AddProduct              from '../pages/seller/AddProduct';
import EditProduct             from '../pages/seller/EditProduct';
import AdminDashboard          from '../pages/admin/AdminDashboard';
import ManageStores            from '../pages/admin/ManageStores';
import AdminOrdersPage         from '../pages/admin/AdminOrdersPage';
import AdminReviewsPage        from '../pages/admin/AdminReviewsPage';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />

        <div className="flex-1">
          <Routes>

            {/* ── Public routes ───────────────────────────────────── */}
            <Route path="/"               element={<HomePage />} />
            <Route path="/products"       element={<ProductListingPage />} />
            <Route path="/products/:slug" element={<ProductDetailsPage />} />
            <Route path="/stores/:slug"   element={<PublicStorePage />} />
            <Route path="/cart"           element={<CartPage />} />
            <Route path="/wishlist"       element={<WishlistPage />} />
            <Route path="/unauthorized"   element={<UnauthorizedPage />} />

            {/* Redirect logged-in users away from auth pages */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ── Protected routes (must be logged in) ─────────────── */}
            <Route element={<PrivateRoute />}>

              {/* Checkout & Order Success */}
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />

              {/* Buyer routes */}
              <Route element={<RoleRoute roles={['buyer', 'seller', 'admin']} />}>
                <Route path="/buyer/dashboard"         element={<BuyerDashboard />} />
                <Route path="/account/orders"          element={<MyOrdersPage />} />
                <Route path="/account/orders/:orderId" element={<OrderDetailsPage />} />
                <Route path="/account/reviews"         element={<MyReviewsPage />} />
              </Route>

              {/* Seller routes */}
              <Route element={<RoleRoute roles={['seller', 'admin']} />}>
                <Route path="/seller/dashboard"        element={<SellerDashboard />} />
                <Route path="/seller/orders"           element={<SellerOrdersPage />} />
                <Route path="/seller/orders/:orderId"  element={<SellerOrderDetailsPage />} />
                <Route path="/seller/products"         element={<ManageProducts />} />
                <Route path="/seller/products/add"     element={<AddProduct />} />
                <Route path="/seller/products/edit/:id"element={<EditProduct />} />
                <Route path="/seller/reviews"          element={<SellerReviewsPage />} />
              </Route>

              {/* Store Settings & Onboarding routes */}
              <Route element={<RoleRoute roles={['buyer', 'seller', 'admin']} />}>
                <Route path="/become-seller"          element={<BecomeSeller />} />
                <Route path="/seller/store"           element={<StoreSettings />} />
                <Route path="/seller/store/edit"      element={<StoreSettings />} />
                <Route path="/seller/store-settings"  element={<StoreSettings />} />
              </Route>

              {/* Admin-only routes */}
              <Route element={<RoleRoute roles={['admin']} />}>
                <Route path="/admin/dashboard"         element={<AdminDashboard />} />
                <Route path="/admin/manage-stores"     element={<ManageStores />} />
                <Route path="/admin/stores"            element={<ManageStores />} />
                <Route path="/admin/stores/:id"        element={<ManageStores />} />
                <Route path="/admin/orders"            element={<AdminOrdersPage />} />
                <Route path="/admin/reviews"           element={<AdminReviewsPage />} />
              </Route>

            </Route>

            {/* ── 404 ─────────────────────────────────────────────── */}
            <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </div>

        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default AppRouter;
