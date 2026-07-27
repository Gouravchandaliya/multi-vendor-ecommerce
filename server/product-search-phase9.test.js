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

let mongoServer;
let server;
let baseUrl;

let seller1, approvedStore;
let seller2, unapprovedStore;
let product1, product2, product3, product4, inactiveProduct, unapprovedStoreProduct;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // 1. Create Sellers & Stores
  seller1 = await User.create({
    name: 'Search Seller One',
    email: 'seller1-search@example.com',
    password: 'Password123',
    role: 'seller',
  });

  seller2 = await User.create({
    name: 'Search Seller Two',
    email: 'seller2-search@example.com',
    password: 'Password123',
    role: 'seller',
  });

  approvedStore = await Store.create({
    seller: seller1._id,
    name: 'Approved Gadgets Store',
    slug: 'approved-gadgets-store',
    status: 'approved',
  });

  unapprovedStore = await Store.create({
    seller: seller2._id,
    name: 'Pending Store',
    slug: 'pending-store',
    status: 'pending',
  });

  // 2. Create Sample Products
  product1 = await Product.create({
    seller: seller1._id,
    store: approvedStore._id,
    name: 'Smartphone Pro 12',
    slug: 'smartphone-pro-12',
    description: 'High performance smartphone with OLED screen',
    category: 'Electronics',
    brand: 'TechBrand',
    price: 999.00,
    stock: 15,
    ratingsAverage: 4.8,
    ratingsCount: 25,
    isActive: true,
  });

  product2 = await Product.create({
    seller: seller1._id,
    store: approvedStore._id,
    name: 'Wireless Bluetooth Phone Charger',
    slug: 'wireless-bluetooth-phone-charger',
    description: 'Fast wireless charging pad for all smartphones',
    category: 'Electronics',
    brand: 'ChargeMax',
    price: 49.00,
    stock: 50,
    ratingsAverage: 3.5,
    ratingsCount: 10,
    isActive: true,
  });

  product3 = await Product.create({
    seller: seller1._id,
    store: approvedStore._id,
    name: 'Leather Running Shoes',
    slug: 'leather-running-shoes',
    description: 'Comfortable sports shoes for men and women',
    category: 'Fashion',
    brand: 'SportFlex',
    price: 120.00,
    stock: 8,
    ratingsAverage: 4.2,
    ratingsCount: 18,
    isActive: true,
  });

  product4 = await Product.create({
    seller: seller1._id,
    store: approvedStore._id,
    name: 'Ergonomic Desk Chair',
    slug: 'ergonomic-desk-chair',
    description: 'Adjustable mesh office chair',
    category: 'Home & Living',
    brand: 'FlexiSeat',
    price: 250.00,
    stock: 0, // Out of stock
    ratingsAverage: 4.0,
    ratingsCount: 5,
    isActive: true,
  });

  inactiveProduct = await Product.create({
    seller: seller1._id,
    store: approvedStore._id,
    name: 'Hidden Inactive Product',
    slug: 'hidden-inactive-product',
    description: 'This product should never appear in public marketplace',
    category: 'Electronics',
    brand: 'Unknown',
    price: 10.00,
    stock: 5,
    isActive: false,
  });

  unapprovedStoreProduct = await Product.create({
    seller: seller2._id,
    store: unapprovedStore._id,
    name: 'Unapproved Store Gadget',
    slug: 'unapproved-store-gadget',
    description: 'Belongs to an unapproved store',
    category: 'Electronics',
    brand: 'Unknown',
    price: 20.00,
    stock: 5,
    isActive: true,
  });

  // 3. Start Server
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

async function apiRequest(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

// ─── INTEGRATION TEST SUITE FOR PHASE 9 ────────────────────────────────────────

test('1. Default GET /products returns active approved products with pagination', async () => {
  const { status, data } = await apiRequest('/products/public');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.products.length, 4); // 4 active products from approved store
  assert.strictEqual(data.data.pagination.totalProducts, 4);
  assert.strictEqual(data.data.pagination.page, 1);
  assert.strictEqual(data.data.pagination.hasNextPage, false);
});

test('2. GET /products?search=phone performs case-insensitive regex search', async () => {
  const { status, data } = await apiRequest('/products/public?search=phone');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products.length, 2); // Smartphone Pro 12 & Wireless Bluetooth Phone Charger
  const names = data.data.products.map(p => p.name);
  assert.ok(names.includes('Smartphone Pro 12'));
  assert.ok(names.includes('Wireless Bluetooth Phone Charger'));
});

test('3. Search handles regex special characters safely without crashing', async () => {
  const { status, data } = await apiRequest('/products/public?search=phone(');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products.length, 0);
});

test('4. GET /products?category=electronics filters by category', async () => {
  const { status, data } = await apiRequest('/products/public?category=electronics');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products.length, 2);
});

test('5. GET /products?minPrice=100&maxPrice=300 filters by price range', async () => {
  const { status, data } = await apiRequest('/products/public?minPrice=100&maxPrice=300');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products.length, 2); // Shoes ($120) & Desk Chair ($250)
});

test('6. Price filter gracefully swaps minPrice > maxPrice', async () => {
  const { status, data } = await apiRequest('/products/public?minPrice=300&maxPrice=100');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products.length, 2); // Swapped to min=100, max=300
});

test('7. GET /products?rating=4 filters products with rating 4.0 and above', async () => {
  const { status, data } = await apiRequest('/products/public?rating=4');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products.length, 3); // 4.8, 4.2, 4.0 (excludes 3.5)
});

test('8. GET /products?sort=price_asc sorts by price ascending', async () => {
  const { status, data } = await apiRequest('/products/public?sort=price_asc');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products[0].price, 49.00);
  assert.strictEqual(data.data.products[3].price, 999.00);
});

test('9. GET /products?sort=price_desc sorts by price descending', async () => {
  const { status, data } = await apiRequest('/products/public?sort=price_desc');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products[0].price, 999.00);
  assert.strictEqual(data.data.products[3].price, 49.00);
});

test('10. GET /products?sort=rating sorts by ratingsAverage descending', async () => {
  const { status, data } = await apiRequest('/products/public?sort=rating');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products[0].ratingsAverage, 4.8);
});

test('11. GET /products?page=1&limit=2 paginates correctly with limit cap', async () => {
  const { status, data } = await apiRequest('/products/public?page=1&limit=2');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products.length, 2);
  assert.strictEqual(data.data.pagination.page, 1);
  assert.strictEqual(data.data.pagination.limit, 2);
  assert.strictEqual(data.data.pagination.totalPages, 2);
  assert.strictEqual(data.data.pagination.hasNextPage, true);
  assert.strictEqual(data.data.pagination.hasPrevPage, false);
});

test('12. Combined search, filter, rating, sort & pagination query works seamlessly', async () => {
  const query = '/products/public?search=phone&category=electronics&minPrice=10&maxPrice=1500&rating=4&sort=price_desc&page=1&limit=10';
  const { status, data } = await apiRequest(query);
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products.length, 1); // Smartphone Pro 12 ($999, 4.8★)
  assert.strictEqual(data.data.products[0].name, 'Smartphone Pro 12');
});

test('13. Malicious / invalid parameters are handled safely without crashing Express', async () => {
  const invalidQuery = '/products/public?page=-1&limit=999999&minPrice=-100&rating=100&sort=DROP_DATABASE';
  const { status, data } = await apiRequest(invalidQuery);
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.pagination.page, 1);
  assert.strictEqual(data.data.pagination.limit, 50); // Capped at max 50
});
