const { validationResult } = require('express-validator');
const Address      = require('../models/Address.model');
const ApiError     = require('../utils/ApiError');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── Get User Addresses ───────────────────────────────────────────────────────
const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, { addresses }, 'Addresses fetched successfully'));
});

// ─── Create Address ───────────────────────────────────────────────────────────
const createAddress = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, 'Validation failed', errors.array());

  const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

  // If set to default, unset other user addresses
  if (isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  // Check if first address for user, automatically make default
  const count = await Address.countDocuments({ user: req.user._id });
  const shouldBeDefault = isDefault || count === 0;

  const address = await Address.create({
    user: req.user._id,
    fullName,
    phone,
    addressLine1,
    addressLine2: addressLine2 || '',
    city,
    state,
    postalCode,
    country: country || 'India',
    isDefault: shouldBeDefault,
  });

  return res.status(201).json(new ApiResponse(201, { address }, 'Address added successfully'));
});

// ─── Update Address ───────────────────────────────────────────────────────────
const updateAddress = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, 'Validation failed', errors.array());

  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(404, 'Address not found or unauthorized');

  const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

  if (isDefault && !address.isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  if (fullName !== undefined) address.fullName = fullName;
  if (phone !== undefined) address.phone = phone;
  if (addressLine1 !== undefined) address.addressLine1 = addressLine1;
  if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
  if (city !== undefined) address.city = city;
  if (state !== undefined) address.state = state;
  if (postalCode !== undefined) address.postalCode = postalCode;
  if (country !== undefined) address.country = country;
  if (isDefault !== undefined) address.isDefault = isDefault;

  await address.save();
  return res.status(200).json(new ApiResponse(200, { address }, 'Address updated successfully'));
});

// ─── Delete Address ───────────────────────────────────────────────────────────
const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(404, 'Address not found or unauthorized');

  await address.deleteOne();
  return res.status(200).json(new ApiResponse(200, null, 'Address deleted successfully'));
});

// ─── Set Default Address ──────────────────────────────────────────────────────
const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(404, 'Address not found or unauthorized');

  await Address.updateMany({ user: req.user._id }, { isDefault: false });
  address.isDefault = true;
  await address.save();

  return res.status(200).json(new ApiResponse(200, { address }, 'Default address updated'));
});

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
