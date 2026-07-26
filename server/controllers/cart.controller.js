const Cart         = require('../models/Cart.model');
const Product      = require('../models/Product.model');
const Store        = require('../models/Store.model');
const ApiError     = require('../utils/ApiError');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Helper to compute populated cart response with backend-calculated prices and availability status.
 */
const formatCartResponse = async (userCart) => {
  await userCart.populate({
    path: 'items.product',
    select: 'name slug price discountPrice stock images isActive store category brand',
    populate: {
      path: 'store',
      select: 'name slug status logo',
    },
  });

  let subtotal = 0;
  let itemCount = 0;

  const formattedItems = userCart.items.map((item) => {
    const prod = item.product;

    if (!prod || !prod.isActive || !prod.store || prod.store.status !== 'approved') {
      return {
        product: prod || { _id: item.product },
        quantity: item.quantity,
        unitPrice: 0,
        itemSubtotal: 0,
        isAvailable: false,
        unavailabilityReason: !prod
          ? 'Product no longer exists'
          : !prod.isActive
          ? 'Product is currently inactive'
          : 'Store is currently unavailable',
      };
    }

    const isOutOfStock = prod.stock <= 0;
    const isOverStock  = item.quantity > prod.stock;

    const unitPrice =
      prod.discountPrice && prod.discountPrice > 0 && prod.discountPrice < prod.price
        ? prod.discountPrice
        : prod.price;

    const itemSubtotal = unitPrice * item.quantity;

    if (!isOutOfStock) {
      subtotal += itemSubtotal;
      itemCount += item.quantity;
    }

    return {
      product: prod,
      quantity: item.quantity,
      unitPrice,
      itemSubtotal,
      isAvailable: !isOutOfStock,
      unavailabilityReason: isOutOfStock
        ? 'Out of stock'
        : isOverStock
        ? `Only ${prod.stock} left in stock`
        : null,
    };
  });

  return {
    _id: userCart._id,
    user: userCart.user,
    items: formattedItems,
    subtotal: Number(subtotal.toFixed(2)),
    shipping: 0, // Shipping placeholder - calculated at checkout
    tax: 0,      // Tax placeholder - calculated at checkout
    total: Number(subtotal.toFixed(2)),
    itemCount,
    updatedAt: userCart.updatedAt,
  };
};

// ─── Get User Cart ────────────────────────────────────────────────────────────
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const formatted = await formatCartResponse(cart);
  return res.status(200).json(new ApiResponse(200, { cart: formatted }, 'Cart fetched successfully'));
});

// ─── Add Item to Cart ─────────────────────────────────────────────────────────
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const numQuantity = Number(quantity);

  if (!productId) throw new ApiError(400, 'Product ID is required');
  if (numQuantity < 1) throw new ApiError(400, 'Quantity must be at least 1');

  // 1. Verify product & store
  const product = await Product.findById(productId).populate('store', 'status');
  if (!product || !product.isActive || !product.store || product.store.status !== 'approved') {
    throw new ApiError(404, 'Product is unavailable or belongs to an unapproved store');
  }

  // 2. Find or create user cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // 3. Stock validation
  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  const currentQtyInCart = existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0;
  const targetQuantity   = currentQtyInCart + numQuantity;

  if (targetQuantity > product.stock) {
    throw new ApiError(
      400,
      `Cannot add ${numQuantity} item(s). Stock limit is ${product.stock} (you currently have ${currentQtyInCart} in cart)`
    );
  }

  // 4. Update cart items
  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity = targetQuantity;
  } else {
    cart.items.push({ product: productId, quantity: targetQuantity });
  }

  await cart.save();
  const formatted = await formatCartResponse(cart);

  return res.status(200).json(new ApiResponse(200, { cart: formatted }, 'Item added to cart'));
});

// ─── Update Item Quantity ─────────────────────────────────────────────────────
const updateCartItemQuantity = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity }  = req.body;
  const numQuantity   = Number(quantity);

  if (numQuantity < 1) {
    throw new ApiError(400, 'Quantity must be at least 1. Use remove to delete item.');
  }

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  if (numQuantity > product.stock) {
    throw new ApiError(400, `Requested quantity ${numQuantity} exceeds available stock of ${product.stock}`);
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) throw new ApiError(404, 'Product not in cart');

  cart.items[itemIndex].quantity = numQuantity;
  await cart.save();

  const formatted = await formatCartResponse(cart);
  return res.status(200).json(new ApiResponse(200, { cart: formatted }, 'Cart updated'));
});

// ─── Remove Item from Cart ───────────────────────────────────────────────────
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');

  cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  await cart.save();

  const formatted = await formatCartResponse(cart);
  return res.status(200).json(new ApiResponse(200, { cart: formatted }, 'Item removed from cart'));
});

// ─── Clear Cart ───────────────────────────────────────────────────────────────
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  const emptyCart = {
    _id: cart?._id,
    user: req.user._id,
    items: [],
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    itemCount: 0,
  };

  return res.status(200).json(new ApiResponse(200, { cart: emptyCart }, 'Cart cleared'));
});

// ─── Merge Guest Cart ─────────────────────────────────────────────────────────
const mergeGuestCart = asyncHandler(async (req, res) => {
  const { guestItems = [] } = req.body;

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  for (const gItem of guestItems) {
    if (!gItem.productId || !gItem.quantity) continue;

    const product = await Product.findById(gItem.productId).populate('store', 'status');
    if (!product || !product.isActive || !product.store || product.store.status !== 'approved') {
      continue; // Skip invalid guest products
    }

    const idx = cart.items.findIndex(
      (item) => item.product.toString() === gItem.productId
    );

    const existingQty = idx > -1 ? cart.items[idx].quantity : 0;
    const combinedQty = Math.min(product.stock, existingQty + Number(gItem.quantity));

    if (combinedQty > 0) {
      if (idx > -1) {
        cart.items[idx].quantity = combinedQty;
      } else {
        cart.items.push({ product: gItem.productId, quantity: combinedQty });
      }
    }
  }

  await cart.save();
  const formatted = await formatCartResponse(cart);

  return res.status(200).json(new ApiResponse(200, { cart: formatted }, 'Guest cart merged successfully'));
});

module.exports = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  mergeGuestCart,
};
