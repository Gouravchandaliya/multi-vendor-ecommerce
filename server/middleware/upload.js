const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Storage strategy: memory storage.
// Holds the file buffer in memory for direct streaming to Cloudinary.
const storage = multer.memoryStorage();

// File filter: accept only standard image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only JPEG, JPG, PNG and WEBP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
});

module.exports = upload;
