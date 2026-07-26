const Order        = require('../models/Order.model');
const Store        = require('../models/Store.model');
const Product      = require('../models/Product.model');
const ApiError     = require('../utils/ApiError');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const {
  isValidStatusTransition,
  deriveOverallOrderStatus,
} = require('../services/orderStatus.service');

// Helper to filter and sanitize order document for a specific seller
const formatSellerOrderResponse = (orderDoc, sellerId) => {
  const orderObj = orderDoc.toObject ? orderDoc.toObject() : orderDoc;

  // Filter items belonging ONLY to this seller
  const sellerItems = (orderObj.items || []).filter(
    (item) => item.seller && item.seller.toString() === sellerId.toString()
  );

  const sellerSubtotal = Number(
    sellerItems.reduce((acc, item) => acc + (item.subtotal || 0), 0).toFixed(2)
  );

  // Determine overall status for this seller's items
  const sellerFulfillmentStatus = deriveOverallOrderStatus(sellerItems);

  return {
    _id: orderObj._id,
    orderNumber: orderObj.orderNumber,
    createdAt: orderObj.createdAt,
    updatedAt: orderObj.updatedAt,
    paymentStatus: orderObj.paymentStatus,
    paymentMethod: orderObj.paymentMethod,
    shippingAddress: orderObj.shippingAddress,
    sellerItems,
    sellerSubtotal,
    sellerFulfillmentStatus,
    overallOrderStatus: orderObj.orderStatus,
  };
};

// ─── Get Seller Orders ────────────────────────────────────────────────────────
const getSellerOrders = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  // Verify active seller store exists
  const store = await Store.findOne({ seller: sellerId });
  if (!store) {
    throw new ApiError(403, 'You must create and verify a seller store before accessing seller orders.');
  }

  const { status, search, page = 1, limit = 10 } = req.query;
  const query = { 'items.seller': sellerId };

  if (status && status !== 'all') {
    query['items'] = { $elemMatch: { seller: sellerId, status } };
  }

  if (search) {
    query.orderNumber = { $regex: search.trim(), $options: 'i' };
  }

  const total = await Order.countDocuments(query);
  const skip  = (Number(page) - 1) * Number(limit);

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const sellerOrders = orders.map((ord) => formatSellerOrderResponse(ord, sellerId));

  return res.status(200).json(
    new ApiResponse(200, {
      orders: sellerOrders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Seller orders fetched successfully')
  );
});

// ─── Get Seller Order By ID ──────────────────────────────────────────────────
const getSellerOrderById = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const { orderId } = req.params;

  let query = { _id: orderId, 'items.seller': sellerId };
  if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
    query = { orderNumber: orderId, 'items.seller': sellerId };
  }

  const order = await Order.findOne(query);
  if (!order) {
    throw new ApiError(404, 'Order not found or unauthorized to view this seller order.');
  }

  const formattedOrder = formatSellerOrderResponse(order, sellerId);
  return res.status(200).json(new ApiResponse(200, { order: formattedOrder }, 'Seller order details fetched'));
});

// ─── Update Seller Order Fulfillment Status ──────────────────────────────────
const updateSellerOrderStatus = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const { orderId } = req.params;
  const { status: targetStatus, productId } = req.body;

  if (!targetStatus) throw new ApiError(400, 'Target status is required');

  let query = { _id: orderId, 'items.seller': sellerId };
  if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
    query = { orderNumber: orderId, 'items.seller': sellerId };
  }

  const order = await Order.findOne(query);
  if (!order) {
    throw new ApiError(404, 'Order not found or unauthorized to update this seller order.');
  }

  let updatedItemCount = 0;

  for (const item of order.items) {
    if (item.seller.toString() === sellerId.toString()) {
      if (productId && item.product.toString() !== productId.toString()) {
        continue;
      }

      const currentStatus = item.status || 'placed';

      if (!isValidStatusTransition(currentStatus, targetStatus)) {
        throw new ApiError(
          400,
          `Invalid status transition from "${currentStatus}" to "${targetStatus}".`
        );
      }

      // If transitioning to cancelled from non-cancelled, restore inventory once
      if (targetStatus === 'cancelled' && currentStatus !== 'cancelled') {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } }
        );
      }

      item.status = targetStatus;

      if (!item.statusHistory) item.statusHistory = [];
      item.statusHistory.push({
        status: targetStatus,
        timestamp: new Date(),
        updatedBy: sellerId,
      });

      updatedItemCount++;
    }
  }

  if (updatedItemCount === 0) {
    throw new ApiError(400, 'No matching items found for this seller to update.');
  }

  // Recalculate overall order status
  order.orderStatus = deriveOverallOrderStatus(order.items);
  await order.save();

  const formattedOrder = formatSellerOrderResponse(order, sellerId);
  return res.status(200).json(
    new ApiResponse(200, { order: formattedOrder }, 'Order status updated successfully')
  );
});

// ─── Get Seller Dashboard Metrics ────────────────────────────────────────────
const getSellerMetrics = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  const orders = await Order.find({ 'items.seller': sellerId });

  let totalOrders      = orders.length;
  let pendingOrders    = 0;
  let processingOrders = 0;
  let shippedOrders    = 0;
  let deliveredOrders  = 0;
  let sellerSales      = 0;

  orders.forEach((ord) => {
    const sellerItems = ord.items.filter(
      (item) => item.seller && item.seller.toString() === sellerId.toString()
    );

    sellerItems.forEach((item) => {
      if (ord.paymentStatus === 'paid' && item.status !== 'cancelled') {
        sellerSales += item.subtotal || 0;
      }

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
        default:
          break;
      }
    });
  });

  return res.status(200).json(
    new ApiResponse(200, {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      sellerSales: Number(sellerSales.toFixed(2)),
    }, 'Seller dashboard metrics calculated')
  );
});

module.exports = {
  getSellerOrders,
  getSellerOrderById,
  updateSellerOrderStatus,
  getSellerMetrics,
};
