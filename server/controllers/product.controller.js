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

  const filter = { seller: req.user._id };
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.status(200).json(
    new ApiResponse(200, {
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
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
    search, category, brand, minPrice, maxPrice, inStock, sort, page = 1, limit = 12,
  } = req.query;

  // 1. Get approved stores list
  const approvedStores = await Store.find({ status: 'approved' }).select('_id');
  const approvedStoreIds = approvedStores.map((s) => s._id);

  // 2. Build filter (Must be active and belong to an approved store)
  const filter = {
    isActive: true,
    store: { $in: approvedStoreIds },
  };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) {
    filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
  }

  if (brand) {
    filter.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined && minPrice !== '') filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== '') filter.price.$lte = Number(maxPrice);
  }

  if (inStock === 'true') {
    filter.stock = { $gt: 0 };
  }

  // 3. Build Sorting
  const sortOptions = {};
  if (sort === 'price_asc') {
    sortOptions.price = 1;
  } else if (sort === 'price_desc') {
    sortOptions.price = -1;
  } else if (sort === 'name_asc') {
    sortOptions.name = 1;
  } else {
    sortOptions.createdAt = -1; // Default: newest first
  }

  // 4. Query DB
  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('store', 'name slug logo status city country')
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit));

  return res.status(200).json(
    new ApiResponse(200, {
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Public products fetched')
  );
});

// ─── Public: Get Product By Slug ──────────────────────────────────────────────
const getPublicProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
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
