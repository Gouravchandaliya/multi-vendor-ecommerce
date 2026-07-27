const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const healthRoutes         = require('./routes/health.routes');
const authRoutes           = require('./routes/auth.routes');
const storeRoutes          = require('./routes/store.routes');
const productRoutes        = require('./routes/product.routes');
const cartRoutes           = require('./routes/cart.routes');
const wishlistRoutes       = require('./routes/wishlist.routes');
const addressRoutes        = require('./routes/address.routes');
const paymentRoutes        = require('./routes/payment.routes');
const orderRoutes          = require('./routes/order.routes');
const sellerOrderRoutes    = require('./routes/sellerOrder.routes');
const sellerAiRoutes       = require('./routes/sellerAi.routes');
const reviewRoutes         = require('./routes/review.routes');
const adminAnalyticsRoutes = require('./routes/adminAnalytics.routes');
const adminUserRoutes      = require('./routes/adminUser.routes');
const errorHandler         = require('./middleware/errorHandler');
const ApiError             = require('./utils/ApiError');

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins =
  process.env.NODE_ENV === 'development'
    ? [/^http:\/\/localhost(:\d+)?$/]
    : [process.env.CLIENT_URL];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ─── Body Parsing Middleware ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/v1/health',           healthRoutes);
app.use('/api/v1/auth',             authRoutes);
app.use('/api/v1/stores',           storeRoutes);
app.use('/api/v1/products',         productRoutes);
app.use('/api/v1/cart',             cartRoutes);
app.use('/api/v1/wishlist',         wishlistRoutes);
app.use('/api/v1/addresses',        addressRoutes);
app.use('/api/v1/payments',         paymentRoutes);
app.use('/api/v1/orders',           orderRoutes);
app.use('/api/v1/seller/orders',    sellerOrderRoutes);
app.use('/api/v1/seller/ai',        sellerAiRoutes);
app.use('/api/v1/reviews',          reviewRoutes);
app.use('/api/v1/admin/analytics',  adminAnalyticsRoutes);
app.use('/api/v1/admin/users',      adminUserRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
