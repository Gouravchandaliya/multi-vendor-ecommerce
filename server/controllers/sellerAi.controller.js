const ApiError     = require('../utils/ApiError');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const aiService    = require('../services/ai.service');

/**
 * POST /api/v1/seller/ai/generate-product-content
 * Accepts: { name, category, brand, notes, tone }
 * Protected: verifyToken, requireRole('seller', 'admin')
 */
const generateProductContent = asyncHandler(async (req, res) => {
  const { name, category, brand, notes, tone } = req.body;

  // 1. Validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new ApiError(400, 'Product name is required for AI content generation.');
  }

  if (name.trim().length < 2) {
    throw new ApiError(400, 'Product name must be at least 2 characters.');
  }

  if (name.trim().length > 150) {
    throw new ApiError(400, 'Product name is too long (maximum 150 characters).');
  }

  if (notes && typeof notes === 'string' && notes.trim().length > 1000) {
    throw new ApiError(400, 'Features/Notes input is too long (maximum 1000 characters).');
  }

  // 2. Call AI Service
  const generatedContent = await aiService.generateProductContent({
    name: name.trim(),
    category: (category || '').trim(),
    brand: (brand || '').trim(),
    notes: (notes || '').trim(),
    tone: tone || 'Professional',
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { content: generatedContent },
      'AI product content generated successfully. Review and edit before saving.'
    )
  );
});

module.exports = {
  generateProductContent,
};
