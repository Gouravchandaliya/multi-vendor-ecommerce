const mongoose     = require('mongoose');
const Order        = require('../models/Order.model');
const Store        = require('../models/Store.model');
const Product      = require('../models/Product.model');
const User         = require('../models/User.model');
const ApiError     = require('../utils/ApiError');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const LOW_STOCK_THRESHOLD = 5;

/**
 * GET /api/v1/admin/analytics?range=30d
 * Strict backend authorization check: Only users with role === 'admin' can execute.
 */
const getAdminAnalytics = asyncHandler(async (req, res) => {
  // Double-check backend authorization security
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Access denied. Administrator privilege is required.');
  }

  // 1. Parse and validate time range
  const { range = '30d' } = req.query;
  const allowedRanges = ['7d', '30d', '90d', '1y'];
  const selectedRange = allowedRanges.includes(range) ? range : '30d';

  const now = new Date();
  let startDate = new Date();

  if (selectedRange === '7d') {
    startDate.setDate(now.getDate() - 7);
  } else if (selectedRange === '30d') {
    startDate.setDate(now.getDate() - 30);
  } else if (selectedRange === '90d') {
    startDate.setDate(now.getDate() - 90);
  } else if (selectedRange === '1y') {
    startDate.setFullYear(now.getFullYear() - 1);
  }

  // 2. Overview KPIs
  // 2a. Marketplace Revenue & Order Count in range
  const paidOrdersInRange = await Order.find({
    paymentStatus: 'paid',
    orderStatus: { $ne: 'cancelled' },
    createdAt: { $gte: startDate },
  });

  const totalRevenue = paidOrdersInRange.reduce((acc, ord) => acc + (ord.totalAmount || 0), 0);
  const totalOrders  = await Order.countDocuments({ createdAt: { $gte: startDate } });

  // 2b. User counts
  const totalUsers   = await User.countDocuments();
  const totalBuyers  = await User.countDocuments({ role: 'buyer' });
  const totalSellers = await User.countDocuments({ role: 'seller' });

  // 2c. Store status breakdown
  const totalStores    = await Store.countDocuments();
  const pendingStores  = await Store.countDocuments({ status: 'pending' });
  const approvedStores = await Store.countDocuments({ status: 'approved' });
  const rejectedStores = await Store.countDocuments({ status: 'rejected' });
  const suspendedStores= await Store.countDocuments({ status: 'suspended' });

  // 2d. Product inventory metrics
  const totalProducts    = await Product.countDocuments();
  const activeProducts   = await Product.countDocuments({ isActive: true });
  const lowStockCount    = await Product.countDocuments({ stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } });
  const outOfStockCount  = await Product.countDocuments({ stock: 0 });

  // 3. Revenue Trend Aggregation Pipeline
  const revenueTrendPipeline = [
    {
      $match: {
        createdAt: { $gte: startDate },
        paymentStatus: 'paid',
        orderStatus: { $ne: 'cancelled' },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const trendResults = await Order.aggregate(revenueTrendPipeline);
  const revenueTrend = trendResults.map((t) => ({
    date: t._id,
    revenue: Number((t.revenue || 0).toFixed(2)),
    orders: t.orders,
  }));

  // 4. User Growth Aggregation Pipeline
  const userGrowthPipeline = [
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        users: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const userGrowthResults = await User.aggregate(userGrowthPipeline);
  const userGrowth = userGrowthResults.map((u) => ({
    date: u._id,
    users: u.users,
  }));

  // 5. Order Status Breakdown
  const allOrders = await Order.find();
  let pendingCount = 0;
  let processingCount = 0;
  let shippedCount = 0;
  let deliveredCount = 0;
  let cancelledCount = 0;

  allOrders.forEach((ord) => {
    switch (ord.orderStatus) {
      case 'placed':
      case 'confirmed':
      case 'pending':
        pendingCount++;
        break;
      case 'processing':
        processingCount++;
        break;
      case 'shipped':
      case 'out_for_delivery':
        shippedCount++;
        break;
      case 'delivered':
        deliveredCount++;
        break;
      case 'cancelled':
        cancelledCount++;
        break;
      default:
        break;
    }
  });

  const orderStatusBreakdown = [
    { status: 'Pending', count: pendingCount, color: '#f59e0b' },
    { status: 'Processing', count: processingCount, color: '#3b82f6' },
    { status: 'Shipped', count: shippedCount, color: '#8b5cf6' },
    { status: 'Delivered', count: deliveredCount, color: '#10b981' },
    { status: 'Cancelled', count: cancelledCount, color: '#ef4444' },
  ];

  // 6. Top Stores / Sellers Pipeline (Ranked by gross item revenue)
  const topSellersPipeline = [
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$items' },
    { $match: { 'items.status': { $ne: 'cancelled' } } },
    {
      $group: {
        _id: '$items.store',
        totalRevenue: { $sum: '$items.subtotal' },
        totalSold: { $sum: '$items.quantity' },
        orderIds: { $addToSet: '$_id' },
      },
    },
    {
      $lookup: {
        from: 'stores',
        localField: '_id',
        foreignField: '_id',
        as: 'storeDoc',
      },
    },
    { $unwind: '$storeDoc' },
    { $sort: { totalRevenue: -1 } },
    { $limit: 5 },
  ];

  const topSellersRaw = await Order.aggregate(topSellersPipeline);
  const topSellers = topSellersRaw.map((s) => ({
    storeId: s._id,
    storeName: s.storeDoc ? s.storeDoc.name : 'Store',
    storeSlug: s.storeDoc ? s.storeDoc.slug : '',
    totalRevenue: Number((s.totalRevenue || 0).toFixed(2)),
    totalSold: s.totalSold,
    totalOrders: s.orderIds.length,
  }));

  // 7. Top Selling Products Pipeline (Across all stores)
  const topProductsPipeline = [
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$items' },
    { $match: { 'items.status': { $ne: 'cancelled' } } },
    {
      $group: {
        _id: '$items.product',
        productName: { $first: '$items.productName' },
        productImage: { $first: '$items.productImage' },
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.subtotal' },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 5 },
  ];

  const topProducts = await Order.aggregate(topProductsPipeline);

  // 8. Recent 5 Marketplace Orders
  const recentOrdersRaw = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('buyer', 'name email');

  const recentOrders = recentOrdersRaw.map((ord) => ({
    _id: ord._id,
    orderNumber: ord.orderNumber,
    buyerName: ord.buyer ? ord.buyer.name : 'Customer',
    createdAt: ord.createdAt,
    totalAmount: ord.totalAmount,
    paymentStatus: ord.paymentStatus,
    orderStatus: ord.orderStatus,
    itemsCount: (ord.items || []).length,
  }));

  // 9. Recent 5 Registered Users (excluding sensitive security hashes)
  const recentUsers = await User.find()
    .select('-password -refreshToken')
    .sort({ createdAt: -1 })
    .limit(5);

  // 10. Structured Response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        range: selectedRange,
        overview: {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalOrders,
          totalUsers,
          totalBuyers,
          totalSellers,
          totalStores,
          pendingStores,
          approvedStores,
          rejectedStores,
          suspendedStores,
          totalProducts,
          activeProducts,
          lowStockCount,
          outOfStockCount,
        },
        revenueTrend,
        userGrowth,
        orderStatusBreakdown,
        topSellers,
        topProducts,
        recentOrders,
        recentUsers,
      },
      'Admin analytics fetched successfully'
    )
  );
});

module.exports = {
  getAdminAnalytics,
};
