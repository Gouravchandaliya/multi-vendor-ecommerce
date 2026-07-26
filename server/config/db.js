const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas with automatic fallback to local in-memory MongoDB
 * if network/IP whitelist issues prevent Atlas connection.
 */
const connectDB = async (retries = 2, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  console.log('\n⚠️ Could not connect to MongoDB Atlas (Check IP Whitelist in Atlas Console if needed).');
  console.log('⚡ Launching local in-memory database fallback so your project runs smoothly...\n');

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`✓ In-Memory MongoDB connected successfully at ${uri}`);
  } catch (err) {
    console.error('Failed to start in-memory MongoDB fallback:', err.message);
  }
};

module.exports = connectDB;
