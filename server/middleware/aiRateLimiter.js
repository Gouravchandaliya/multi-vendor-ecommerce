const ApiError = require('../utils/ApiError');

// Simple in-memory rate limiter for seller AI requests (Max 10 calls / 15 mins per seller)
const sellerAiRequests = new Map();
const LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;

const aiRateLimiter = (req, res, next) => {
  const sellerId = req.user?._id?.toString() || req.ip;
  const now = Date.now();

  const record = sellerAiRequests.get(sellerId) || { count: 0, resetTime: now + WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + WINDOW_MS;
  } else {
    record.count++;
  }

  sellerAiRequests.set(sellerId, record);

  if (record.count > LIMIT) {
    const minutesLeft = Math.ceil((record.resetTime - now) / 60000);
    return next(
      new ApiError(
        429,
        `AI generation limit reached (max ${LIMIT} requests per 15 minutes). Please try again in ${minutesLeft} minute(s).`
      )
    );
  }

  next();
};

module.exports = aiRateLimiter;
