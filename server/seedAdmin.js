// DNS must be configured FIRST for MongoDB Atlas SRV resolution on Windows
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');

const ADMIN_DATA = {
  name: 'Marketplace Admin',
  email: 'admin@marketplace.com',
  password: 'Admin@12345',
  role: 'admin',
  isActive: true,
};

async function seedAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI is not defined in environment variables.');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: ADMIN_DATA.email.toLowerCase() });

    if (existingAdmin) {
      console.log(`Admin user already exists: ${ADMIN_DATA.email}`);
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save({ validateBeforeSave: false });
        console.log(`Updated role to admin for: ${ADMIN_DATA.email}`);
      }
    } else {
      const admin = await User.create(ADMIN_DATA);
      console.log(`✓ Admin user created successfully: ${admin.email} (Role: ${admin.role})`);
    }

    await mongoose.disconnect();
    console.log('Disconnected cleanly from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

seedAdmin();
