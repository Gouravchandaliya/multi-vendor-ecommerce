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

let buyer1Token, buyer1User;
let buyer2Token, buyer2User;
let seller1User, seller2User, storeA, storeB;
let productA, productB, productC;
let createdAddress;
let razorpayOrderId;
let createdOrder;

const secret = process.env.ACCESS_TOKEN_SECRET || 'replace_with_a_long_random_secret_string';

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // 1. Create Users
  buyer1User = await User.create({
    name: 'Checkout Buyer 1',
    email: 'buyer1-checkout@example.com',
    password: 'Password123',
    role: 'buyer',
  });

  buyer2User = await User.create({
    name: 'Checkout Buyer 2',
    email: 'buyer2-checkout@example.com',
    password: 'Password123',
    role: 'buyer',
  });

  seller1User = await User.create({
    name: 'Seller Store A',
    email: 'seller1-checkout@example.com',
    password: 'Password123',
    role: 'seller',
  });

  seller2User = await User.create({
    name: 'Seller Store B',
    email: 'seller2-checkout@example.com',
    password: 'Password123',
    role: 'seller',
  });

  buyer1Token = jwt.sign({ userId: buyer1User._id, role: buyer1User.role }, secret, { expiresIn: '1h' });
  buyer2Token = jwt.sign({ userId: buyer2User._id, role: buyer2User.role }, secret, { expiresIn: '1h' });

  // 2. Create Stores
  storeA = await Store.create({
    seller: seller1User._id,
    name: 'Store A Electronics',
    slug: 'store-a-electronics',
    status: 'approved',
  });

  storeB = await Store.create({
    seller: seller2User._id,
    name: 'Store B Apparel',
    slug: 'store-b-apparel',
    status: 'approved',
  });

  // 3. Create Products (Store A & Store B)
  productA = await Product.create({
    seller: seller1User._id,
    store: storeA._id,
    name: 'Store A Headphones',
    slug: 'store-a-headphones',
    description: 'Noise cancelling',
    category: 'Electronics',
    brand: 'BrandA',
    price: 100.00,
    stock: 10,
    isActive: true,
  });

  productB = await Product.create({
    seller: seller1User._id,
    store: storeA._id,
    name: 'Store A Keyboard',
    slug: 'store-a-keyboard',
    description: 'Mechanical keyboard',
    category: 'Electronics',
    brand: 'BrandA',
    price: 150.00,
    stock: 10,
    isActive: true,
  });

  productC = await Product.create({
    seller: seller2User._id,
    store: storeB._id,
    name: 'Store B Running Shoes',
    slug: 'store-b-running-shoes',
    description: 'Athletic shoes',
    category: 'Fashion',
    brand: 'BrandB',
    price: 80.00,
    discountPrice: 60.00, // Active discount
    stock: 5,
    isActive: true,
  });

  // 4. Start HTTP Server
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

// ─── PHASE 7 INTEGRATION TEST SUITE ───────────────────────────────────────────

test('1. Address creation', async () => {
  const { status, data } = await apiRequest('/addresses', {
    method: 'POST',
    token: buyer1Token,
    body: {
      fullName: 'Buyer One',
      phone: '9876543210',
      addressLine1: '123 Market St',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
      isDefault: true,
    },
  });

  assert.strictEqual(status, 201);
  assert.ok(data.data.address._id);
  createdAddress = data.data.address;
});

test('2. Address security isolation: Buyer 2 cannot edit or delete Buyer 1 address', async () => {
  const updateRes = await apiRequest(`/addresses/${createdAddress._id}`, {
    method: 'PUT',
    token: buyer2Token,
    body: {
      fullName: 'Hacker Name',
      phone: '9876543210',
      addressLine1: 'Hacked St',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
    },
  });
  assert.strictEqual(updateRes.status, 404);

  const deleteRes = await apiRequest(`/addresses/${createdAddress._id}`, {
    method: 'DELETE',
    token: buyer2Token,
  });
  assert.strictEqual(deleteRes.status, 404);
});

test('3. Populate Multi-Vendor Cart (Store A + Store B products)', async () => {
  await apiRequest('/cart/items', { method: 'POST', token: buyer1Token, body: { productId: productA._id, quantity: 2 } });
  await apiRequest('/cart/items', { method: 'POST', token: buyer1Token, body: { productId: productB._id, quantity: 1 } });
  const { status, data } = await apiRequest('/cart/items', { method: 'POST', token: buyer1Token, body: { productId: productC._id, quantity: 1 } });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.cart.items.length, 3);
  // Total: (2 * 100) + (1 * 150) + (1 * 60) = 410.00
  assert.strictEqual(data.data.cart.subtotal, 410.00);
});

test('4. Create Razorpay Payment Order with server-side price recalculation', async () => {
  const { status, data } = await apiRequest('/payments/create-order', {
    method: 'POST',
    token: buyer1Token,
  });

  assert.strictEqual(status, 200);
  assert.ok(data.data.razorpayOrderId);
  assert.strictEqual(data.data.totalAmount, 410.00);
  assert.strictEqual(data.data.amount, 41000); // 410.00 * 100 = 41000 paise
  razorpayOrderId = data.data.razorpayOrderId;
});

test('5. Verify Razorpay payment, create Order & update inventory atomically', async () => {
  const mockPaymentId = `pay_test_${Date.now()}`;

  const { status, data } = await apiRequest('/payments/verify', {
    method: 'POST',
    token: buyer1Token,
    body: {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: 'mock_signature',
      shippingAddressId: createdAddress._id,
    },
  });

  assert.strictEqual(status, 201);
  assert.ok(data.data.order._id);
  assert.strictEqual(data.data.order.orderNumber.startsWith('ORD-'), true);
  assert.strictEqual(data.data.order.paymentStatus, 'paid');
  assert.strictEqual(data.data.order.orderStatus, 'placed');
  assert.strictEqual(data.data.order.totalAmount, 410.00);
  assert.strictEqual(data.data.order.items.length, 3);

  createdOrder = data.data.order;
});

test('6. Idempotency test: duplicate payment verification returns existing order', async () => {
  const { status, data } = await apiRequest('/payments/verify', {
    method: 'POST',
    token: buyer1Token,
    body: {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: createdOrder.razorpayPaymentId,
      razorpay_signature: 'mock_signature',
      shippingAddressId: createdAddress._id,
    },
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.order._id, createdOrder._id);
});

test('7. Inventory check: stock decreased by purchased quantities', async () => {
  const prodA = await Product.findById(productA._id);
  const prodB = await Product.findById(productB._id);
  const prodC = await Product.findById(productC._id);

  assert.strictEqual(prodA.stock, 8); // 10 - 2 = 8
  assert.strictEqual(prodB.stock, 9); // 10 - 1 = 9
  assert.strictEqual(prodC.stock, 4); // 5 - 1 = 4
});

test('8. Cart is cleared after verified payment', async () => {
  const { status, data } = await apiRequest('/cart', { token: buyer1Token });
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.cart.items.length, 0);
});

test('9. Order items preserve purchase-time price snapshots', async () => {
  // Alter productA price to $200.00
  productA.price = 200.00;
  await productA.save();

  const { status, data } = await apiRequest(`/orders/${createdOrder._id}`, { token: buyer1Token });
  assert.strictEqual(status, 200);

  const itemA = data.data.order.items.find((i) => i.product.toString() === productA._id.toString());
  // Historical snapshot must retain original purchase price ($100.00)
  assert.strictEqual(itemA.unitPrice, 100.00);
});

test('10. Customer order history & order ownership security', async () => {
  // Buyer 1 sees order
  const resB1 = await apiRequest('/orders/my-orders', { token: buyer1Token });
  assert.strictEqual(resB1.status, 200);
  assert.strictEqual(resB1.data.data.orders.length, 1);

  // Buyer 2 sees 0 orders
  const resB2 = await apiRequest('/orders/my-orders', { token: buyer2Token });
  assert.strictEqual(resB2.status, 200);
  assert.strictEqual(resB2.data.data.orders.length, 0);

  // Buyer 2 cannot view Buyer 1's order details
  const resB2Detail = await apiRequest(`/orders/${createdOrder._id}`, { token: buyer2Token });
  assert.strictEqual(resB2Detail.status, 403);
});
