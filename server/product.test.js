require('dotenv').config();
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./app');
const User = require('./models/User.model');
const Store = require('./models/Store.model');
const Product = require('./models/Product.model');
const cloudinary = require('./config/cloudinary');

// ─── CLOUDINARY MOCK ─────────────────────────────────────────────────────────
// Intercept call to upload_stream and return a mock URL without hitting network
cloudinary.uploader.upload_stream = (options, callback) => {
  return {
    end: (buffer) => {
      callback(null, { secure_url: 'https://res.cloudinary.com/mock-cloud/product-image.webp' });
    }
  };
};

let mongoServer;
let server;
let port;
let baseUrl;

// Test state
let sellerApprovedToken = '';
let sellerPendingToken = '';
let buyerToken = '';

let sellerApprovedUser = null;
let sellerPendingUser = null;
let approvedStore = null;
let pendingStore = null;

let productId = '';

const emailSellerApproved = 'seller-app@example-test.com';
const emailSellerPending = 'seller-pen@example-test.com';
const emailBuyer = 'buyer-prod-test@example-test.com';

before(async () => {
  // 1. Start in-memory DB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // 2. Create Users
  sellerApprovedUser = await User.create({
    name: 'Seller Approved',
    email: emailSellerApproved,
    password: 'password123',
    role: 'seller',
  });

  sellerPendingUser = await User.create({
    name: 'Seller Pending',
    email: emailSellerPending,
    password: 'password123',
    role: 'seller',
  });

  await User.create({
    name: 'Test Buyer',
    email: emailBuyer,
    password: 'password123',
    role: 'buyer',
  });

  // 3. Create Stores
  approvedStore = await Store.create({
    seller: sellerApprovedUser._id,
    name: 'Approved Store',
    slug: 'approved-store',
    description: 'Our approved testing store',
    status: 'approved',
  });

  pendingStore = await Store.create({
    seller: sellerPendingUser._id,
    name: 'Pending Store',
    slug: 'pending-store',
    description: 'Our pending testing store',
    status: 'pending',
  });

  // 4. Start HTTP server
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1`;
      resolve();
    });
  });
});

after(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  await new Promise((resolve) => server.close(resolve));
});

// Helper for API requests
async function apiRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

// ─── TEST CASES ──────────────────────────────────────────────────────────────

test('1. Authenticate users to get JWT tokens', async () => {
  // Login Seller Approved
  const res1 = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailSellerApproved, password: 'password123' }),
  });
  assert.strictEqual(res1.status, 200);
  sellerApprovedToken = res1.data.data.accessToken;

  // Login Seller Pending
  const res2 = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailSellerPending, password: 'password123' }),
  });
  assert.strictEqual(res2.status, 200);
  sellerPendingToken = res2.data.data.accessToken;

  // Login Buyer
  const res3 = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailBuyer, password: 'password123' }),
  });
  assert.strictEqual(res3.status, 200);
  buyerToken = res3.data.data.accessToken;
});

test('2. Seller with non-approved store cannot create a product', async () => {
  const { status, data } = await apiRequest('/products', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sellerPendingToken}`,
    },
    body: JSON.stringify({
      name: 'Super Gadget X',
      description: 'An advanced high-performance testing gadget',
      category: 'Electronics',
      brand: 'GadgetCorp',
      price: 199.99,
      stock: 50,
    }),
  });

  assert.strictEqual(status, 403);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /approved/);
});

test('3. Buyer (non-seller) cannot create a product', async () => {
  const { status, data } = await apiRequest('/products', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      name: 'Super Gadget X',
      description: 'An advanced high-performance testing gadget',
      category: 'Electronics',
      brand: 'GadgetCorp',
      price: 199.99,
      stock: 50,
    }),
  });

  assert.strictEqual(status, 403);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /Access denied/);
});

test('4. Seller with approved store can create a product', async () => {
  const { status, data } = await apiRequest('/products', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sellerApprovedToken}`,
    },
    body: JSON.stringify({
      name: 'Super Gadget X',
      description: 'An advanced high-performance testing gadget',
      category: 'Electronics',
      brand: 'GadgetCorp',
      price: 199.99,
      discountPrice: 149.99,
      stock: 50,
    }),
  });

  assert.strictEqual(status, 201);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.product.name, 'Super Gadget X');
  assert.strictEqual(data.data.product.price, 199.99);
  assert.strictEqual(data.data.product.discountPrice, 149.99);
  assert.strictEqual(data.data.product.stock, 50);
  assert.ok(data.data.product.slug);
  
  productId = data.data.product._id;
});

test('5. Product validation rules are enforced', async () => {
  // A. Negative price
  const resA = await apiRequest('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sellerApprovedToken}` },
    body: JSON.stringify({
      name: 'Bad Price Product',
      description: 'A valid description longer than usual',
      category: 'Test',
      brand: 'Test',
      price: -10,
      stock: 10,
    }),
  });
  assert.strictEqual(resA.status, 400);

  // B. Negative stock
  const resB = await apiRequest('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sellerApprovedToken}` },
    body: JSON.stringify({
      name: 'Bad Stock Product',
      description: 'A valid description longer than usual',
      category: 'Test',
      brand: 'Test',
      price: 100,
      stock: -5,
    }),
  });
  assert.strictEqual(resB.status, 400);

  // C. discountPrice higher than price
  const resC = await apiRequest('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sellerApprovedToken}` },
    body: JSON.stringify({
      name: 'Bad Discount Product',
      description: 'A valid description longer than usual',
      category: 'Test',
      brand: 'Test',
      price: 100,
      discountPrice: 150,
      stock: 10,
    }),
  });
  assert.strictEqual(resC.status, 400);
});

test('6. Seller can retrieve their product list', async () => {
  const { status, data } = await apiRequest('/products/seller', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${sellerApprovedToken}`,
    },
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.products.length >= 1);
  assert.strictEqual(data.data.products[0]._id, productId);
});

test('7. Other seller cannot update product details', async () => {
  const { status, data } = await apiRequest(`/products/${productId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${sellerPendingToken}`,
    },
    body: JSON.stringify({
      name: 'Stolen Gadget Hack',
      price: 0.99,
    }),
  });

  assert.strictEqual(status, 403);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /Access denied. You do not own this product/);
});

test('8. Owner seller can update product details', async () => {
  const { status, data } = await apiRequest(`/products/${productId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${sellerApprovedToken}`,
    },
    body: JSON.stringify({
      name: 'Super Gadget X v2',
      price: 249.99,
      discountPrice: 199.99,
      stock: 15,
    }),
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.product.name, 'Super Gadget X v2');
  assert.strictEqual(data.data.product.price, 249.99);
  assert.strictEqual(data.data.product.stock, 15);
  assert.strictEqual(data.data.product.slug, 'super-gadget-x-v2');
});

test('9. Other seller cannot delete product', async () => {
  const { status, data } = await apiRequest(`/products/${productId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${sellerPendingToken}`,
    },
  });

  assert.strictEqual(status, 403);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /Access denied. You do not own this product/);
});

test('10. Owner seller can delete product', async () => {
  const { status, data } = await apiRequest(`/products/${productId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${sellerApprovedToken}`,
    },
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);

  // Confirm deleted from database
  const count = await Product.countDocuments({ _id: productId });
  assert.strictEqual(count, 0);
});
