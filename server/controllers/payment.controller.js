const crypto       = require('crypto');
const Cart         = require('../models/Cart.model');
const Product      = require('../models/Product.model');
const Address      = require('../models/Address.model');
const Order        = require('../models/Order.model');
const ApiError     = require('../utils/ApiError');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

let Razorpay;
try {
  Razorpay = require('razorpay');
} catch {
  Razorpay = null;
}

// Initialize Razorpay SDK if API keys exist
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (Razorpay && keyId && keySecret && keyId !== 'your_razorpay_key_id') {
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return null;
};

// ─── Create Razorpay Order ───────────────────────────────────────────────────
const createRazorpayOrder = asyncHandler(async (req, res) => {
  // 1. Reload cart from MongoDB
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: 'name price discountPrice stock isActive store',
    populate: { path: 'store', select: 'status' },
  });

  if (!cart || !cart.items || cart.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty. Add products before checking out.');
  }

  // 2. Server-side validation of products and recalculation of totals
  let subtotal = 0;

  for (const item of cart.items) {
    const prod = item.product;

    if (!prod || !prod.isActive || !prod.store || prod.store.status !== 'approved') {
      throw new ApiError(400, `Product "${prod?.name || 'Item'}" is unavailable or belongs to an unapproved store.`);
    }

    if (item.quantity > prod.stock) {
      throw new ApiError(400, `Product "${prod.name}" has only ${prod.stock} item(s) in stock. You requested ${item.quantity}.`);
    }

    const unitPrice =
      prod.discountPrice && prod.discountPrice > 0 && prod.discountPrice < prod.price
        ? prod.discountPrice
        : prod.price;

    subtotal += unitPrice * item.quantity;
  }

  const shippingAmount = 0; // Configurable flat/free shipping
  const taxAmount      = 0; // Configurable tax
  const totalAmount    = Number((subtotal + shippingAmount + taxAmount).toFixed(2));
  const amountInPaise  = Math.round(totalAmount * 100);

  const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 3. Create Razorpay order
  const razorpay = getRazorpayInstance();
  let razorpayOrderId = '';

  if (razorpay) {
    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderNumber,
      notes: { userId: req.user._id.toString() },
    });
    razorpayOrderId = rzpOrder.id;
  } else {
    // Development / Test mode mock order ID
    razorpayOrderId = `order_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  return res.status(200).json(
    new ApiResponse(200, {
      razorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId',
      orderNumber,
      totalAmount,
    }, 'Razorpay payment order initialized')
  );
});

// ─── Verify Payment & Create Marketplace Order ─────────────────────────────
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    shippingAddressId,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !shippingAddressId) {
    throw new ApiError(400, 'Missing payment verification or shipping parameters');
  }

  // 1. Idempotency Check: prevent duplicate orders if client retries
  const existingOrder = await Order.findOne({ razorpayPaymentId: razorpay_payment_id });
  if (existingOrder) {
    return res.status(200).json(
      new ApiResponse(200, { order: existingOrder }, 'Payment already verified and order created.')
    );
  }

  // 2. Signature verification (if Razorpay Secret exists)
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (keySecret && keySecret !== 'your_razorpay_key_secret' && razorpay_signature) {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, 'Payment signature verification failed. Invalid transaction.');
    }
  }

  // 3. Verify shipping address ownership
  const address = await Address.findOne({ _id: shippingAddressId, user: req.user._id });
  if (!address) {
    throw new ApiError(404, 'Shipping address not found or unauthorized');
  }

  // 4. Reload cart from MongoDB
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    populate: { path: 'store' },
  });

  if (!cart || !cart.items || cart.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty. Order could not be created.');
  }

  // 5. Atomic Inventory Update & Order Item Snapshot creation
  const orderItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const prod = item.product;

    if (!prod || !prod.isActive || !prod.store || prod.store.status !== 'approved') {
      throw new ApiError(400, `Product "${prod?.name || 'Item'}" is no longer available.`);
    }

    // Atomic conditional decrement to prevent negative stock
    const updated = await Product.updateOne(
      { _id: prod._id, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );

    if (updated.modifiedCount === 0) {
      throw new ApiError(400, `Sufficient stock is no longer available for "${prod.name}".`);
    }

    const unitPrice =
      prod.discountPrice && prod.discountPrice > 0 && prod.discountPrice < prod.price
        ? prod.discountPrice
        : prod.price;

    const itemSubtotal = Number((unitPrice * item.quantity).toFixed(2));
    subtotal += itemSubtotal;

    orderItems.push({
      product: prod._id,
      seller: prod.seller,
      store: prod.store._id,
      productName: prod.name,
      productImage: prod.images && prod.images.length > 0 ? prod.images[0] : '',
      quantity: item.quantity,
      unitPrice,
      subtotal: itemSubtotal,
      status: 'placed',
    });
  }

  const shippingAmount = 0;
  const taxAmount      = 0;
  const totalAmount    = Number((subtotal + shippingAmount + taxAmount).toFixed(2));
  const orderNumber    = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 6. Create Marketplace Order
  const order = await Order.create({
    orderNumber,
    buyer: req.user._id,
    items: orderItems,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    },
    subtotal: Number(subtotal.toFixed(2)),
    shippingAmount,
    taxAmount,
    totalAmount,
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature || 'mock_sig',
    orderStatus: 'placed',
  });

  // 7. Clear Customer's Cart
  cart.items = [];
  await cart.save();

  return res.status(201).json(
    new ApiResponse(201, { order }, 'Payment verified and order created successfully')
  );
});

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};
