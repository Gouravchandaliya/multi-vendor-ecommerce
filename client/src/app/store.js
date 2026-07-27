import { configureStore } from '@reduxjs/toolkit';
import authReducer            from '../features/auth/authSlice';
import storeReducer           from '../features/store/storeSlice';
import productReducer         from '../features/product/productSlice';
import cartReducer            from '../features/cart/cartSlice';
import wishlistReducer        from '../features/wishlist/wishlistSlice';
import addressReducer         from '../features/address/addressSlice';
import orderReducer           from '../features/order/orderSlice';
import sellerOrderReducer     from '../features/seller/sellerOrderSlice';
import sellerAnalyticsReducer from '../features/seller/sellerAnalyticsSlice';
import adminAnalyticsReducer  from '../features/admin/adminAnalyticsSlice';
import reviewReducer          from '../features/review/reviewSlice';

const store = configureStore({
  reducer: {
    auth:            authReducer,
    store:           storeReducer,
    product:         productReducer,
    cart:            cartReducer,
    wishlist:        wishlistReducer,
    address:         addressReducer,
    order:           orderReducer,
    sellerOrder:     sellerOrderReducer,
    sellerAnalytics: sellerAnalyticsReducer,
    adminAnalytics:  adminAnalyticsReducer,
    review:          reviewReducer,
  },
});

export default store;
