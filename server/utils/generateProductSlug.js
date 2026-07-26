const mongoose = require('mongoose');

/**
 * Converts a product name into a URL-safe slug and ensures it is unique
 * in the products collection by appending a numeric suffix if needed.
 *
 * @param {string} name - The product name to slugify
 * @param {string} [excludeId] - Product _id to exclude from uniqueness check
 * @returns {Promise<string>} A unique slug
 */
const generateUniqueProductSlug = async (name, excludeId = null) => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // remove non-alphanumeric (except spaces/hyphens)
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^-|-$/g, '');          // trim leading/trailing hyphens

  let slug = base;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };

    const Product = mongoose.model('Product');
    const existing = await Product.findOne(query);
    if (!existing) return slug;

    counter++;
    slug = `${base}-${counter}`;
  }
};

module.exports = generateUniqueProductSlug;
