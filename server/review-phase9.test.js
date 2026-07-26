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
const Review = require('./models/Review.model');

let mongoServer;
let server;
let baseUrl;

let buyer1Token, buyer1User;
let buyer2Token, buyer2User;
let sellerToken, sellerUser, storeObj;
let adminToken, adminUser;
let testProduct;
let shippingAddress;
let deliveredOrder, pendingOrder;

const secret = process.env.ACCESS_TOKEN_SECRET || 'replace_with_a_long_random_secret_string';

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // 1. Create Users
  buyer1User = await User.create({
    name: 'Buyer One',
    email: 'buyer1-review@example.com',
    password: 'Password123',
    role: 'buyer',
  });

  buyer2User = await User.create({
    name: 'Buyer Two',
    email: 'buyer2-review@example.com',
    password: 'Password123',
    role: 'buyer',
  });

  sellerUser = await User.create({
    name: 'Review Seller',
    email: 'seller-review@example.com',
    password: 'Password123',
    role: 'seller',
  });

  adminUser = await User.create({
    name: 'Admin Reviewer',
    email: 'admin-review@example.com',
    password: 'Password123',
    role: 'admin',
  });

  buyer1Token = jwt.sign({ userId: buyer1User._id, role: buyer1User.role }, secret, { expiresIn: '1h' });
  buyer2Token = jwt.sign({ userId: buyer2User._id, role: buyer2User.role }, secret, { expiresIn: '1h' });
  sellerToken = jwt.sign({ userId: sellerUser._id, role: sellerUser.role }, secret, { expiresIn: '1h' });
  adminToken  = jwt.sign({ userId: adminUser._id, role: adminUser.role }, secret, { expiresIn: '1h' });

  // 2. Create Store & Product
  storeObj = await Store.create({
    seller: sellerUser._id,
    name: 'Audio Store',
    slug: 'audio-store',
    status: 'approved',
  });

  testProduct = await Product.create({
    seller: sellerUser._id,
    store: storeObj._id,
    name: 'Wireless Studio Headphones',
    slug: 'wireless-studio-headphones',
    description: 'High fidelity audio headphones',
    category: 'Electronics',
    brand: 'AudioTech',
    price: 150.00,
    stock: 20,
    isActive: true,
  });

  // 3. Create Shipping Address
  shippingAddress = await Address.create({
    user: buyer1User._id,
    fullName: 'Buyer One',
    phone: '9876543210',
    addressLine1: '123 Main St',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India',
  });

  // 4. Create Delivered Order for Buyer 1
  deliveredOrder = await Order.create({
    orderNumber: `ORD-REV-1001`,
    buyer: buyer1User._id,
    items: [
      {
        product: testProduct._id,
        seller: sellerUser._id,
        store: storeObj._id,
        productName: testProduct.name,
        quantity: 1,
        unitPrice: 150.00,
        subtotal: 150.00,
        status: 'delivered',
      },
    ],
    shippingAddress,
    subtotal: 150.00,
    totalAmount: 150.00,
    paymentStatus: 'paid',
    razorpayOrderId: 'order_mock_rev1',
    orderStatus: 'delivered',
  });

  // 5. Create Pending (non-delivered) Order for Buyer 2
  pendingOrder = await Order.create({
    orderNumber: `ORD-REV-1002`,
    buyer: buyer2User._id,
    items: [
      {
        product: testProduct._id,
        seller: sellerUser._id,
        store: storeObj._id,
        productName: testProduct.name,
        quantity: 1,
        unitPrice: 150.00,
        subtotal: 150.00,
        status: 'shipped', // NOT delivered yet!
      },
    ],
    shippingAddress,
    subtotal: 150.00,
    totalAmount: 150.00,
    paymentStatus: 'paid',
    razorpayOrderId: 'order_mock_rev2',
    orderStatus: 'shipped',
  });

  // 6. Start HTTP Server
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

// ─── PHASE 9 INTEGRATION TEST SUITE ───────────────────────────────────────────

test('1. Non-purchaser review attempt is rejected (403 Forbidden)', async () => {
  // Random user with no order
  const { status, data } = await apiRequest(`/reviews/product/${testProduct._id}`, {
    method: 'POST',
    token: sellerToken, // Seller has no purchase order
    body: { rating: 5, comment: 'Illegal self review' },
  });
  assert.strictEqual(status, 403);
  assert.match(data.message, /Only customers who have purchased/i);
});

test('2. Buyer with un-delivered order attempt is rejected (403 Forbidden)', async () => {
  // Buyer 2 has a shipped (not delivered) order
  const { status, data } = await apiRequest(`/reviews/product/${testProduct._id}`, {
    method: 'POST',
    token: buyer2Token,
    body: { rating: 4, comment: 'Haven\'t received it yet' },
  });
  assert.strictEqual(status, 403);
  assert.match(data.message, /Only customers who have purchased/i);
});

test('3. Out-of-bounds ratings (0 or 6) are rejected (400 Bad Request)', async () => {
  const zeroRes = await apiRequest(`/reviews/product/${testProduct._id}`, {
    method: 'POST',
    token: buyer1Token,
    body: { rating: 0, comment: 'Zero star rating' },
  });
  assert.strictEqual(zeroRes.status, 400);

  const sixRes = await apiRequest(`/reviews/product/${testProduct._id}`, {
    method: 'POST',
    token: buyer1Token,
    body: { rating: 6, comment: 'Six star rating' },
  });
  assert.strictEqual(sixRes.status, 400);
});

test('4. Purchaser with delivered order creates valid review (201 Created & Verified Purchase)', async () => {
  const { status, data } = await apiRequest(`/reviews/product/${testProduct._id}`, {
    method: 'POST',
    token: buyer1Token,
    body: { rating: 5, comment: 'Outstanding sound quality and deep bass response!' },
  });

  assert.strictEqual(status, 201);
  assert.strictEqual(data.data.review.rating, 5);
  assert.strictEqual(data.data.review.isVerifiedPurchase, true);
  assert.strictEqual(data.data.review.user.name, 'Buyer One');
});

test('5. Product ratingsAverage and ratingsCount update automatically after creation', async () => {
  const updatedProduct = await Product.findById(testProduct._id);
  assert.strictEqual(updatedProduct.ratingsAverage, 5.0);
  assert.strictEqual(updatedProduct.ratingsCount, 1);
});

test('6. Duplicate review submission by same buyer is rejected (400 Bad Request)', async () => {
  const { status, data } = await apiRequest(`/reviews/product/${testProduct._id}`, {
    method: 'POST',
    token: buyer1Token,
    body: { rating: 4, comment: 'Second review attempt' },
  });
  assert.strictEqual(status, 400);
  assert.match(data.message, /already reviewed/i);
});

test('7. Non-owner cannot edit another buyer\'s review (403 Forbidden)', async () => {
  const reviews = await Review.find({ product: testProduct._id });
  const reviewId = reviews[0]._id;

  const { status } = await apiRequest(`/reviews/${reviewId}`, {
    method: 'PATCH',
    token: buyer2Token,
    body: { rating: 1, comment: 'Hacked comment' },
  });
  assert.strictEqual(status, 403);
});

test('8. Owner edits review and product rating recalculates automatically', async () => {
  const reviews = await Review.find({ product: testProduct._id });
  const reviewId = reviews[0]._id;

  const { status, data } = await apiRequest(`/reviews/${reviewId}`, {
    method: 'PATCH',
    token: buyer1Token,
    body: { rating: 4, comment: 'Updated to 4 stars after long term test.' },
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.review.rating, 4);

  const updatedProduct = await Product.findById(testProduct._id);
  assert.strictEqual(updatedProduct.ratingsAverage, 4.0);
  assert.strictEqual(updatedProduct.ratingsCount, 1);
});

test('9. Public GET product reviews returns paginated list and star breakdown stats', async () => {
  const { status, data } = await apiRequest(`/reviews/product/${testProduct._id}?page=1&limit=5&sort=recent`);
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.reviews.length, 1);
  assert.strictEqual(data.data.ratingsAverage, 4.0);
  assert.strictEqual(data.data.ratingsCount, 1);
  assert.strictEqual(data.data.breakdown['4'], 1);
  assert.strictEqual(data.data.breakdown['5'], 0);
});

test('10. Seller can view store product reviews (200 OK)', async () => {
  const { status, data } = await apiRequest('/reviews/seller/my-store', { token: sellerToken });
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.reviews.length, 1);
  assert.strictEqual(data.data.reviews[0].comment, 'Updated to 4 stars after long term test.');
});

test('11. Admin can view global marketplace reviews (200 OK)', async () => {
  const { status, data } = await apiRequest('/reviews/admin/all', { token: adminToken });
  assert.strictEqual(status, 200);
  assert.ok(data.data.reviews.length >= 1);
});

test('12. Non-owner cannot delete another buyer\'s review (403 Forbidden)', async () => {
  const reviews = await Review.find({ product: testProduct._id });
  const reviewId = reviews[0]._id;

  const { status } = await apiRequest(`/reviews/${reviewId}`, {
    method: 'DELETE',
    token: buyer2Token,
  });
  assert.strictEqual(status, 403);
});

test('13. Owner deletes review and product rating recalculates back to zero', async () => {
  const reviews = await Review.find({ product: testProduct._id });
  const reviewId = reviews[0]._id;

  const { status } = await apiRequest(`/reviews/${reviewId}`, {
    method: 'DELETE',
    token: buyer1Token,
  });

  assert.strictEqual(status, 200);

  const updatedProduct = await Product.findById(testProduct._id);
  assert.strictEqual(updatedProduct.ratingsAverage, 0);
  assert.strictEqual(updatedProduct.ratingsCount, 0);
});
