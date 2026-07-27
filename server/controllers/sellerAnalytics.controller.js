const mongoose     = require('mongoose');
const Order        = require('../models/Order.model');
const Store        = require('../models/Store.model');
const Product      = require('../models/Product.model');
const ApiError     = require('../utils/ApiError');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const LOW_STOCK_THRESHOLD = 5;

/**
 * GET /api/v1/seller/orders/analytics?range=30d
 * Strictly calculates real analytics for the authenticated seller (req.user._id).
 */
const getSellerAnalytics = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  // 1. Verify seller store exists
  const store = await Store.findOne({ seller: sellerId });
  if (!store) {
    throw new ApiError(403, 'You must create a store before accessing analytics.');
  }

  // 2. Parse and validate time range
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

  // 3. Overview KPIs
  // 3a. Total Seller Revenue & Orders in time range
  const allTimeOrders = await Order.find({ 'items.seller': sellerId });
  const rangeOrders   = await Order.find({
    'items.seller': sellerId,
    createdAt: { $gte: startDate },
  });

  let totalRevenue     = 0;
  let totalOrders      = rangeOrders.length;
  let pendingOrders    = 0;
  let processingOrders = 0;
  let shippedOrders    = 0;
  let deliveredOrders  = 0;
  let cancelledOrders  = 0;

  // Track status breakdown over all orders belonging to seller
  allTimeOrders.forEach((ord) => {
    const sellerItems = (ord.items || []).filter(
      (item) => item.seller && item.seller.toString() === sellerId.toString()
    );

    sellerItems.forEach((item) => {
      // Revenue is counted for paid orders and non-cancelled items in selected range
      if (
        ord.createdAt >= startDate &&
        ord.paymentStatus === 'paid' &&
        item.status !== 'cancelled'
      ) {
        totalRevenue += item.subtotal || 0;
      }

      // Status breakdown
      switch (item.status) {
        case 'placed':
        case 'confirmed':
          pendingOrders++;
          break;
        case 'processing':
          processingOrders++;
          break;
        case 'shipped':
        case 'out_for_delivery':
          shippedOrders++;
          break;
        case 'delivered':
          deliveredOrders++;
          break;
        case 'cancelled':
          cancelledOrders++;
          break;
        default:
          break;
      }
    });
  });

  // 3b. Product inventory KPIs
  const totalProducts    = await Product.countDocuments({ seller: sellerId });
  const activeProducts   = await Product.countDocuments({ seller: sellerId, isActive: true });
  const lowStockCount    = await Product.countDocuments({
    seller: sellerId,
    stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD },
  });
  const outOfStockCount  = await Product.countDocuments({ seller: sellerId, stock: 0 });

  // 3c. Unique Customers (distinct buyers who purchased from this seller in paid orders)
  const uniqueBuyers = await Order.distinct('buyer', {
    'items.seller': sellerId,
    paymentStatus: 'paid',
  });
  const totalCustomers = uniqueBuyers.length;

  // 4. Revenue & Order Trend Aggregation Pipeline
  const trendPipeline = [
    {
      $match: {
        createdAt: { $gte: startDate },
        paymentStatus: 'paid',
        'items.seller': new mongoose.Types.ObjectId(sellerId.toString()),
      },
    },
    { $unwind: '$items' },
    {
      $match: {
        'items.seller': new mongoose.Types.ObjectId(sellerId.toString()),
        'items.status': { $ne: 'cancelled' },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        dailyRevenue: { $sum: '$items.subtotal' },
        orderIds: { $addToSet: '$_id' },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const trendResults = await Order.aggregate(trendPipeline);

  const revenueTrend = trendResults.map((t) => ({
    date: t._id,
    revenue: Number((t.dailyRevenue || 0).toFixed(2)),
    orders: t.orderIds.length,
  }));

  // 5. Order Status Breakdown Object
  const orderStatusBreakdown = [
    { status: 'Pending', count: pendingOrders, color: '#f59e0b' },
    { status: 'Processing', count: processingOrders, color: '#3b82f6' },
    { status: 'Shipped', count: shippedOrders, color: '#8b5cf6' },
    { status: 'Delivered', count: deliveredOrders, color: '#10b981' },
    { status: 'Cancelled', count: cancelledOrders, color: '#ef4444' },
  ];

  // 6. Top Selling Products Aggregation Pipeline
  const topProductsPipeline = [
    {
      $match: {
        paymentStatus: 'paid',
        'items.seller': new mongoose.Types.ObjectId(sellerId.toString()),
      },
    },
    { $unwind: '$items' },
    {
      $match: {
        'items.seller': new mongoose.Types.ObjectId(sellerId.toString()),
        'items.status': { $ne: 'cancelled' },
      },
    },
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

  // 7. Recent 5 Orders (Populated with buyer name & sanitized seller total)
  const recentOrdersRaw = await Order.find({ 'items.seller': sellerId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('buyer', 'name email');

  const recentOrders = recentOrdersRaw.map((ord) => {
    const sellerItems = (ord.items || []).filter(
      (item) => item.seller && item.seller.toString() === sellerId.toString()
    );
    const sellerSubtotal = sellerItems.reduce((acc, item) => acc + (item.subtotal || 0), 0);

    return {
      _id: ord._id,
      orderNumber: ord.orderNumber,
      buyerName: ord.buyer ? ord.buyer.name : 'Customer',
      createdAt: ord.createdAt,
      paymentStatus: ord.paymentStatus,
      orderStatus: ord.orderStatus,
      itemsCount: sellerItems.length,
      sellerSubtotal: Number(sellerSubtotal.toFixed(2)),
    };
  });

  // 8. Low Stock & Out of Stock Items (sorted stock ascending)
  const lowStockItems = await Product.find({
    seller: sellerId,
    stock: { $lte: LOW_STOCK_THRESHOLD },
  })
    .select('_id name slug price stock images category brand')
    .sort({ stock: 1 })
    .limit(10);

  // 9. Structured Response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        store: {
          name: store.name,
          slug: store.slug,
          status: store.status,
        },
        range: selectedRange,
        overview: {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalOrders,
          totalProducts,
          activeProducts,
          totalCustomers,
          pendingOrders,
          lowStockCount,
          outOfStockCount,
        },
        revenueTrend,
        orderStatusBreakdown,
        topProducts,
        recentOrders,
        lowStockItems,
      },
      'Seller analytics fetched successfully'
    )
  );
});

module.exports = {
  getSellerAnalytics,
};
