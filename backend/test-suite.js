const axios = require('axios');
const fs = require('fs');

// Configuration
// Test directly against Hostinger backend
const BASE_URL = process.env.API_BASE_URL || 'https://api.ecosudar.com/api';
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results storage
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
  startTime: new Date(),
  endTime: null,
};

// Test data
let authToken = null;
let refreshToken = null;
let testUserId = null;
let testOrderId = null;

// Helper functions
function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${icon} ${name}${details ? ': ' + details : ''}`, color);
}

async function runTest(name, testFn) {
  results.total++;
  try {
    const result = await testFn();
    if (result.pass) {
      results.passed++;
      logTest(name, 'pass', result.message);
      results.tests.push({ name, status: 'pass', message: result.message, time: result.time });
    } else {
      results.failed++;
      logTest(name, 'fail', result.message);
      results.tests.push({ name, status: 'fail', message: result.message, error: result.error, time: result.time });
    }
  } catch (error) {
    results.failed++;
    logTest(name, 'fail', error.message);
    results.tests.push({ name, status: 'fail', error: error.message });
  }
}

// Test helper
async function testEndpoint(method, endpoint, data = null, expectedStatus = 200, headers = {}) {
  const startTime = Date.now();
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    const time = Date.now() - startTime;
    
    if (response.status === expectedStatus) {
      return { pass: true, message: `${response.status} - ${time}ms`, data: response.data, time };
    } else {
      return { pass: false, message: `Expected ${expectedStatus}, got ${response.status}`, time };
    }
  } catch (error) {
    const time = Date.now() - startTime;
    if (error.response && error.response.status === expectedStatus) {
      return { pass: true, message: `${error.response.status} - ${time}ms`, data: error.response.data, time };
    }
    return { 
      pass: false, 
      message: `Expected ${expectedStatus}, got ${error.response?.status || 'Network Error'}`,
      error: error.response?.data || error.message,
      time
    };
  }
}

// ============================================
// AUTHENTICATION TESTS
// ============================================

async function testAuthentication() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('AUTHENTICATION ENDPOINTS (12 tests)', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  // 1. Register - Valid
  await runTest('POST /auth/register - Valid registration', async () => {
    const result = await testEndpoint('POST', '/auth/register', {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      phone: `98765${Math.floor(Math.random() * 100000)}`,
      password: 'password123',
      user_type: 'customer',
    }, 201);
    
    if (result.pass && result.data?.data?.token) {
      authToken = result.data.data.token;
      refreshToken = result.data.data.refresh_token;
      testUserId = result.data.data.user.user_id;
    }
    return result;
  });

  // 2. Register - Duplicate email
  await runTest('POST /auth/register - Duplicate email (409)', async () => {
    return await testEndpoint('POST', '/auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      phone: '9876543210',
      password: 'password123',
      user_type: 'customer',
    }, 409);
  });

  // 3. Register - Invalid email
  await runTest('POST /auth/register - Invalid email (422)', async () => {
    return await testEndpoint('POST', '/auth/register', {
      name: 'Test User',
      email: 'invalid-email',
      phone: '9876543210',
      password: 'password123',
      user_type: 'customer',
    }, 422);
  });

  // 4. Register - Weak password
  await runTest('POST /auth/register - Weak password (422)', async () => {
    return await testEndpoint('POST', '/auth/register', {
      name: 'Test User',
      email: 'test2@example.com',
      phone: '9876543211',
      password: '123',
      user_type: 'customer',
    }, 422);
  });

  // 5. Login - Valid
  await runTest('POST /auth/login - Valid login', async () => {
    const result = await testEndpoint('POST', '/auth/login', {
      phone: '9876543210',
      password: 'password123',
    }, 200);
    
    if (result.pass && result.data?.data?.token) {
      authToken = result.data.data.token;
      refreshToken = result.data.data.refresh_token;
    }
    return result;
  });

  // 6. Login - Wrong password
  await runTest('POST /auth/login - Wrong password (401)', async () => {
    return await testEndpoint('POST', '/auth/login', {
      phone: '9876543210',
      password: 'wrongpassword',
    }, 401);
  });

  // 7. Get Me - With token
  await runTest('GET /auth/me - With valid token', async () => {
    return await testEndpoint('GET', '/auth/me', null, 200, {
      Authorization: `Bearer ${authToken}`,
    });
  });

  // 8. Get Me - Without token
  await runTest('GET /auth/me - Without token (401)', async () => {
    return await testEndpoint('GET', '/auth/me', null, 401);
  });

  // 9. Refresh Token - Valid
  if (refreshToken) {
    await runTest('POST /auth/refresh - Refresh token', async () => {
      return await testEndpoint('POST', '/auth/refresh', {
        refresh_token: refreshToken,
      }, 200);
    });
  }

  // 10. Forgot Password (moved before logout)
  await runTest('POST /auth/forgot-password - Send OTP', async () => {
    return await testEndpoint('POST', '/auth/forgot-password', {
      email: 'test@example.com',
    }, 200);
  });

  // 11. Verify OTP - Invalid OTP
  await runTest('POST /auth/verify-otp - Invalid OTP (401)', async () => {
    return await testEndpoint('POST', '/auth/verify-otp', {
      identifier: 'test@example.com',
      otp: '000000',
    }, 401);
  });

  // 12. Reset Password - Without valid reset token (401)
  await runTest('POST /auth/reset-password - Without valid token (401)', async () => {
    return await testEndpoint('POST', '/auth/reset-password', {
      new_password: 'newpassword123',
      confirm_password: 'newpassword123',
    }, 401);
  });
}

// ============================================
// PRODUCT TESTS
// ============================================

async function testProducts() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('PRODUCT ENDPOINTS (3 tests)', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  // 1. Get all products
  await runTest('GET /products - Get all products', async () => {
    return await testEndpoint('GET', '/products', null, 200);
  });

  // 2. Get single product
  await runTest('GET /products/:id - Get single product', async () => {
    return await testEndpoint('GET', '/products/1', null, 200);
  });

  // 3. Get product configurations
  await runTest('GET /products/:id/configurations - Get configurations', async () => {
    return await testEndpoint('GET', '/products/1/configurations', null, 200);
  });
}

// ============================================
// ORDER TESTS
// ============================================

async function testOrders() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('ORDER ENDPOINTS (5 tests)', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  // 1. Create order - Valid
  await runTest('POST /orders - Create order with valid data', async () => {
    const result = await testEndpoint('POST', '/orders', {
      delivery_address: '123 Test Street',
      delivery_city: 'Chennai',
      delivery_state: 'Tamil Nadu',
      delivery_pincode: '600001',
      payment_method: 'COD',
      items: [
        {
          product_id: 1,
          quantity: 10,
          size: '6mm',
          purpose: 'Commercial Kitchen',
          sub_purpose: 'Food Processing',
        },
      ],
    }, 201, { Authorization: `Bearer ${authToken}` });
    
    if (result.pass && result.data?.data?.order_id) {
      testOrderId = result.data.data.order_id;
    }
    return result;
  });

  // 2. Create order - Missing fields
  await runTest('POST /orders - Missing required fields (422)', async () => {
    return await testEndpoint('POST', '/orders', {
      delivery_address: '123 Test Street',
      // Missing other required fields
    }, 422, { Authorization: `Bearer ${authToken}` });
  });

  // 3. Get all orders
  await runTest('GET /orders - Get all orders', async () => {
    return await testEndpoint('GET', '/orders', null, 200, {
      Authorization: `Bearer ${authToken}`,
    });
  });

  // 4. Get single order
  if (testOrderId) {
    await runTest('GET /orders/:id - Get single order', async () => {
      return await testEndpoint('GET', `/orders/${testOrderId}`, null, 200, {
        Authorization: `Bearer ${authToken}`,
      });
    });
  }

  // 5. Update order status
  if (testOrderId) {
    await runTest('PUT /orders/:id/status - Update order status', async () => {
      return await testEndpoint('PUT', `/orders/${testOrderId}/status`, {
        order_status: 'confirmed',
      }, 200, { Authorization: `Bearer ${authToken}` });
    });
  }
}

// ============================================
// USER TESTS
// ============================================

async function testUsers() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('USER ENDPOINTS (6 tests)', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  // 1. Get user by ID
  if (testUserId) {
    await runTest('GET /users/:id - Get user by ID', async () => {
      return await testEndpoint('GET', `/users/${testUserId}`, null, 200, {
        Authorization: `Bearer ${authToken}`,
      });
    });
  }

  // 2. Update user
  if (testUserId) {
    await runTest('PUT /users/:id - Update user', async () => {
      return await testEndpoint('PUT', `/users/${testUserId}`, {
        name: 'Updated Name',
        city: 'Mumbai',
      }, 200, { Authorization: `Bearer ${authToken}` });
    });
  }

  // 3. Get user orders
  if (testUserId) {
    await runTest('GET /users/:id/orders - Get user orders', async () => {
      return await testEndpoint('GET', `/users/${testUserId}/orders`, null, 200, {
        Authorization: `Bearer ${authToken}`,
      });
    });
  }

  // 4. Get user by email
  await runTest('GET /users/email/:email - Get user by email', async () => {
    return await testEndpoint('GET', '/users/email/test@example.com', null, 200, {
      Authorization: `Bearer ${authToken}`,
    });
  });

  // 5. Change password
  if (testUserId) {
    await runTest('PUT /users/:id/password - Change password', async () => {
      return await testEndpoint('PUT', `/users/${testUserId}/password`, {
        old_password: 'password123',
        new_password: 'newpassword123',
      }, 200, { Authorization: `Bearer ${authToken}` });
    });
  }

  // 6. Delete user - Unauthorized (different user)
  await runTest('DELETE /users/:id - Delete user unauthorized (403)', async () => {
    return await testEndpoint('DELETE', '/users/999', null, 403, {
      Authorization: `Bearer ${authToken}`,
    });
  });
}

// ============================================
// STATISTICS TESTS
// ============================================

async function testStatistics() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('STATISTICS ENDPOINTS (2 tests)', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  // 1. Get order statistics
  await runTest('GET /statistics/orders - Get order statistics', async () => {
    return await testEndpoint('GET', '/statistics/orders?days=30', null, 200, {
      Authorization: `Bearer ${authToken}`,
    });
  });

  // 2. Get active orders
  await runTest('GET /statistics/active-orders - Get active orders', async () => {
    return await testEndpoint('GET', '/statistics/active-orders', null, 200, {
      Authorization: `Bearer ${authToken}`,
    });
  });
}

// ============================================
// LOGOUT TEST (Run at the very end)
// ============================================

async function testLogout() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('LOGOUT TEST (1 test)', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  // Logout - Run last so token stays valid for all other tests
  await runTest('POST /auth/logout - Logout with token', async () => {
    return await testEndpoint('POST', '/auth/logout', null, 200, {
      Authorization: `Bearer ${authToken}`,
    });
  });
}

// ============================================
// GENERATE REPORT
// ============================================

function generateReport() {
  results.endTime = new Date();
  const duration = (results.endTime - results.startTime) / 1000;
  
  log('\n\n═══════════════════════════════════════════════════════', 'blue');
  log('                  TEST SUMMARY                          ', 'blue');
  log('═══════════════════════════════════════════════════════\n', 'blue');
  
  log(`Total Tests: ${results.total}`);
  log(`✅ Passed: ${results.passed} (${Math.round((results.passed / results.total) * 100)}%)`, 'green');
  log(`❌ Failed: ${results.failed} (${Math.round((results.failed / results.total) * 100)}%)`, 'red');
  log(`⏭️  Skipped: ${results.skipped}`, 'yellow');
  log(`⏱️  Duration: ${duration.toFixed(2)}s\n`);
  
  if (results.failed > 0) {
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'red');
    log('FAILED TESTS:', 'red');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'red');
    
    results.tests.filter(t => t.status === 'fail').forEach(test => {
      log(`❌ ${test.name}`, 'red');
      log(`   Error: ${test.message}`, 'red');
      if (test.error) {
        log(`   Details: ${JSON.stringify(test.error, null, 2)}`, 'red');
      }
      log('');
    });
  }
  
  // Save JSON report
  fs.writeFileSync('test-report.json', JSON.stringify(results, null, 2));
  log('📄 Report saved to: test-report.json', 'cyan');
}

// ============================================
// MAIN
// ============================================

async function main() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'blue');
  log('║         API ENDPOINT COMPREHENSIVE TEST SUITE         ║', 'blue');
  log('║                  EcoSudar Backend                     ║', 'blue');
  log('╚═══════════════════════════════════════════════════════╝\n', 'blue');
  
  log(`🎯 Testing API: ${BASE_URL}`, 'cyan');
  log(`📅 Started: ${results.startTime.toLocaleString()}\n`, 'cyan');
  
  try {
    await testAuthentication();
    await testProducts();
    await testOrders();
    await testUsers();
    await testStatistics();
    await testLogout(); // Run logout last so token stays valid for all other tests
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
  }
  
  generateReport();
}

// Run tests
main().catch(console.error);