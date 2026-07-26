const Wishlist     = require('../models/Wishlist.model');
const Cart         = require('../models/Cart.model');
const Product      = require('../models/Product.model');
const ApiError     = require('../utils/ApiError');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Helper to populate wishlist products.
 */
const formatWishlistResponse = async (wishlistDoc) => {
  await wishlistDoc.populate({
    path: 'products',
    select: 'name slug price discountPrice stock images isActive store category brand',
    populate: {
      path: 'store',
      select: 'name slug status logo',
    },
  });

  // Filter out any deleted products
  wishlistDoc.products = wishlistDoc.products.filter((p) => p !== null);

  return {
    _id: wishlistDoc._id,
    user: wishlistDoc.user,
    products: wishlistDoc.products,
    itemCount: wishlistDoc.products.length,
    updatedAt: wishlistDoc.updatedAt,
  };
};

// ─── Get Wishlist ─────────────────────────────────────────────────────────────
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  const formatted = await formatWishlistResponse(wishlist);
  return res.status(200).json(new ApiResponse(200, { wishlist: formatted }, 'Wishlist fetched successfully'));
});

// ─── Add Product to Wishlist ──────────────────────────────────────────────────
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  const alreadyAdded = wishlist.products.some(
    (p) => p.toString() === productId
  );

  if (!alreadyAdded) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  const formatted = await formatWishlistResponse(wishlist);
  return res.status(200).json(new ApiResponse(200, { wishlist: formatted }, 'Product added to wishlist'));
});

// ─── Remove Product from Wishlist ─────────────────────────────────────────────
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) throw new ApiError(404, 'Wishlist not found');

  wishlist.products = wishlist.products.filter(
    (p) => p.toString() !== productId
  );

  await wishlist.save();
  const formatted = await formatWishlistResponse(wishlist);

  return res.status(200).json(new ApiResponse(200, { wishlist: formatted }, 'Product removed from wishlist'));
});

// ─── Move Product from Wishlist to Cart ────────────────────────────────────────
const moveToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // 1. Verify product & store
  const product = await Product.findById(productId).populate('store', 'status');
  if (!product || !product.isActive || !product.store || product.store.status !== 'approved') {
    throw new ApiError(400, 'Product is unavailable or belongs to an unapproved store');
  }

  if (product.stock <= 0) {
    throw new ApiError(400, 'Product is out of stock');
  }

  // 2. Remove from Wishlist
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== productId
    );
    await wishlist.save();
  }

  // 3. Add to Cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const idx = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (idx > -1) {
    if (cart.items[idx].quantity < product.stock) {
      cart.items[idx].quantity += 1;
    }
  } else {
    cart.items.push({ product: productId, quantity: 1 });
  }

  await cart.save();

  const formattedWishlist = wishlist ? await formatWishlistResponse(wishlist) : { products: [] };

  return res.status(200).json(
    new ApiResponse(200, { wishlist: formattedWishlist }, 'Product moved to cart')
  );
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
};
