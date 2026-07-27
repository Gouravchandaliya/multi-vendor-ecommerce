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

let mongoServer;
let server;
let baseUrl;

let sellerUser, sellerToken, storeObj;
let buyerUser, buyerToken;

const secret = process.env.ACCESS_TOKEN_SECRET || 'replace_with_a_long_random_secret_string';

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // 1. Create Users
  sellerUser = await User.create({
    name: 'AI Seller',
    email: 'seller-ai@example.com',
    password: 'Password123',
    role: 'seller',
  });

  buyerUser = await User.create({
    name: 'AI Buyer',
    email: 'buyer-ai@example.com',
    password: 'Password123',
    role: 'buyer',
  });

  sellerToken = jwt.sign({ userId: sellerUser._id, role: sellerUser.role }, secret, { expiresIn: '1h' });
  buyerToken  = jwt.sign({ userId: buyerUser._id, role: buyerUser.role }, secret, { expiresIn: '1h' });

  storeObj = await Store.create({
    seller: sellerUser._id,
    name: 'AI Test Store',
    slug: 'ai-test-store',
    status: 'approved',
  });

  // 2. Start HTTP Server
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
    method: options.method || 'POST',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

// ─── INTEGRATION TEST SUITE FOR PHASE 12 ───────────────────────────────────────

test('1. Unauthenticated request to AI endpoint is rejected (401 Unauthorized)', async () => {
  const { status } = await apiRequest('/seller/ai/generate-product-content', {
    body: { name: 'Test Product' },
  });
  assert.strictEqual(status, 401);
});

test('2. Buyer role request to AI endpoint is rejected (403 Forbidden)', async () => {
  const { status, data } = await apiRequest('/seller/ai/generate-product-content', {
    token: buyerToken,
    body: { name: 'Test Product' },
  });
  assert.strictEqual(status, 403);
  assert.match(data.message, /Access denied/i);
});

test('3. Seller request with missing product name is rejected (400 Bad Request)', async () => {
  const { status, data } = await apiRequest('/seller/ai/generate-product-content', {
    token: sellerToken,
    body: { category: 'Electronics' },
  });
  assert.strictEqual(status, 400);
  assert.match(data.message, /Product name is required/i);
});

test('4. Seller request with valid product facts executes gracefully (200 OK or 503 fallback if unconfigured)', async () => {
  const { status, data } = await apiRequest('/seller/ai/generate-product-content', {
    token: sellerToken,
    body: {
      name: 'Wireless Studio Headphones',
      category: 'Electronics',
      brand: 'SoundPro',
      notes: '40hr battery, ANC, Bluetooth 5.3',
      tone: 'Professional',
    },
  });

  // Either 200 OK (if GEMINI_API_KEY is configured in test env) or 503 (if unconfigured fallback)
  assert.ok(status === 200 || status === 503);
  if (status === 200) {
    assert.strictEqual(data.success, true);
    assert.ok(data.data.content.description.length > 0);
  } else {
    assert.match(data.message, /unconfigured/i);
  }
});
