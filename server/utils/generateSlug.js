const Store = require('../models/Store.model');

/**
 * Converts a store name into a URL-safe slug and ensures it is unique
 * in the stores collection by appending a numeric suffix if needed.
 *
 * "My Cool Store" → "my-cool-store"
 * If "my-cool-store" exists → "my-cool-store-2", etc.
 *
 * @param {string} name - The store name to slugify
 * @param {string} [excludeId] - Store _id to exclude from uniqueness check (for updates)
 * @returns {Promise<string>} A unique slug
 */
const generateUniqueSlug = async (name, excludeId = null) => {
  // Convert to lowercase, replace spaces/special chars with hyphens, strip extras
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

    const existing = await Store.findOne(query);
    if (!existing) return slug;

    counter++;
    slug = `${base}-${counter}`;
  }
};

module.exports = generateUniqueSlug;
