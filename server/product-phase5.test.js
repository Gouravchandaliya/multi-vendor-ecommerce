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

let storeApproved = null;
let storeSuspended = null;
let product1 = null;
let product2 = null;
let product3 = null;
let productInactive = null;
let productSuspendedStore = null;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // 1. Create seller users
  const seller1 = await User.create({
    name: 'Seller 1',
    email: 'seller1-p5@example-test.com',
    password: 'Password123',
    role: 'seller',
  });

  const seller2 = await User.create({
    name: 'Seller 2',
    email: 'seller2-p5@example-test.com',
    password: 'Password123',
    role: 'seller',
  });

  // 2. Create stores (Approved and Suspended)
  storeApproved = await Store.create({
    seller: seller1._id,
    name: 'Tech Haven Store',
    slug: 'tech-haven-store',
    description: 'Premier tech electronics store',
    city: 'San Francisco',
    country: 'USA',
    status: 'approved',
  });

  storeSuspended = await Store.create({
    seller: seller2._id,
    name: 'Suspended Gear Store',
    slug: 'suspended-gear-store',
    status: 'suspended',
  });

  // 3. Create products
  product1 = await Product.create({
    seller: seller1._id,
    store: storeApproved._id,
    name: 'Sony WH-1000XM5 Wireless Headphones',
    slug: 'sony-wh-1000xm5-wireless-headphones',
    description: 'Industry leading noise cancelling headphones with mic',
    category: 'Electronics',
    brand: 'Sony',
    price: 399.99,
    discountPrice: 349.99,
    stock: 25,
    isActive: true,
  });

  product2 = await Product.create({
    seller: seller1._id,
    store: storeApproved._id,
    name: 'Apple MacBook Air M2',
    slug: 'apple-macbook-air-m2',
    description: 'Ultra thin laptop with M2 chip',
    category: 'Electronics',
    brand: 'Apple',
    price: 1199.99,
    stock: 5,
    isActive: true,
  });

  product3 = await Product.create({
    seller: seller1._id,
    store: storeApproved._id,
    name: 'Ergonomic Office Chair',
    slug: 'ergonomic-office-chair',
    description: 'Comfortable mesh desk chair',
    category: 'Home & Living',
    brand: 'ComfortCo',
    price: 199.99,
    stock: 0, // Out of stock
    isActive: true,
  });

  productInactive = await Product.create({
    seller: seller1._id,
    store: storeApproved._id,
    name: 'Draft Unpublished Item',
    slug: 'draft-unpublished-item',
    description: 'Draft item',
    category: 'Electronics',
    brand: 'Generic',
    price: 50.00,
    stock: 10,
    isActive: false, // Inactive
  });

  productSuspendedStore = await Product.create({
    seller: seller2._id,
    store: storeSuspended._id,
    name: 'Suspended Store Product',
    slug: 'suspended-store-product',
    description: 'Product from suspended store',
    category: 'Electronics',
    brand: 'Generic',
    price: 29.99,
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
  await new Promise((resolve) => server.close(resolve));
});

async function apiRequest(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

// ─── PHASE 5 TEST SUITE ───────────────────────────────────────────────────────

test('1 & 2. Homepage and public product listing fetch active products from approved stores', async () => {
  const { status, data } = await apiRequest('/products/public');

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  // Must return only product1, product2, product3 (excludes inactive and suspended store products)
  assert.strictEqual(data.data.products.length, 3);
  assert.ok(data.data.pagination);
});

test('3. Public product details works by slug', async () => {
  const { status, data } = await apiRequest(`/products/public/${product1.slug}`);

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.product.name, 'Sony WH-1000XM5 Wireless Headphones');
  assert.strictEqual(data.data.product.store.name, 'Tech Haven Store');
});

test('4. Invalid product slug returns proper 404', async () => {
  const { status } = await apiRequest('/products/public/non-existent-product-slug-999');
  assert.strictEqual(status, 404);
});

test('5 & 6. Search works and handles no results', async () => {
  // Search query "Headphones"
  const res1 = await apiRequest('/products/public?search=Headphones');
  assert.strictEqual(res1.status, 200);
  assert.strictEqual(res1.data.data.products.length, 1);
  assert.strictEqual(res1.data.data.products[0].slug, product1.slug);

  // Search query with no matches
  const res2 = await apiRequest('/products/public?search=NonExistentQueryXYZ');
  assert.strictEqual(res2.status, 200);
  assert.strictEqual(res2.data.data.products.length, 0);
});

test('7. Category filter works', async () => {
  const { status, data } = await apiRequest('/products/public?category=Electronics');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products.length, 2); // product1 and product2
});

test('8. Price range filter works (minPrice & maxPrice)', async () => {
  const { status, data } = await apiRequest('/products/public?minPrice=100&maxPrice=500');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products.length, 2); // product1 ($399.99) and product3 ($199.99)
});

test('9. Brand filter works', async () => {
  const { status, data } = await apiRequest('/products/public?brand=Apple');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products.length, 1);
  assert.strictEqual(data.data.products[0].brand, 'Apple');
});

test('10. Availability filter (inStock) works', async () => {
  const { status, data } = await apiRequest('/products/public?inStock=true');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products.length, 2); // product1 and product2 (product3 has stock 0)
});

test('11. Sorting works (price_asc and price_desc)', async () => {
  const resAsc = await apiRequest('/products/public?sort=price_asc');
  assert.strictEqual(resAsc.status, 200);
  assert.strictEqual(resAsc.data.data.products[0].price, 199.99);

  const resDesc = await apiRequest('/products/public?sort=price_desc');
  assert.strictEqual(resDesc.status, 200);
  assert.strictEqual(resDesc.data.data.products[0].price, 1199.99);
});

test('12. Pagination works (limit and page)', async () => {
  const { status, data } = await apiRequest('/products/public?page=1&limit=2');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products.length, 2);
  assert.strictEqual(data.data.pagination.totalPages, 2);
});

test('13. Combined filters work (Category + Price + Sort)', async () => {
  const { status, data } = await apiRequest('/products/public?category=Electronics&minPrice=500&sort=price_asc');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products.length, 1);
  assert.strictEqual(data.data.products[0].brand, 'Apple');
});

test('14, 15 & 16. Public store page and store products fetch only store products', async () => {
  const resStore = await apiRequest(`/stores/public/${storeApproved.slug}`);
  assert.strictEqual(resStore.status, 200);
  assert.strictEqual(resStore.data.data.store.name, 'Tech Haven Store');

  const resStoreProds = await apiRequest(`/stores/public/${storeApproved.slug}/products`);
  assert.strictEqual(resStoreProds.status, 200);
  assert.strictEqual(resStoreProds.data.data.products.length, 3);
});

test('17 & 18. Suspended store and inactive products are hidden from public endpoints', async () => {
  // Inactive product
  const resInactive = await apiRequest(`/products/public/${productInactive.slug}`);
  assert.strictEqual(resInactive.status, 404);

  // Product from suspended store
  const resSuspended = await apiRequest(`/products/public/${productSuspendedStore.slug}`);
  assert.strictEqual(resSuspended.status, 404);
});

test('19. Related products endpoint returns items in same category', async () => {
  const { status, data } = await apiRequest(`/products/public/${product1.slug}/related`);
  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.products.length, 1); // product2 is also Electronics
  assert.strictEqual(data.data.products[0].slug, product2.slug);
});
