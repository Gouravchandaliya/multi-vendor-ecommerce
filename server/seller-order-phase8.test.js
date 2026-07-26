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
const Cart = require('./models/Cart.model');
const Address = require('./models/Address.model');
const Order = require('./models/Order.model');

let mongoServer;
let server;
let baseUrl;

let buyerToken, buyerUser;
let seller1Token, seller1User, storeA;
let seller2Token, seller2User, storeB;
let adminToken, adminUser;
let productA1, productA2, productB1;
let shippingAddress;
let multiVendorOrder;

const secret = process.env.ACCESS_TOKEN_SECRET || 'replace_with_a_long_random_secret_string';

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // 1. Create Users
  buyerUser = await User.create({
    name: 'Phase 8 Buyer',
    email: 'buyer-phase8@example.com',
    password: 'Password123',
    role: 'buyer',
  });

  seller1User = await User.create({
    name: 'TechWorld Seller',
    email: 'seller1-phase8@example.com',
    password: 'Password123',
    role: 'seller',
  });

  seller2User = await User.create({
    name: 'FashionHub Seller',
    email: 'seller2-phase8@example.com',
    password: 'Password123',
    role: 'seller',
  });

  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin-phase8@example.com',
    password: 'Password123',
    role: 'admin',
  });

  buyerToken   = jwt.sign({ userId: buyerUser._id, role: buyerUser.role }, secret, { expiresIn: '1h' });
  seller1Token = jwt.sign({ userId: seller1User._id, role: seller1User.role }, secret, { expiresIn: '1h' });
  seller2Token = jwt.sign({ userId: seller2User._id, role: seller2User.role }, secret, { expiresIn: '1h' });
  adminToken   = jwt.sign({ userId: adminUser._id, role: adminUser.role }, secret, { expiresIn: '1h' });

  // 2. Create Stores
  storeA = await Store.create({
    seller: seller1User._id,
    name: 'TechWorld',
    slug: 'techworld',
    status: 'approved',
  });

  storeB = await Store.create({
    seller: seller2User._id,
    name: 'FashionHub',
    slug: 'fashionhub',
    status: 'approved',
  });

  // 3. Create Products
  productA1 = await Product.create({
    seller: seller1User._id,
    store: storeA._id,
    name: 'TechWorld Headphones',
    slug: 'techworld-headphones',
    description: 'Wireless Headphones',
    category: 'Electronics',
    brand: 'TechWorld',
    price: 100.00,
    stock: 10,
    isActive: true,
  });

  productA2 = await Product.create({
    seller: seller1User._id,
    store: storeA._id,
    name: 'TechWorld Keyboard',
    slug: 'techworld-keyboard',
    description: 'RGB Keyboard',
    category: 'Electronics',
    brand: 'TechWorld',
    price: 50.00,
    stock: 10,
    isActive: true,
  });

  productB1 = await Product.create({
    seller: seller2User._id,
    store: storeB._id,
    name: 'FashionHub Shoes',
    slug: 'fashionhub-shoes',
    description: 'Running Shoes',
    category: 'Fashion',
    brand: 'FashionHub',
    price: 80.00,
    discountPrice: 60.00,
    stock: 10,
    isActive: true,
  });

  // 4. Create Address
  shippingAddress = await Address.create({
    user: buyerUser._id,
    fullName: 'Test Buyer',
    phone: '9876543210',
    addressLine1: '456 High St',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India',
    isDefault: true,
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

// ─── PHASE 8 INTEGRATION TEST SUITE ───────────────────────────────────────────

test('1. Buyer creates Multi-Vendor Order (Store A: Headphones + Keyboard, Store B: Shoes)', async () => {
  // Populate cart
  await apiRequest('/cart/items', { method: 'POST', token: buyerToken, body: { productId: productA1._id, quantity: 2 } });
  await apiRequest('/cart/items', { method: 'POST', token: buyerToken, body: { productId: productA2._id, quantity: 1 } });
  await apiRequest('/cart/items', { method: 'POST', token: buyerToken, body: { productId: productB1._id, quantity: 1 } });

  // Init payment
  const initRes = await apiRequest('/payments/create-order', { method: 'POST', token: buyerToken });
  assert.strictEqual(initRes.status, 200);

  // Verify payment
  const verifyRes = await apiRequest('/payments/verify', {
    method: 'POST',
    token: buyerToken,
    body: {
      razorpay_order_id: initRes.data.data.razorpayOrderId,
      razorpay_payment_id: `pay_phase8_${Date.now()}`,
      razorpay_signature: 'mock_signature',
      shippingAddressId: shippingAddress._id,
    },
  });

  assert.strictEqual(verifyRes.status, 201);
  multiVendorOrder = verifyRes.data.data.order;
  assert.strictEqual(multiVendorOrder.items.length, 3);
});

test('2. Multi-Vendor Isolation: Seller A sees ONLY Store A items and Seller A total', async () => {
  const { status, data } = await apiRequest('/seller/orders', { token: seller1Token });
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.orders.length, 1);

  const seller1Order = data.data.orders[0];
  assert.strictEqual(seller1Order.sellerItems.length, 2);
  // Headphones (2 * $100) + Keyboard (1 * $50) = $250.00
  assert.strictEqual(seller1Order.sellerSubtotal, 250.00);

  // Seller 1 MUST NOT see Shoes (Store B)
  const hasShoes = seller1Order.sellerItems.some((i) => i.productName.includes('Shoes'));
  assert.strictEqual(hasShoes, false);
});

test('3. Multi-Vendor Isolation: Seller B sees ONLY Store B items and Seller B total', async () => {
  const { status, data } = await apiRequest('/seller/orders', { token: seller2Token });
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.orders.length, 1);

  const seller2Order = data.data.orders[0];
  assert.strictEqual(seller2Order.sellerItems.length, 1);
  // Shoes (1 * $60.00) = $60.00
  assert.strictEqual(seller2Order.sellerSubtotal, 60.00);

  // Seller 2 MUST NOT see Headphones or Keyboard (Store A)
  const hasHeadphones = seller2Order.sellerItems.some((i) => i.productName.includes('Headphones'));
  assert.strictEqual(hasHeadphones, false);
});

test('4. Security Authorization: Buyer cannot access seller orders endpoint', async () => {
  const { status } = await apiRequest('/seller/orders', { token: buyerToken });
  assert.strictEqual(status, 403);
});

test('5. State Machine: Seller A updates status through valid sequence (placed -> confirmed -> processing -> shipped)', async () => {
  // Confirm
  const confirmRes = await apiRequest(`/seller/orders/${multiVendorOrder._id}/status`, {
    method: 'PATCH',
    token: seller1Token,
    body: { status: 'confirmed' },
  });
  assert.strictEqual(confirmRes.status, 200);
  assert.strictEqual(confirmRes.data.data.order.sellerFulfillmentStatus, 'confirmed');

  // Processing
  const procRes = await apiRequest(`/seller/orders/${multiVendorOrder._id}/status`, {
    method: 'PATCH',
    token: seller1Token,
    body: { status: 'processing' },
  });
  assert.strictEqual(procRes.status, 200);
  assert.strictEqual(procRes.data.data.order.sellerFulfillmentStatus, 'processing');

  // Shipped
  const shipRes = await apiRequest(`/seller/orders/${multiVendorOrder._id}/status`, {
    method: 'PATCH',
    token: seller1Token,
    body: { status: 'shipped' },
  });
  assert.strictEqual(shipRes.status, 200);
  assert.strictEqual(shipRes.data.data.order.sellerFulfillmentStatus, 'shipped');
});

test('6. State Machine: Seller B updates status to processing (placed -> confirmed -> processing)', async () => {
  await apiRequest(`/seller/orders/${multiVendorOrder._id}/status`, { method: 'PATCH', token: seller2Token, body: { status: 'confirmed' } });
  const { status, data } = await apiRequest(`/seller/orders/${multiVendorOrder._id}/status`, {
    method: 'PATCH',
    token: seller2Token,
    body: { status: 'processing' },
  });
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.order.sellerFulfillmentStatus, 'processing');
});

test('7. State Machine Invalid Transition: Rejects illegal status jump (e.g. shipped -> processing)', async () => {
  const { status, data } = await apiRequest(`/seller/orders/${multiVendorOrder._id}/status`, {
    method: 'PATCH',
    token: seller1Token,
    body: { status: 'processing' }, // Seller A is currently shipped!
  });
  assert.strictEqual(status, 400);
  assert.match(data.message, /Invalid status transition/i);
});

test('8. Buyer Order View shows independent store statuses (TechWorld: Shipped, FashionHub: Processing)', async () => {
  const { status, data } = await apiRequest(`/orders/${multiVendorOrder._id}`, { token: buyerToken });
  assert.strictEqual(status, 200);

  const itemA1 = data.data.order.items.find((i) => i.product.toString() === productA1._id.toString());
  const itemB1 = data.data.order.items.find((i) => i.product.toString() === productB1._id.toString());

  assert.strictEqual(itemA1.status, 'shipped');
  assert.strictEqual(itemB1.status, 'processing');
});

test('9. Seller Sales Metric: Seller A revenue ($250) vs Seller B revenue ($60)', async () => {
  const metricA = await apiRequest('/seller/orders/metrics', { token: seller1Token });
  assert.strictEqual(metricA.status, 200);
  assert.strictEqual(metricA.data.data.sellerSales, 250.00);

  const metricB = await apiRequest('/seller/orders/metrics', { token: seller2Token });
  assert.strictEqual(metricB.status, 200);
  assert.strictEqual(metricB.data.data.sellerSales, 60.00);
});

test('10. Inventory Restoration on Cancellation: Restores product stock', async () => {
  // Create second order to cancel
  await apiRequest('/cart/items', { method: 'POST', token: buyerToken, body: { productId: productA2._id, quantity: 2 } });
  const initRes = await apiRequest('/payments/create-order', { method: 'POST', token: buyerToken });
  const verifyRes = await apiRequest('/payments/verify', {
    method: 'POST',
    token: buyerToken,
    body: {
      razorpay_order_id: initRes.data.data.razorpayOrderId,
      razorpay_payment_id: `pay_cancel_${Date.now()}`,
      razorpay_signature: 'mock_signature',
      shippingAddressId: shippingAddress._id,
    },
  });

  const cancelOrder = verifyRes.data.data.order;

  // Stock before cancel: 10 - 1 (order 1) - 2 (order 2) = 7
  const prodBefore = await Product.findById(productA2._id);
  assert.strictEqual(prodBefore.stock, 7);

  // Buyer cancels item in cancelOrder
  const cancelRes = await apiRequest(`/orders/${cancelOrder._id}/cancel`, {
    method: 'PATCH',
    token: buyerToken,
    body: { productId: productA2._id },
  });
  assert.strictEqual(cancelRes.status, 200);

  // Stock after cancel: 7 + 2 = 9
  const prodAfter = await Product.findById(productA2._id);
  assert.strictEqual(prodAfter.stock, 9);
});

test('11. Admin Orders View lists complete multi-vendor marketplace orders', async () => {
  const { status, data } = await apiRequest('/orders/admin/all', { token: adminToken });
  assert.strictEqual(status, 200);
  assert.ok(data.data.orders.length >= 2);
});
