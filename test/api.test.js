const assert = require('assert');
const http = require('http');

// Simple test runner for the no-as-a-service API
// Run with: node test/api.test.js

const BASE_URL = 'http://localhost:3000';

// Helper to make HTTP GET requests
function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            json: JSON.parse(data),
          });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data, json: null });
        }
      });
    }).on('error', reject);
  });
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\nRunning no-as-a-service API tests...\n');

  // Test: GET /
  await test('GET / returns a no response', async () => {
    const res = await get('/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.json, 'Response should be valid JSON');
    assert.ok(res.json.answer, 'Response should have an answer field');
    assert.strictEqual(res.json.answer.toLowerCase(), 'no', 'Answer should be "no"');
  });

  await test('GET / returns a reason', async () => {
    const res = await get('/');
    assert.ok(res.json.reason, 'Response should have a reason field');
    assert.strictEqual(typeof res.json.reason, 'string', 'Reason should be a string');
    assert.ok(res.json.reason.length > 0, 'Reason should not be empty');
  });

  await test('GET / returns JSON content-type', async () => {
    const res = await get('/');
    assert.ok(
      res.headers['content-type'].includes('application/json'),
      'Content-Type should be application/json'
    );
  });

  // Test: GET /no
  await test('GET /no returns a no response', async () => {
    const res = await get('/no');
    assert.strictEqual(res.status, 200);
    assert.ok(res.json, 'Response should be valid JSON');
    assert.ok(res.json.answer, 'Response should have an answer field');
  });

  // Test: multiple requests return different reasons (probabilistic)
  await test('Multiple requests return varied reasons', async () => {
    const reasons = new Set();
    for (let i = 0; i < 10; i++) {
      const res = await get('/');
      reasons.add(res.json.reason);
    }
    assert.ok(reasons.size > 1, 'Should return more than one unique reason across 10 requests');
  });

  // Test: 404 for unknown routes
  await test('Unknown route returns 404', async () => {
    const res = await get('/this-route-does-not-exist');
    assert.strictEqual(res.status, 404);
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Could not connect to server. Is it running on port 3000?');
  console.error(err.message);
  process.exit(1);
});
