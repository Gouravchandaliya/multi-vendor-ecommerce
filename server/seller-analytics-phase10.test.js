require('dotenv').config();
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./app');
const User = require('./models/User.model');
const Store = require('./models/Store.model');
const Product = require('./models/Product.model');
const Address = require('./models/Address.model');
const Order = require('./models/Order.model');

let mongoServer;
let server;
let baseUrl;

let sellerAUser, sellerAToken, storeA;
let sellerBUser, sellerBToken, storeB;
let sellerNoStoreUser, sellerNoStoreToken;
let buyerUser, buyerToken;

let productA1, productA2, productB1;
let shippingAddress;

const secret = process.env.ACCESS_TOKEN_SECRET || 'replace_with_a_long_random_secret_string';

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // 1. Create Users
  sellerAUser = await User.create({
    name: 'Analytics Seller A',
    email: 'sellerA-analytics@example.com',
    password: 'Password123',
    role: 'seller',
  });

  sellerBUser = await User.create({
    name: 'Analytics Seller B',
    email: 'sellerB-analytics@example.com',
    password: 'Password123',
    role: 'seller',
  });

  sellerNoStoreUser = await User.create({
    name: 'Seller Without Store',
    email: 'seller-nostore@example.com',
    password: 'Password123',
    role: 'seller',
  });

  buyerUser = await User.create({
    name: 'Analytics Buyer',
    email: 'buyer-analytics@example.com',
    password: 'Password123',
    role: 'buyer',
  });

  sellerAToken       = jwt.sign({ userId: sellerAUser._id, role: sellerAUser.role }, secret, { expiresIn: '1h' });
  sellerBToken       = jwt.sign({ userId: sellerBUser._id, role: sellerBUser.role }, secret, { expiresIn: '1h' });
  sellerNoStoreToken = jwt.sign({ userId: sellerNoStoreUser._id, role: sellerNoStoreUser.role }, secret, { expiresIn: '1h' });
  buyerToken         = jwt.sign({ userId: buyerUser._id, role: buyerUser.role }, secret, { expiresIn: '1h' });

  // 2. Create Stores
  storeA = await Store.create({
    seller: sellerAUser._id,
    name: 'Alpha Audio Store',
    slug: 'alpha-audio-store',
    status: 'approved',
  });

  storeB = await Store.create({
    seller: sellerBUser._id,
    name: 'Beta Fashion Store',
    slug: 'beta-fashion-store',
    status: 'approved',
  });

  // 3. Create Products
  productA1 = await Product.create({
    seller: sellerAUser._id,
    store: storeA._id,
    name: 'Alpha Wireless Earbuds',
    slug: 'alpha-wireless-earbuds',
    description: 'Noise cancelling earbuds',
    category: 'Electronics',
    brand: 'AlphaTech',
    price: 100.00,
    stock: 3, // Low stock <= 5
    ratingsAverage: 4.5,
    isActive: true,
  });

  productA2 = await Product.create({
    seller: sellerAUser._id,
    store: storeA._id,
    name: 'Alpha Smart Speaker',
    slug: 'alpha-smart-speaker',
    description: 'Voice controlled smart speaker',
    category: 'Electronics',
    brand: 'AlphaTech',
    price: 200.00,
    stock: 0, // Out of stock
    ratingsAverage: 4.0,
    isActive: true,
  });

  productB1 = await Product.create({
    seller: sellerBUser._id,
    store: storeB._id,
    name: 'Beta Designer Jacket',
    slug: 'beta-designer-jacket',
    description: 'Premium leather jacket',
    category: 'Fashion',
    brand: 'BetaStyle',
    price: 300.00,
    stock: 25,
    ratingsAverage: 4.9,
    isActive: true,
  });

  // 4. Create Shipping Address
  shippingAddress = await Address.create({
    user: buyerUser._id,
    fullName: 'Analytics Buyer',
    phone: '9876543210',
    addressLine1: '456 Market St',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
  });

  // 5. Create Multi-Vendor Order (Paid) containing items from Seller A & Seller B
  await Order.create({
    orderNumber: 'ORD-ANALYTICS-101',
    buyer: buyerUser._id,
    items: [
      {
        product: productA1._id,
        seller: sellerAUser._id,
        store: storeA._id,
        productName: productA1.name,
        quantity: 2,
        unitPrice: 100.00,
        subtotal: 200.00, // Seller A gets $200
        status: 'delivered',
      },
      {
        product: productB1._id,
        seller: sellerBUser._id,
        store: storeB._id,
        productName: productB1.name,
        quantity: 1,
        unitPrice: 300.00,
        subtotal: 300.00, // Seller B gets $300
        status: 'processing',
      },
    ],
    shippingAddress,
    subtotal: 500.00,
    totalAmount: 500.00,
    paymentStatus: 'paid',
    razorpayOrderId: 'order_mock_analytics1',
    orderStatus: 'processing',
  });

  // 6. Create Second Order for Seller A (Cancelled item -> excluded from revenue)
  await Order.create({
    orderNumber: 'ORD-ANALYTICS-102',
    buyer: buyerUser._id,
    items: [
      {
        product: productA2._id,
        seller: sellerAUser._id,
        store: storeA._id,
        productName: productA2.name,
        quantity: 1,
        unitPrice: 200.00,
        subtotal: 200.00,
        status: 'cancelled', // Cancelled!
      },
    ],
    shippingAddress,
    subtotal: 200.00,
    totalAmount: 200.00,
    paymentStatus: 'paid',
    razorpayOrderId: 'order_mock_analytics2',
    orderStatus: 'cancelled',
  });

  // 7. Start HTTP Server
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1`;
      resolve();
    });
  });
});

after(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function apiRequest(path, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${path}`, { headers });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

// ─── PHASE 10 SELLER ANALYTICS INTEGRATION TESTS ─────────────────────────────

test('1. Buyer role attempt to access seller analytics is rejected (403 Forbidden)', async () => {
  const { status, data } = await apiRequest('/seller/orders/analytics', buyerToken);
  assert.strictEqual(status, 403);
  assert.match(data.message, /Access denied/i);
});

test('2. Seller without store attempt is rejected (403 Forbidden)', async () => {
  const { status, data } = await apiRequest('/seller/orders/analytics', sellerNoStoreToken);
  assert.strictEqual(status, 403);
  assert.match(data.message, /must create a store/i);
});

test('3. Seller A analytics strictly computes Seller A revenue & order stats (Data Isolation)', async () => {
  const { status, data } = await apiRequest('/seller/orders/analytics?range=30d', sellerAToken);
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);

  const overview = data.data.overview;
  // Order 101 gave $200 to Seller A. Order 102 was cancelled ($0). Total = $200
  assert.strictEqual(overview.totalRevenue, 200.00);
  assert.strictEqual(overview.totalOrders, 2);
  assert.strictEqual(overview.totalProducts, 2);
  assert.strictEqual(overview.lowStockCount, 1); // productA1 has stock 3
  assert.strictEqual(overview.outOfStockCount, 1); // productA2 has stock 0
  assert.strictEqual(overview.totalCustomers, 1); // buyerUser
});

test('4. Seller B analytics strictly computes Seller B revenue & order stats', async () => {
  const { status, data } = await apiRequest('/seller/orders/analytics?range=30d', sellerBToken);
  assert.strictEqual(status, 200);

  const overview = data.data.overview;
  // Order 101 gave $300 to Seller B.
  assert.strictEqual(overview.totalRevenue, 300.00);
  assert.strictEqual(overview.totalOrders, 1);
  assert.strictEqual(overview.totalProducts, 1);
  assert.strictEqual(overview.lowStockCount, 0);
});

test('5. Top selling products returns top products ranked by revenue for seller', async () => {
  const { status, data } = await apiRequest('/seller/orders/analytics', sellerAToken);
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.topProducts.length, 1);
  assert.strictEqual(data.data.topProducts[0].productName, 'Alpha Wireless Earbuds');
  assert.strictEqual(data.data.topProducts[0].totalSold, 2);
  assert.strictEqual(data.data.topProducts[0].totalRevenue, 200);
});

test('6. Low stock items returns inventory with stock <= 5 sorted ascending', async () => {
  const { status, data } = await apiRequest('/seller/orders/analytics', sellerAToken);
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.lowStockItems.length, 2);
  assert.strictEqual(data.data.lowStockItems[0].stock, 0); // Out of stock first
  assert.strictEqual(data.data.lowStockItems[1].stock, 3);
});

test('7. Time range parameter supports 7d, 30d, 90d, and 1y', async () => {
  const { status, data } = await apiRequest('/seller/orders/analytics?range=7d', sellerAToken);
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.range, '7d');
});
