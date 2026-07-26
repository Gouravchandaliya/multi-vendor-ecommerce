const { validationResult } = require('express-validator');
const Store              = require('../models/Store.model');
const Product            = require('../models/Product.model');
const ApiError           = require('../utils/ApiError');
const ApiResponse        = require('../utils/ApiResponse');
const asyncHandler       = require('../utils/asyncHandler');
const generateUniqueSlug = require('../utils/generateSlug');

// ─── Seller: create store / Become a Seller ──────────────────────────────────
const createStore = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, 'Validation failed', errors.array());

  const existing = await Store.findOne({ seller: req.user._id });
  if (existing) {
    throw new ApiError(409, 'You already have a seller application or store on file.');
  }

  let user = req.user;
  if (req.user.role === 'buyer') {
    req.user.role = 'seller';
    user = await req.user.save({ validateBeforeSave: false });
  }

  const {
    name, description, businessEmail, businessPhone,
    address, city, state, country, postalCode,
  } = req.body;

  const slug = await generateUniqueSlug(name);

  const store = await Store.create({
    seller: req.user._id,
    name,
    slug,
    description: description || '',
    businessEmail: businessEmail || req.user.email,
    businessPhone: businessPhone || '',
    address: address || '',
    city: city || '',
    state: state || '',
    country: country || '',
    postalCode: postalCode || '',
    status: 'pending',
  });

  return res.status(201).json(
    new ApiResponse(201, { store, user: user.toSafeObject() }, 'Store application submitted successfully. Awaiting admin approval.')
  );
});

// ─── Seller: get own store ────────────────────────────────────────────────────
const getMyStore = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ seller: req.user._id })
    .populate('seller', 'name email role')
    .populate('reviewedBy', 'name email');

  if (!store) throw new ApiError(404, 'No store application found for your account.');

  return res.status(200).json(new ApiResponse(200, { store }, 'Store fetched'));
});

// ─── Seller: update own store ─────────────────────────────────────────────────
const updateMyStore = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, 'Validation failed', errors.array());

  const store = await Store.findOne({ seller: req.user._id });
  if (!store) throw new ApiError(404, 'Store not found');

  const {
    name, description, businessEmail, businessPhone,
    address, city, state, country, postalCode, logo, banner,
  } = req.body;

  if (name && name !== store.name) {
    store.slug = await generateUniqueSlug(name, store._id);
    store.name = name;
  }

  if (description !== undefined) store.description = description;
  if (businessEmail !== undefined) store.businessEmail = businessEmail;
  if (businessPhone !== undefined) store.businessPhone = businessPhone;
  if (address !== undefined) store.address = address;
  if (city !== undefined) store.city = city;
  if (state !== undefined) store.state = state;
  if (country !== undefined) store.country = country;
  if (postalCode !== undefined) store.postalCode = postalCode;
  if (logo !== undefined) store.logo = logo;
  if (banner !== undefined) store.banner = banner;

  await store.save();

  return res.status(200).json(new ApiResponse(200, { store }, 'Store details updated successfully'));
});

// ─── Public: get list of approved stores (Featured Stores) ───────────────────
const getPublicStores = asyncHandler(async (req, res) => {
  const { limit = 8, page = 1 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const filter = { status: 'approved' };

  const total = await Store.countDocuments(filter);
  const stores = await Store.find(filter)
    .select('name slug description logo banner city country status createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.status(200).json(
    new ApiResponse(200, {
      stores,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Public approved stores fetched')
  );
});

// ─── Public: get store by slug ────────────────────────────────────────────────
const getStoreBySlug = asyncHandler(async (req, res) => {
  const store = await Store.findOne({
    slug: req.params.slug,
    status: 'approved',
  }).populate('seller', 'name');

  if (!store) throw new ApiError(404, 'Approved store not found');

  return res.status(200).json(new ApiResponse(200, { store }, 'Store fetched'));
});

// ─── Public: get store products by slug ───────────────────────────────────────
const getPublicStoreProducts = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ slug: req.params.slug, status: 'approved' })
    .populate('seller', 'name');

  if (!store) throw new ApiError(404, 'Approved store not found');

  const { search, category, page = 1, limit = 12 } = req.query;
  const filter = { store: store._id, isActive: true };

  if (search) filter.name = { $regex: search, $options: 'i' };
  if (category) filter.category = { $regex: new RegExp(`^${category}$`, 'i') };

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.status(200).json(
    new ApiResponse(200, {
      store,
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Public store products fetched')
  );
});

// ─── Admin: get all stores ────────────────────────────────────────────────────
const getAllStores = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status && ['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
    filter.status = status;
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Store.countDocuments(filter);
  const stores = await Store.find(filter)
    .populate('seller', 'name email role')
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.status(200).json(
    new ApiResponse(200, {
      stores,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Stores fetched')
  );
});

// ─── Admin: get store by ID ───────────────────────────────────────────────────
const getStoreById = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id)
    .populate('seller', 'name email role')
    .populate('reviewedBy', 'name email');

  if (!store) throw new ApiError(404, 'Store not found');

  return res.status(200).json(new ApiResponse(200, { store }, 'Store fetched'));
});

// ─── Admin: status handlers ───────────────────────────────────────────────────
const updateStoreStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
    throw new ApiError(400, 'Invalid status value');
  }

  const store = await Store.findById(req.params.id);
  if (!store) throw new ApiError(404, 'Store not found');

  store.status = status;
  if (status === 'rejected') {
    store.rejectionReason = rejectionReason || 'Application rejected by admin.';
  } else if (status === 'approved') {
    store.rejectionReason = '';
  }

  store.reviewedBy = req.user._id;
  store.reviewedAt = new Date();

  await store.save();
  await store.populate([
    { path: 'seller', select: 'name email role' },
    { path: 'reviewedBy', select: 'name email' },
  ]);

  return res.status(200).json(new ApiResponse(200, { store }, `Store ${status} successfully`));
});

const approveStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (!store) throw new ApiError(404, 'Store not found');

  store.status = 'approved';
  store.rejectionReason = '';
  store.reviewedBy = req.user._id;
  store.reviewedAt = new Date();

  await store.save();
  await store.populate([
    { path: 'seller', select: 'name email role' },
    { path: 'reviewedBy', select: 'name email' },
  ]);

  return res.status(200).json(new ApiResponse(200, { store }, 'Store approved successfully'));
});

const rejectStore = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  const store = await Store.findById(req.params.id);
  if (!store) throw new ApiError(404, 'Store not found');

  store.status = 'rejected';
  store.rejectionReason = rejectionReason || 'Your application did not meet our verification criteria.';
  store.reviewedBy = req.user._id;
  store.reviewedAt = new Date();

  await store.save();
  await store.populate([
    { path: 'seller', select: 'name email role' },
    { path: 'reviewedBy', select: 'name email' },
  ]);

  return res.status(200).json(new ApiResponse(200, { store }, 'Store rejected successfully'));
});

const suspendStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (!store) throw new ApiError(404, 'Store not found');

  store.status = 'suspended';
  store.reviewedBy = req.user._id;
  store.reviewedAt = new Date();

  await store.save();
  await store.populate([
    { path: 'seller', select: 'name email role' },
    { path: 'reviewedBy', select: 'name email' },
  ]);

  return res.status(200).json(new ApiResponse(200, { store }, 'Store suspended successfully'));
});

const reactivateStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (!store) throw new ApiError(404, 'Store not found');

  store.status = 'approved';
  store.rejectionReason = '';
  store.reviewedBy = req.user._id;
  store.reviewedAt = new Date();

  await store.save();
  await store.populate([
    { path: 'seller', select: 'name email role' },
    { path: 'reviewedBy', select: 'name email' },
  ]);

  return res.status(200).json(new ApiResponse(200, { store }, 'Store reactivated successfully'));
});

module.exports = {
  createStore,
  getMyStore,
  updateMyStore,
  getPublicStores,
  getStoreBySlug,
  getPublicStoreProducts,
  getAllStores,
  getStoreById,
  updateStoreStatus,
  approveStore,
  rejectStore,
  suspendStore,
  reactivateStore,
};
