const mongoose             = require('mongoose');
const { validationResult } = require('express-validator');
const Product              = require('../models/Product.model');
const Store                = require('../models/Store.model');
const ApiError             = require('../utils/ApiError');
const ApiResponse          = require('../utils/ApiResponse');
const asyncHandler         = require('../utils/asyncHandler');
const generateUniqueProductSlug = require('../utils/generateProductSlug');
const cloudinary           = require('../config/cloudinary');

/**
 * Helper to upload a file to Cloudinary using upload_stream.
 * Falls back to Base64 data URI if Cloudinary credentials are not configured in .env.
 */
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      const mime = file.mimetype || 'image/png';
      const base64 = `data:${mime};base64,${file.buffer.toString('base64')}`;
      return resolve(base64);
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'marketplace/products' },
      (error, result) => {
        if (error) reject(new ApiError(500, 'Image upload failed: ' + error.message));
        else resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
};

/**
 * Helper to safely escape user input for RegExp queries
 */
const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// ─── Create Product ───────────────────────────────────────────────────────────
const createProduct = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, 'Validation failed', errors.array());

  // 1. Verify seller has an approved store
  const store = await Store.findOne({ seller: req.user._id });
  if (!store) {
    throw new ApiError(404, 'You must create a store before listing products.');
  }
  if (store.status !== 'approved') {
    throw new ApiError(403, 'Your store must be approved by an administrator before publishing products.');
  }

  const { name, description, category, brand, price, discountPrice, stock, isActive } = req.body;

  // 2. Validate discount price logic
  const numPrice = Number(price);
  const numDiscount = discountPrice ? Number(discountPrice) : 0;
  if (numDiscount > numPrice) {
    throw new ApiError(400, 'Discount price must be less than or equal to original price.');
  }

  // 3. Upload files to Cloudinary (or local Base64 fallback)
  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map((file) => uploadToCloudinary(file));
    imageUrls = await Promise.all(uploadPromises);
  }

  const slug = await generateUniqueProductSlug(name);

  // 4. Create Product
  const product = await Product.create({
    name,
    slug,
    description,
    category,
    brand,
    price: numPrice,
    discountPrice: numDiscount,
    stock: Number(stock),
    images: imageUrls,
    seller: req.user._id,
    store: store._id,
    isActive: isActive === 'true' || isActive === true,
  });

  return res.status(201).json(
    new ApiResponse(201, { product }, 'Product created successfully')
  );
});

// ─── Get Seller Products ──────────────────────────────────────────────────────
const getSellerProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  const parsedPage  = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  const filter = { seller: req.user._id };
  if (search && typeof search === 'string' && search.trim()) {
    filter.name = { $regex: escapeRegex(search.trim()), $options: 'i' };
  }

  const skip  = (parsedPage - 1) * parsedLimit;
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit);

  return res.status(200).json(
    new ApiResponse(200, {
      products,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    }, 'Seller products fetched')
  );
});

// ─── Get Product By ID (Seller/Internal) ───────────────────────────────────────
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('store', 'name slug status');

  if (!product) throw new ApiError(404, 'Product not found');

  return res.status(200).json(
    new ApiResponse(200, { product }, 'Product fetched')
  );
});

// ─── Update Product ───────────────────────────────────────────────────────────
const updateProduct = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, 'Validation failed', errors.array());

  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  // Verify ownership
  if (product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied. You do not own this product.');
  }

  const { name, description, category, brand, price, discountPrice, stock, isActive, existingImages } = req.body;

  // Validate discount price logic
  const finalPrice = price !== undefined ? Number(price) : product.price;
  const finalDiscount = discountPrice !== undefined ? Number(discountPrice) : product.discountPrice;
  if (finalDiscount > finalPrice) {
    throw new ApiError(400, 'Discount price must be less than or equal to original price.');
  }

  // Handle images: parsed existing images + new uploads
  let parsedExisting = [];
  if (existingImages) {
    try {
      parsedExisting = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
    } catch {
      parsedExisting = Array.isArray(existingImages) ? existingImages : [existingImages];
    }
  }

  let newImageUrls = [];
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map((file) => uploadToCloudinary(file));
    newImageUrls = await Promise.all(uploadPromises);
  }

  const combinedImages = [...parsedExisting, ...newImageUrls];

  // Update slug if name changes
  if (name && name !== product.name) {
    product.slug = await generateUniqueProductSlug(name, product._id);
    product.name = name;
  }

  if (description !== undefined) product.description = description;
  if (category !== undefined) product.category = category;
  if (brand !== undefined) product.brand = brand;
  if (price !== undefined) product.price = Number(price);
  if (discountPrice !== undefined) product.discountPrice = Number(discountPrice);
  if (stock !== undefined) product.stock = Number(stock);
  if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;
  product.images = combinedImages;

  await product.save();

  return res.status(200).json(
    new ApiResponse(200, { product }, 'Product updated successfully')
  );
});

// ─── Delete Product ───────────────────────────────────────────────────────────
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  // Verify ownership
  if (product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied. You do not own this product.');
  }

  await product.deleteOne();

  return res.status(200).json(
    new ApiResponse(200, null, 'Product deleted successfully')
  );
});

// ─── Public: Get Products (Search, Filter, Sort, Pagination) ─────────────────
const getPublicProducts = asyncHandler(async (req, res) => {
  const {
    search, category, brand, minPrice, maxPrice, rating, inStock, sort, page = 1, limit = 12,
  } = req.query;

  // 1. Sanitize pagination values safely
  const parsedPage  = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  // 2. Get approved stores list
  const approvedStores = await Store.find({ status: 'approved' }).select('_id');
  const approvedStoreIds = approvedStores.map((s) => s._id);

  // 3. Build filter (Must be active and belong to an approved store)
  const filter = {
    isActive: true,
    store: { $in: approvedStoreIds },
  };

  // Search filter (Case-insensitive & safe regex escaping)
  if (search && typeof search === 'string' && search.trim() !== '') {
    const escapedSearch = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } },
      { category: { $regex: escapedSearch, $options: 'i' } },
      { brand: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  // Category filter
  if (category && typeof category === 'string' && category.trim() !== '' && category.toLowerCase() !== 'all categories') {
    filter.category = { $regex: new RegExp(`^${escapeRegex(category.trim())}$`, 'i') };
  }

  // Brand filter
  if (brand && typeof brand === 'string' && brand.trim() !== '') {
    filter.brand = { $regex: new RegExp(`^${escapeRegex(brand.trim())}$`, 'i') };
  }

  // Price Range filter
  let parsedMin = minPrice !== undefined && minPrice !== '' ? parseFloat(minPrice) : NaN;
  let parsedMax = maxPrice !== undefined && maxPrice !== '' ? parseFloat(maxPrice) : NaN;

  if (!isNaN(parsedMin) && parsedMin < 0) parsedMin = 0;
  if (!isNaN(parsedMax) && parsedMax < 0) parsedMax = 0;

  // Gracefully swap if minPrice > maxPrice
  if (!isNaN(parsedMin) && !isNaN(parsedMax) && parsedMin > parsedMax) {
    const temp = parsedMin;
    parsedMin = parsedMax;
    parsedMax = temp;
  }

  if (!isNaN(parsedMin) || !isNaN(parsedMax)) {
    filter.price = {};
    if (!isNaN(parsedMin)) filter.price.$gte = parsedMin;
    if (!isNaN(parsedMax)) filter.price.$lte = parsedMax;
  }

  // Rating Filter (Minimum average rating e.g., 4 = 4★ & above)
  if (rating !== undefined && rating !== '') {
    const parsedRating = parseFloat(rating);
    if (!isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
      filter.ratingsAverage = { $gte: parsedRating };
    }
  }

  // Stock Filter
  if (inStock === 'true') {
    filter.stock = { $gt: 0 };
  }

  // 4. Whitelist Sorting Mapping
  const sortOptions = {};
  if (sort === 'price_asc') {
    sortOptions.price = 1;
  } else if (sort === 'price_desc') {
    sortOptions.price = -1;
  } else if (sort === 'rating') {
    sortOptions.ratingsAverage = -1;
    sortOptions.createdAt = -1;
  } else if (sort === 'name_asc') {
    sortOptions.name = 1;
  } else {
    sortOptions.createdAt = -1; // Default: newest first
  }

  // 5. Query DB
  const skip  = (parsedPage - 1) * parsedLimit;
  const total = await Product.countDocuments(filter);
  const totalPages = Math.ceil(total / parsedLimit);

  const products = await Product.find(filter)
    .populate('store', 'name slug logo status city country')
    .sort(sortOptions)
    .skip(skip)
    .limit(parsedLimit);

  return res.status(200).json(
    new ApiResponse(200, {
      products,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalProducts: total,
        total, // preserve total key for existing UI code
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1,
      },
    }, 'Public products fetched')
  );
});

// ─── Public: Get Product By Slug / ID ─────────────────────────────────────────
const getPublicProductBySlug = asyncHandler(async (req, res) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(req.params.slug);
  const query = isObjectId
    ? { $or: [{ slug: req.params.slug }, { _id: req.params.slug }], isActive: true }
    : { slug: req.params.slug, isActive: true };

  const product = await Product.findOne(query)
    .populate('store', 'name slug logo description city country status')
    .populate('seller', 'name');

  if (!product || !product.store || product.store.status !== 'approved') {
    throw new ApiError(404, 'Product not found or unavailable');
  }

  return res.status(200).json(new ApiResponse(200, { product }, 'Product fetched'));
});

// ─── Public: Get Related Products ────────────────────────────────────────────
const getRelatedProducts = asyncHandler(async (req, res) => {
  const currentProduct = await Product.findOne({ slug: req.params.slug });
  if (!currentProduct) throw new ApiError(404, 'Product not found');

  const approvedStores = await Store.find({ status: 'approved' }).select('_id');
  const approvedStoreIds = approvedStores.map((s) => s._id);

  const related = await Product.find({
    _id: { $ne: currentProduct._id },
    category: currentProduct.category,
    isActive: true,
    store: { $in: approvedStoreIds },
  })
    .populate('store', 'name slug status')
    .limit(4);

  return res.status(200).json(new ApiResponse(200, { products: related }, 'Related products fetched'));
});

module.exports = {
  createProduct,
  getSellerProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getPublicProducts,
  getPublicProductBySlug,
  getRelatedProducts,
};
