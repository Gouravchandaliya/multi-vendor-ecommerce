const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product.model');

const MANIFEST_PATH = path.join(__dirname, '../seeds/product-seed-manifest.json');

const clearSeedProducts = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is missing in server/.env');
    process.exit(1);
  }

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.log('ℹ️ No seed manifest file found. Nothing to clean up.');
    process.exit(0);
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const idsToDelete = manifest.createdProductIds || [];

    if (idsToDelete.length === 0) {
      console.log('ℹ️ Manifest contains 0 product IDs. Cleaning manifest file.');
      fs.unlinkSync(MANIFEST_PATH);
      process.exit(0);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas');

    // ONLY delete products recorded in the seed manifest
    const result = await Product.deleteMany({ _id: { $in: idsToDelete } });
    console.log(`🧹 CLEANUP COMPLETE: Deleted ${result.deletedCount} seeded products.`);

    // Delete manifest file
    fs.unlinkSync(MANIFEST_PATH);
    console.log('🗑️ Manifest file removed.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

clearSeedProducts();
