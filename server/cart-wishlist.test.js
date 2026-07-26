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

let mongoServer;
let server;
let baseUrl;

let buyer1Token, buyer1User;
let buyer2Token, buyer2User;
let seller1User, seller2User, storeApproved, storeSuspended;
let productA, productB, productLowStock, productSuspendedStore;

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
    email: 'buyer1-cart@example.com',
    password: 'Password123',
    role: 'buyer',
  });

  buyer2User = await User.create({
    name: 'Buyer Two',
    email: 'buyer2-cart@example.com',
    password: 'Password123',
    role: 'buyer',
  });

  seller1User = await User.create({
    name: 'Seller One',
    email: 'seller1-cart@example.com',
    password: 'Password123',
    role: 'seller',
  });

  seller2User = await User.create({
    name: 'Seller Two',
    email: 'seller2-cart@example.com',
    password: 'Password123',
    role: 'seller',
  });

  buyer1Token = jwt.sign({ userId: buyer1User._id, role: buyer1User.role }, secret, { expiresIn: '1h' });
  buyer2Token = jwt.sign({ userId: buyer2User._id, role: buyer2User.role }, secret, { expiresIn: '1h' });

  // 2. Create Stores
  storeApproved = await Store.create({
    seller: seller1User._id,
    name: 'TechMega Store',
    slug: 'techmega-store',
    status: 'approved',
  });

  storeSuspended = await Store.create({
    seller: seller2User._id,
    name: 'Closed Store',
    slug: 'closed-store',
    status: 'suspended',
  });

  // 3. Create Products
  productA = await Product.create({
    seller: seller1User._id,
    store: storeApproved._id,
    name: 'Wireless Gaming Mouse',
    slug: 'wireless-gaming-mouse',
    description: 'RGB mouse',
    category: 'Electronics',
    brand: 'Logitech',
    price: 99.99,
    discountPrice: 79.99, // Active discount
    stock: 10,
    isActive: true,
  });

  productB = await Product.create({
    seller: seller1User._id,
    store: storeApproved._id,
    name: 'Mechanical Keyboard',
    slug: 'mechanical-keyboard',
    description: 'Clicky keyboard',
    category: 'Electronics',
    brand: 'Corsair',
    price: 149.99,
    stock: 5,
    isActive: true,
  });

  productLowStock = await Product.create({
    seller: seller1User._id,
    store: storeApproved._id,
    name: 'Limited Edition Desk Pad',
    slug: 'limited-edition-desk-pad',
    description: 'Desk mat',
    category: 'Accessories',
    brand: 'Custom',
    price: 29.99,
    stock: 2, // Low stock (2)
    isActive: true,
  });

  productSuspendedStore = await Product.create({
    seller: seller2User._id,
    store: storeSuspended._id,
    name: 'Item From Suspended Store',
    slug: 'item-from-suspended-store',
    description: 'Invalid store product',
    category: 'Electronics',
    brand: 'Generic',
    price: 19.99,
    stock: 10,
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

// ─── PHASE 6 INTEGRATION TEST SUITE ───────────────────────────────────────────

test('1. Get empty cart returns default structure', async () => {
  const { status, data } = await apiRequest('/cart', { token: buyer1Token });
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.cart.items.length, 0);
  assert.strictEqual(data.data.cart.subtotal, 0);
});

test('2. Add product to cart', async () => {
  const { status, data } = await apiRequest('/cart/items', {
    method: 'POST',
    token: buyer1Token,
    body: { productId: productA._id, quantity: 1 },
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.cart.items.length, 1);
  assert.strictEqual(data.data.cart.items[0].quantity, 1);
  assert.strictEqual(data.data.cart.subtotal, 79.99);
});

test('3. Adding same product twice increases quantity instead of creating duplicate items', async () => {
  const { status, data } = await apiRequest('/cart/items', {
    method: 'POST',
    token: buyer1Token,
    body: { productId: productA._id, quantity: 2 },
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.cart.items.length, 1); // Still 1 array entry
  assert.strictEqual(data.data.cart.items[0].quantity, 3); // 1 + 2 = 3
  assert.strictEqual(data.data.cart.itemCount, 3);
});

test('4. Price Security: Client price parameter is ignored by backend', async () => {
  const { status, data } = await apiRequest('/cart/items', {
    method: 'POST',
    token: buyer1Token,
    body: { productId: productB._id, quantity: 1, price: 1.00 }, // Client attempts $1.00
  });

  assert.strictEqual(status, 200);
  const itemB = data.data.cart.items.find((i) => i.product._id.toString() === productB._id.toString());
  assert.strictEqual(itemB.unitPrice, 149.99);
});

test('5. Stock bounds check rejects requested quantity > stock', async () => {
  const { status, data } = await apiRequest('/cart/items', {
    method: 'POST',
    token: buyer1Token,
    body: { productId: productLowStock._id, quantity: 5 }, // Stock is 2
  });

  assert.strictEqual(status, 400);
  assert.match(data.message, /Stock limit/i);
});

test('6. Update cart item quantity', async () => {
  const { status, data } = await apiRequest(`/cart/items/${productA._id}`, {
    method: 'PATCH',
    token: buyer1Token,
    body: { quantity: 2 },
  });

  assert.strictEqual(status, 200);
  const itemA = data.data.cart.items.find((i) => i.product._id.toString() === productA._id.toString());
  assert.strictEqual(itemA.quantity, 2);
});

test('7. Remove item from cart', async () => {
  const { status, data } = await apiRequest(`/cart/items/${productB._id}`, {
    method: 'DELETE',
    token: buyer1Token,
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.cart.items.length, 1);
});

test('8. Clear entire cart', async () => {
  const { status, data } = await apiRequest('/cart', {
    method: 'DELETE',
    token: buyer1Token,
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.cart.items.length, 0);
  assert.strictEqual(data.data.cart.subtotal, 0);
});

test('9. Merge Guest Cart endpoint merges localStorage items upon login', async () => {
  const guestItems = [
    { productId: productA._id, quantity: 2 },
    { productId: productB._id, quantity: 1 },
  ];

  const { status, data } = await apiRequest('/cart/merge', {
    method: 'POST',
    token: buyer1Token,
    body: { guestItems },
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.cart.items.length, 2);
  assert.strictEqual(data.data.cart.itemCount, 3);
});

test('10. Add product to wishlist', async () => {
  const { status, data } = await apiRequest(`/wishlist/${productA._id}`, {
    method: 'POST',
    token: buyer1Token,
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.wishlist.products.length, 1);
  assert.strictEqual(data.data.wishlist.products[0]._id.toString(), productA._id.toString());
});

test('11. Duplicate wishlist addition is handled without duplicates', async () => {
  const { status, data } = await apiRequest(`/wishlist/${productA._id}`, {
    method: 'POST',
    token: buyer1Token,
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.wishlist.products.length, 1);
});

test('12. Move item from wishlist to cart', async () => {
  const { status, data } = await apiRequest(`/wishlist/${productA._id}/move-to-cart`, {
    method: 'POST',
    token: buyer1Token,
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.wishlist.products.length, 0); // Removed from wishlist
});

test('13. Remove item from wishlist', async () => {
  await apiRequest(`/wishlist/${productB._id}`, { method: 'POST', token: buyer1Token });
  const { status, data } = await apiRequest(`/wishlist/${productB._id}`, {
    method: 'DELETE',
    token: buyer1Token,
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.wishlist.products.length, 0);
});

test('14. Cannot add item from suspended store to cart', async () => {
  const { status, data } = await apiRequest('/cart/items', {
    method: 'POST',
    token: buyer1Token,
    body: { productId: productSuspendedStore._id, quantity: 1 },
  });

  assert.strictEqual(status, 404);
  assert.match(data.message, /unavailable/i);
});

test('15. Cart and wishlist isolation: Buyer 2 cannot see or alter Buyer 1 data', async () => {
  const cartB2 = await apiRequest('/cart', { token: buyer2Token });
  assert.strictEqual(cartB2.status, 200);
  assert.strictEqual(cartB2.data.data.cart.items.length, 0);

  const wishB2 = await apiRequest('/wishlist', { token: buyer2Token });
  assert.strictEqual(wishB2.status, 200);
  assert.strictEqual(wishB2.data.data.wishlist.products.length, 0);
});
