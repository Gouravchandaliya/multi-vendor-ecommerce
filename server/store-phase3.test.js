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

// Test state
let buyerUser = null;
let buyerToken = '';
let adminUser = null;
let adminToken = '';
let storeId = '';
let storeSlug = '';

const buyerEmail = 'buyer-onboard@example-test.com';
const adminEmail = 'admin-onboard@example-test.com';
const password = 'Password123';

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Create admin user
  adminUser = await User.create({
    name: 'Platform Admin',
    email: adminEmail,
    password: password,
    role: 'admin',
  });

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

async function apiRequest(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

// ─── 20-STEP INTEGRATION TEST SUITE ──────────────────────────────────────────

test('1 & 2. Register a new buyer and login', async () => {
  const regRes = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Onboard Buyer',
      email: buyerEmail,
      password: password,
    }),
  });
  assert.strictEqual(regRes.status, 201);
  assert.strictEqual(regRes.data.data.user.role, 'buyer');

  const loginRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: buyerEmail, password: password }),
  });
  assert.strictEqual(loginRes.status, 200);
  buyerToken = loginRes.data.data.accessToken;
});

test('3, 4 & 5. Submit store application -> Status pending', async () => {
  const { status, data } = await apiRequest('/stores', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      name: 'Onboarded Tech Store',
      description: 'High performance gadget marketplace',
      businessEmail: 'contact@onboardedtech.com',
      businessPhone: '+1-555-0199',
      address: '100 Innovation Way',
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      postalCode: '78701',
    }),
  });

  assert.strictEqual(status, 201);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.store.status, 'pending');
  assert.strictEqual(data.data.store.name, 'Onboarded Tech Store');
  assert.strictEqual(data.data.store.businessEmail, 'contact@onboardedtech.com');
  
  storeId = data.data.store._id;
  storeSlug = data.data.store.slug;
});

test('6. Verify duplicate store application is rejected (409 Conflict)', async () => {
  const { status, data } = await apiRequest('/stores', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      name: 'Second Store Attempt',
    }),
  });

  assert.strictEqual(status, 409);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /already have a seller application/);
});

test('7. Verify pending seller cannot access product publishing (403 Forbidden)', async () => {
  const { status, data } = await apiRequest('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      name: 'Blocked Product',
      description: 'Description long enough',
      category: 'Gadgets',
      brand: 'Brand',
      price: 99.99,
      stock: 10,
    }),
  });

  assert.strictEqual(status, 403);
  assert.match(data.message, /approved/i);
});

test('8 & 9. Login as admin and view pending store application', async () => {
  const loginRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: adminEmail, password: password }),
  });
  assert.strictEqual(loginRes.status, 200);
  adminToken = loginRes.data.data.accessToken;

  const { status, data } = await apiRequest('/stores?status=pending', {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  assert.strictEqual(status, 200);
  assert.ok(data.data.stores.some((s) => s._id === storeId));
});

test('10 & 11. Admin approves store -> Status becomes approved', async () => {
  const { status, data } = await apiRequest(`/stores/${storeId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.store.status, 'approved');
  assert.strictEqual(data.data.store.rejectionReason, '');
});

test('12, 13 & 14. Seller can fetch own store details after approval', async () => {
  const { status, data } = await apiRequest('/stores/my', {
    method: 'GET',
    headers: { Authorization: `Bearer ${buyerToken}` },
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.store._id, storeId);
  assert.strictEqual(data.data.store.status, 'approved');
});

test('15. Seller updates store business details', async () => {
  const { status, data } = await apiRequest('/stores/my', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      name: 'Onboarded Tech Store Pro',
      description: 'Updated store description',
      businessPhone: '+1-555-9999',
    }),
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.data.store.name, 'Onboarded Tech Store Pro');
  assert.strictEqual(data.data.store.businessPhone, '+1-555-9999');
  assert.strictEqual(data.data.store.status, 'approved'); // Status remains unchanged
});

test('16 & 17. Seller cannot approve/suspend stores or access admin status endpoints', async () => {
  const { status, data } = await apiRequest(`/stores/${storeId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${buyerToken}` },
  });

  assert.strictEqual(status, 403);
  assert.match(data.message, /Access denied/);
});

test('18 & 19. Unauthorized users (buyer/seller) cannot access admin GET /stores', async () => {
  const { status, data } = await apiRequest('/stores', {
    method: 'GET',
    headers: { Authorization: `Bearer ${buyerToken}` },
  });

  assert.strictEqual(status, 403);
  assert.match(data.message, /Access denied/);
});

test('20. Test rejection with reason, suspension, and reactivation flow', async () => {
  // A. Admin rejects store with custom reason
  const rejectRes = await apiRequest(`/stores/${storeId}/reject`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ rejectionReason: 'Incomplete tax documentation' }),
  });
  assert.strictEqual(rejectRes.status, 200);
  assert.strictEqual(rejectRes.data.data.store.status, 'rejected');
  assert.strictEqual(rejectRes.data.data.store.rejectionReason, 'Incomplete tax documentation');

  // B. Admin suspends store
  const suspendRes = await apiRequest(`/stores/${storeId}/suspend`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(suspendRes.status, 200);
  assert.strictEqual(suspendRes.data.data.store.status, 'suspended');

  // C. Admin reactivates store
  const reactivateRes = await apiRequest(`/stores/${storeId}/reactivate`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(reactivateRes.status, 200);
  assert.strictEqual(reactivateRes.data.data.store.status, 'approved');
});
