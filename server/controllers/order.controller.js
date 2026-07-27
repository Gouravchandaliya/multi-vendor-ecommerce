const Order        = require('../models/Order.model');
const Product      = require('../models/Product.model');
const ApiError     = require('../utils/ApiError');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { deriveOverallOrderStatus } = require('../services/orderStatus.service');

// ─── Get Customer Orders ──────────────────────────────────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip  = (Number(page) - 1) * Number(limit);
  const filter = { buyer: req.user._id };

  const total  = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .populate('items.product', 'name slug images price')
    .populate('items.store', 'name slug logo')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.status(200).json(
    new ApiResponse(200, {
      orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'My orders fetched successfully')
  );
});

// ─── Get Order By ID / Order Number ──────────────────────────────────────────
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let query = { _id: id };
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    query = { orderNumber: id };
  }

  const order = await Order.findOne(query)
    .populate('items.product', 'name slug images price')
    .populate('items.store', 'name slug logo description city country')
    .populate('items.seller', 'name email');

  if (!order) throw new ApiError(404, 'Order not found');

  // Verify ownership (Buyer or Admin)
  if (order.buyer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Access denied. You do not own this order.');
  }

  return res.status(200).json(new ApiResponse(200, { order }, 'Order fetched successfully'));
});

// ─── Buyer Cancel Order ───────────────────────────────────────────────────────
const cancelBuyerOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { productId } = req.body;

  let query = { _id: id, buyer: req.user._id };
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    query = { orderNumber: id, buyer: req.user._id };
  }

  const order = await Order.findOne(query);
  if (!order) throw new ApiError(404, 'Order not found or unauthorized');

  let cancelledCount = 0;

  for (const item of order.items) {
    if (productId && item.product.toString() !== productId.toString()) {
      continue;
    }

    // Cancellation allowed only before shipment
    if (['placed', 'confirmed', 'processing'].includes(item.status)) {
      item.status = 'cancelled';
      if (!item.statusHistory) item.statusHistory = [];
      item.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        updatedBy: req.user._id,
      });

      // Restore inventory atomically
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } }
      );

      cancelledCount++;
    }
  }

  if (cancelledCount === 0) {
    throw new ApiError(400, 'Order items cannot be cancelled once shipped or delivered.');
  }

  order.orderStatus = deriveOverallOrderStatus(order.items);
  await order.save();

  return res.status(200).json(
    new ApiResponse(200, { order }, 'Order cancelled successfully. Inventory restored.')
  );
});

// ─── Admin Get All Orders ─────────────────────────────────────────────────────
const getAdminOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const query = {};

  if (status && status !== 'all') {
    query.orderStatus = status;
  }
  if (search) {
    query.orderNumber = { $regex: search.trim(), $options: 'i' };
  }

  const total  = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('buyer', 'name email')
    .populate('items.product', 'name slug images price')
    .populate('items.store', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.status(200).json(
    new ApiResponse(200, {
      orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Admin orders list fetched')
  );
});

module.exports = {
  getMyOrders,
  getOrderById,
  cancelBuyerOrder,
  getAdminOrders,
};
