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

let adminUser, adminToken;
let sellerUser, sellerToken, storeObj;
let buyerUser, buyerToken;
let targetUser;

let testProduct;
let shippingAddress;

const secret = process.env.ACCESS_TOKEN_SECRET || 'replace_with_a_long_random_secret_string';

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // 1. Create Users
  adminUser = await User.create({
    name: 'Super Admin',
    email: 'admin-phase11@example.com',
    password: 'Password123',
    role: 'admin',
  });

  sellerUser = await User.create({
    name: 'Marketplace Seller',
    email: 'seller-phase11@example.com',
    password: 'Password123',
    role: 'seller',
  });

  buyerUser = await User.create({
    name: 'Marketplace Buyer',
    email: 'buyer-phase11@example.com',
    password: 'Password123',
    role: 'buyer',
  });

  targetUser = await User.create({
    name: 'User To Deactivate',
    email: 'deactivate-me@example.com',
    password: 'Password123',
    role: 'buyer',
  });

  adminToken  = jwt.sign({ userId: adminUser._id, role: adminUser.role }, secret, { expiresIn: '1h' });
  sellerToken = jwt.sign({ userId: sellerUser._id, role: sellerUser.role }, secret, { expiresIn: '1h' });
  buyerToken  = jwt.sign({ userId: buyerUser._id, role: buyerUser.role }, secret, { expiresIn: '1h' });

  // 2. Create Store & Product
  storeObj = await Store.create({
    seller: sellerUser._id,
    name: 'Admin Test Store',
    slug: 'admin-test-store',
    status: 'approved',
  });

  testProduct = await Product.create({
    seller: sellerUser._id,
    store: storeObj._id,
    name: 'Admin Test Product',
    slug: 'admin-test-product',
    description: 'High quality test item',
    category: 'Electronics',
    brand: 'TestBrand',
    price: 500.00,
    stock: 20,
    ratingsAverage: 4.7,
    isActive: true,
  });

  // 3. Create Shipping Address
  shippingAddress = await Address.create({
    user: buyerUser._id,
    fullName: 'Marketplace Buyer',
    phone: '9876543210',
    addressLine1: '789 Admin Ave',
    city: 'Delhi',
    state: 'Delhi',
    postalCode: '110001',
    country: 'India',
  });

  // 4. Create Paid Order
  await Order.create({
    orderNumber: 'ORD-ADMIN-1001',
    buyer: buyerUser._id,
    items: [
      {
        product: testProduct._id,
        seller: sellerUser._id,
        store: storeObj._id,
        productName: testProduct.name,
        quantity: 2,
        unitPrice: 500.00,
        subtotal: 1000.00,
        status: 'delivered',
      },
    ],
    shippingAddress,
    subtotal: 1000.00,
    totalAmount: 1000.00,
    paymentStatus: 'paid',
    razorpayOrderId: 'order_mock_admin1',
    orderStatus: 'delivered',
  });

  // 5. Start HTTP Server
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

async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

// ─── INTEGRATION TEST SUITE FOR PHASE 11 ───────────────────────────────────────

test('1. Buyer attempt to access GET /admin/analytics is rejected (403 Forbidden)', async () => {
  const { status, data } = await apiRequest('/admin/analytics', { token: buyerToken });
  assert.strictEqual(status, 403);
  assert.match(data.message, /Access denied/i);
});

test('2. Seller attempt to access GET /admin/analytics is rejected (403 Forbidden)', async () => {
  const { status, data } = await apiRequest('/admin/analytics', { token: sellerToken });
  assert.strictEqual(status, 403);
  assert.match(data.message, /Access denied/i);
});

test('3. Admin access GET /admin/analytics returns marketplace analytics payload (200 OK)', async () => {
  const { status, data } = await apiRequest('/admin/analytics?range=30d', { token: adminToken });
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);

  const overview = data.data.overview;
  assert.strictEqual(overview.totalRevenue, 1000.00);
  assert.strictEqual(overview.totalOrders, 1);
  assert.ok(overview.totalUsers >= 4);
  assert.strictEqual(overview.totalSellers, 1);
  assert.strictEqual(overview.totalStores, 1);
  assert.strictEqual(data.data.topSellers[0].storeName, 'Admin Test Store');
  assert.strictEqual(data.data.topProducts[0].productName, 'Admin Test Product');
});

test('4. Non-admin access to GET /admin/users directory is rejected (403 Forbidden)', async () => {
  const { status } = await apiRequest('/admin/users', { token: sellerToken });
  assert.strictEqual(status, 403);
});

test('5. Admin GET /admin/users returns paginated user directory with role filters', async () => {
  const { status, data } = await apiRequest('/admin/users?role=seller', { token: adminToken });
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.users.length, 1);
  assert.strictEqual(data.data.users[0].email, 'seller-phase11@example.com');
  assert.strictEqual(data.data.users[0].password, undefined); // Sensitive field omitted
});

test('6. Admin can toggle user active status (deactivate & reactivate)', async () => {
  // Deactivate user
  const deactRes = await apiRequest(`/admin/users/${targetUser._id}/toggle-status`, {
    method: 'PATCH',
    token: adminToken,
  });
  assert.strictEqual(deactRes.status, 200);
  assert.strictEqual(deactRes.data.data.user.isActive, false);

  // Reactivate user
  const reactRes = await apiRequest(`/admin/users/${targetUser._id}/toggle-status`, {
    method: 'PATCH',
    token: adminToken,
  });
  assert.strictEqual(reactRes.status, 200);
  assert.strictEqual(reactRes.data.data.user.isActive, true);
});

test('7. Admin self-deactivation attempt is rejected (400 Bad Request)', async () => {
  const { status, data } = await apiRequest(`/admin/users/${adminUser._id}/toggle-status`, {
    method: 'PATCH',
    token: adminToken,
  });
  assert.strictEqual(status, 400);
  assert.match(data.message, /cannot deactivate your own admin account/i);
});
