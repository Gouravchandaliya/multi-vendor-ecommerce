const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const User = require('./models/User.model');

let server;
let port;
let baseUrl;

let adminToken = '';
let buyerToken = '';

const adminEmail = 'admin@marketplace.com';
const adminPassword = 'Admin@12345';
const buyerEmail = 'verify-buyer@example-test.com';

before(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Create a test buyer
  await User.deleteMany({ email: buyerEmail });
  await User.create({
    name: 'Test Buyer Role',
    email: buyerEmail,
    password: 'Password123',
    role: 'buyer',
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
  await User.deleteMany({ email: buyerEmail });
  await mongoose.disconnect();
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

test('1. Admin can login through normal /auth/login page with seeded credentials', async () => {
  const { status, data } = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.accessToken);

  // 2. Returned user role is "admin"
  assert.strictEqual(data.data.user.role, 'admin');
  assert.strictEqual(data.data.user.email, adminEmail);
  assert.strictEqual(data.data.user.password, undefined);

  adminToken = data.data.accessToken;
});

test('3. Admin can access admin-protected endpoint (GET /stores)', async () => {
  const { status, data } = await apiRequest('/stores', {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.data.stores));
});

test('4. Buyer cannot access admin-protected endpoint (GET /stores)', async () => {
  // Login buyer
  const buyerLoginRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: buyerEmail, password: 'Password123' }),
  });
  assert.strictEqual(buyerLoginRes.status, 200);
  buyerToken = buyerLoginRes.data.data.accessToken;

  // Buyer calling admin endpoint -> 403 Forbidden
  const { status, data } = await apiRequest('/stores', {
    method: 'GET',
    headers: { Authorization: `Bearer ${buyerToken}` },
  });

  assert.strictEqual(status, 403);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /Access denied/);
});
