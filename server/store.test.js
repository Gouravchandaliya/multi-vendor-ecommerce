require('dotenv').config();
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./app');
const User = require('./models/User.model');
const Store = require('./models/Store.model');

let mongoServer;
let server;
let port;
let baseUrl;

// Test variables to store state between tests
let buyerToken = '';
let buyerUser = null;
let adminToken = '';
let adminUser = null;
let storeId = '';

const testBuyerEmail = 'buyer-test@example-test.com';
const testAdminEmail = 'admin-test@example-test.com';

before(async () => {
  // Start in-memory mongodb
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect mongoose to in-memory db
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Create an admin user directly in DB (register route blocks admin registration)
  adminUser = await User.create({
    name: 'Test Admin',
    email: testAdminEmail,
    password: 'password123',
    role: 'admin',
  });

  // Start app on ephemeral port
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
  // Close DB and server connections
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  await new Promise((resolve) => server.close(resolve));
});

// Helper for making API requests with fetch
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

test('1. Register a new user with buyer role', async () => {
  const { status, data } = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Buyer',
      email: testBuyerEmail,
      password: 'password123',
      role: 'buyer',
    }),
  });

  assert.strictEqual(status, 201);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.user.role, 'buyer');
  assert.ok(data.data.accessToken);

  buyerToken = data.data.accessToken;
  buyerUser = data.data.user;
});

test('2. Log in as admin to obtain token', async () => {
  const { status, data } = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testAdminEmail,
      password: 'password123',
    }),
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.user.role, 'admin');
  assert.ok(data.data.accessToken);

  adminToken = data.data.accessToken;
});

test('3. Buyer applies as seller and creates store', async () => {
  const { status, data } = await apiRequest('/stores', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      name: 'Test Store Alpha',
      description: 'The premier testing store',
    }),
  });

  assert.strictEqual(status, 201);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.store.status, 'pending');
  assert.strictEqual(data.data.store.name, 'Test Store Alpha');
  assert.ok(data.data.store.slug);
  
  // Verify that the user role has been upgraded to seller in the returned response
  assert.strictEqual(data.data.user.role, 'seller');

  storeId = data.data.store._id;
  
  // Verify user's role is updated in the database
  const updatedUser = await User.findById(buyerUser._id);
  assert.strictEqual(updatedUser.role, 'seller');
});

test('4. Seller cannot create a second store', async () => {
  const { status, data } = await apiRequest('/stores', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${buyerToken}`, // now has seller role in DB
    },
    body: JSON.stringify({
      name: 'Test Store Beta',
      description: 'Attempt to make a second store',
    }),
  });

  assert.strictEqual(status, 409);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /You already have a store/);
});

test('5. Seller can fetch own store', async () => {
  const { status, data } = await apiRequest('/stores/my', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${buyerToken}`,
    },
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.store._id, storeId);
  assert.strictEqual(data.data.store.status, 'pending');
});

test('6. Seller can update own store details', async () => {
  const { status, data } = await apiRequest('/stores/my', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      name: 'Test Store Alpha Updated',
      description: 'Modified description',
      logo: 'https://example.com/logo.png',
      banner: 'https://example.com/banner.png',
    }),
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.store.name, 'Test Store Alpha Updated');
  assert.strictEqual(data.data.store.description, 'Modified description');
  assert.strictEqual(data.data.store.logo, 'https://example.com/logo.png');
  assert.strictEqual(data.data.store.banner, 'https://example.com/banner.png');
});

test('7. Unauthorized user (non-admin) cannot manage store status', async () => {
  const { status, data } = await apiRequest(`/stores/${storeId}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${buyerToken}`, // seller role, not admin
    },
    body: JSON.stringify({
      status: 'approved',
    }),
  });

  assert.strictEqual(status, 403);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /Access denied/);
});

test('8. Admin can approve a store', async () => {
  const { status, data } = await apiRequest(`/stores/${storeId}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'approved',
    }),
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.store.status, 'approved');
  assert.strictEqual(data.data.store.reviewedBy._id, adminUser._id.toString());
  assert.ok(data.data.store.reviewedAt);
});

test('9. Public can view approved store by slug', async () => {
  // Let's get the slug from DB or updateMyStore result
  const store = await Store.findById(storeId);
  
  const { status, data } = await apiRequest(`/stores/public/${store.slug}`);

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.store.name, 'Test Store Alpha Updated');
});

test('10. Admin can suspend a store', async () => {
  const { status, data } = await apiRequest(`/stores/${storeId}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'suspended',
    }),
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.store.status, 'suspended');
});
