const User         = require('../models/User.model');
const ApiError     = require('../utils/ApiError');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── Get All Users (Admin User Directory) ─────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 10 } = req.query;

  const query = {};
  if (role && ['buyer', 'seller', 'admin'].includes(role)) {
    query.role = role;
  }

  if (search && typeof search === 'string' && search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  const parsedPage  = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip  = (parsedPage - 1) * parsedLimit;

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password -refreshToken')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(total / parsedLimit),
        },
      },
      'Admin users list fetched successfully'
    )
  );
});

// ─── Toggle User Account Status (Activate / Deactivate) ──────────────────────
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Prevent admin from deactivating themselves
  if (userId.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot deactivate your own admin account.');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  // Toggle isActive status (default true if undefined)
  user.isActive = user.isActive === false ? true : false;
  await user.save();

  const sanitizedUser = user.toObject();
  delete sanitizedUser.password;
  delete sanitizedUser.refreshToken;

  return res.status(200).json(
    new ApiResponse(
      200,
      { user: sanitizedUser },
      `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`
    )
  );
});

module.exports = {
  getAllUsers,
  toggleUserStatus,
};
