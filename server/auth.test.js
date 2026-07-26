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

// Shared test variables
let buyerToken = '';
let buyerCookie = '';
const testEmail = 'phase2-buyer@example-test.com';
const testPassword = 'Password123';

before(async () => {
  // Start in-memory DB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Start HTTP server on random port
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

// Helper function for API requests
async function apiRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await response.json().catch(() => null);
  const setCookieHeader = response.headers.get('set-cookie');

  return { status: response.status, data, setCookieHeader };
}

// ─── PHASE 2 TEST SUITE ───────────────────────────────────────────────────────

test('1. Test user registration (Default Role: Buyer)', async () => {
  const { status, data } = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Jane Buyer',
      email: testEmail,
      password: testPassword,
      role: 'buyer',
    }),
  });

  assert.strictEqual(status, 201);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.user.name, 'Jane Buyer');
  assert.strictEqual(data.data.user.email, testEmail);
  assert.strictEqual(data.data.user.role, 'buyer');
  assert.ok(data.data.accessToken);

  // Requirement 10: Verify password is not exposed by APIs
  assert.strictEqual(data.data.user.password, undefined);
  assert.strictEqual(data.data.user.refreshToken, undefined);
});

test('2. Test duplicate email registration rejection', async () => {
  const { status, data } = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Duplicate Jane',
      email: testEmail,
      password: testPassword,
    }),
  });

  assert.strictEqual(status, 409);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /already exists/);
});

test('3. Test user login with valid credentials', async () => {
  const { status, data, setCookieHeader } = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.accessToken);
  assert.strictEqual(data.data.user.email, testEmail);

  // Requirement 10: Verify password is not exposed
  assert.strictEqual(data.data.user.password, undefined);

  // Store tokens for downstream tests
  buyerToken = data.data.accessToken;
  if (setCookieHeader) {
    buyerCookie = setCookieHeader.split(';')[0];
  }
});

test('4. Test incorrect password login rejection', async () => {
  const { status, data } = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'WrongPassword999',
    }),
  });

  assert.strictEqual(status, 401);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /Invalid email or password/);
});

test('5. Test protected API without token', async () => {
  const { status, data } = await apiRequest('/auth/me', {
    method: 'GET',
  });

  assert.strictEqual(status, 401);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /Access token required/);
});

test('6. Test protected API with valid token & password exclusion', async () => {
  const { status, data } = await apiRequest('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${buyerToken}`,
    },
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.user.email, testEmail);

  // Requirement 10: Verify password is not exposed
  assert.strictEqual(data.data.user.password, undefined);
  assert.strictEqual(data.data.user.refreshToken, undefined);
});

test('7. Test unauthorized role access (Buyer accessing admin endpoint)', async () => {
  const { status, data } = await apiRequest('/stores', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${buyerToken}`, // buyer role calling admin GET /stores
    },
  });

  assert.strictEqual(status, 403);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /Access denied/);
});

test('8. Test current-user restoration / refresh token endpoint', async () => {
  const { status, data } = await apiRequest('/auth/refresh-token', {
    method: 'POST',
    headers: {
      Cookie: buyerCookie,
    },
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.accessToken);
});

test('9. Test logout and refresh token invalidation', async () => {
  const { status, data } = await apiRequest('/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${buyerToken}`,
      Cookie: buyerCookie,
    },
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);

  // Verify the refresh token cannot be reused after logout
  const refreshRes = await apiRequest('/auth/refresh-token', {
    method: 'POST',
    headers: {
      Cookie: buyerCookie,
    },
  });
  assert.strictEqual(refreshRes.status, 401);
});

test('10. Verify password hashing & security rules', async () => {
  const userInDb = await User.findOne({ email: testEmail }).select('+password');
  assert.ok(userInDb);
  assert.notStrictEqual(userInDb.password, testPassword);
  assert.match(userInDb.password, /^\$2[ayb]\$/); // bcrypt hash format check
});
