/**
 * Authentication System Test Script
 *
 * This script tests all authentication endpoints to verify the system is working.
 *
 * Prerequisites:
 * 1. MongoDB must be running
 * 2. Server must be running (npm run dev)
 * 3. Environment variables must be configured in .env
 *
 * Usage:
 * node test-auth.js
 */

const BASE_URL = 'http://localhost:5000/api/auth';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test data
const testUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'TestPass123!',
  phoneNumber: '+1234567890'
};

let accessToken = '';
let refreshToken = '';
let cookies = '';

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`TEST: ${name}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (accessToken && !options.noAuth) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (cookies && !options.noCookies) {
    headers['Cookie'] = cookies;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Extract cookies from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      cookies = setCookie.split(';')[0];
      const tokenMatch = setCookie.match(/refreshToken=([^;]+)/);
      if (tokenMatch) {
        refreshToken = tokenMatch[1];
      }
    }

    const data = await response.json();
    return { response, data };
  } catch (error) {
    return { error: error.message };
  }
}

// Test functions
async function testHealthCheck() {
  logTest('Health Check');

  const { response, data, error } = await request('/../health', { noAuth: true, noCookies: true });

  if (error) {
    logError(`Server not responding: ${error}`);
    logInfo('Make sure the server is running with: npm run dev');
    return false;
  }

  if (response.ok && data.success) {
    logSuccess('Server is healthy');
    logInfo(`Status: ${data.status}`);
    logInfo(`Database: ${data.services?.database || 'unknown'}`);
    return true;
  } else {
    logError('Health check failed');
    return false;
  }
}

async function testRegistration() {
  logTest('User Registration');

  logInfo(`Email: ${testUser.email}`);
  logInfo(`Password: ${testUser.password}`);

  const { response, data, error } = await request('/signup', {
    method: 'POST',
    body: JSON.stringify(testUser),
    noAuth: true,
    noCookies: true
  });

  if (error) {
    logError(`Request failed: ${error}`);
    return false;
  }

  if (response.status === 201 && data.success) {
    accessToken = data.data.accessToken;
    logSuccess('User registered successfully');
    logInfo(`User ID: ${data.data.user._id}`);
    logInfo(`Access Token: ${accessToken.substring(0, 20)}...`);
    logInfo(`Refresh Token: ${refreshToken ? 'Set' : 'Not set'}`);
    return true;
  } else {
    logError(`Registration failed: ${data.message || 'Unknown error'}`);
    if (data.errors) {
      data.errors.forEach(err => logError(`  - ${err}`));
    }
    return false;
  }
}

async function testGetProfile() {
  logTest('Get User Profile');

  const { response, data, error } = await request('/me');

  if (error) {
    logError(`Request failed: ${error}`);
    return false;
  }

  if (response.ok && data.success) {
    logSuccess('Profile retrieved successfully');
    logInfo(`Name: ${data.data.user.name}`);
    logInfo(`Email: ${data.data.user.email}`);
    logInfo(`Auth Providers: ${data.data.user.authProviders.join(', ')}`);
    return true;
  } else {
    logError(`Get profile failed: ${data.message || 'Unknown error'}`);
    return false;
  }
}

async function testUpdateProfile() {
  logTest('Update User Profile');

  const updates = {
    name: 'Updated Test User',
    phoneNumber: '+9876543210'
  };

  const { response, data, error } = await request('/me', {
    method: 'PUT',
    body: JSON.stringify(updates)
  });

  if (error) {
    logError(`Request failed: ${error}`);
    return false;
  }

  if (response.ok && data.success) {
    logSuccess('Profile updated successfully');
    logInfo(`New Name: ${data.data.user.name}`);
    logInfo(`New Phone: ${data.data.user.phoneNumber}`);
    return true;
  } else {
    logError(`Update profile failed: ${data.message || 'Unknown error'}`);
    return false;
  }
}

async function testLogout() {
  logTest('Logout');

  const { response, data, error } = await request('/logout', {
    method: 'POST'
  });

  if (error) {
    logError(`Request failed: ${error}`);
    return false;
  }

  if (response.ok && data.success) {
    logSuccess('Logout successful');
    return true;
  } else {
    logError(`Logout failed: ${data.message || 'Unknown error'}`);
    return false;
  }
}

async function testLogin() {
  logTest('User Login');

  const { response, data, error } = await request('/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    }),
    noAuth: true
  });

  if (error) {
    logError(`Request failed: ${error}`);
    return false;
  }

  if (response.ok && data.success) {
    accessToken = data.data.accessToken;
    logSuccess('Login successful');
    logInfo(`Access Token: ${accessToken.substring(0, 20)}...`);
    logInfo(`Refresh Token: ${refreshToken ? 'Set' : 'Not set'}`);
    return true;
  } else {
    logError(`Login failed: ${data.message || 'Unknown error'}`);
    return false;
  }
}

async function testRefreshToken() {
  logTest('Refresh Access Token');

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  const oldToken = accessToken;

  const { response, data, error } = await request('/refresh-token', {
    method: 'POST',
    noAuth: true
  });

  if (error) {
    logError(`Request failed: ${error}`);
    return false;
  }

  if (response.ok && data.success) {
    accessToken = data.data.accessToken;
    logSuccess('Token refreshed successfully');
    logInfo(`Old Token: ${oldToken.substring(0, 20)}...`);
    logInfo(`New Token: ${accessToken.substring(0, 20)}...`);
    logInfo(`Tokens different: ${oldToken !== accessToken}`);
    return true;
  } else {
    logError(`Token refresh failed: ${data.message || 'Unknown error'}`);
    return false;
  }
}

async function testChangePassword() {
  logTest('Change Password');

  const newPassword = 'NewTestPass456!';

  const { response, data, error } = await request('/change-password', {
    method: 'POST',
    body: JSON.stringify({
      currentPassword: testUser.password,
      newPassword: newPassword
    })
  });

  if (error) {
    logError(`Request failed: ${error}`);
    return false;
  }

  if (response.ok && data.success) {
    testUser.password = newPassword; // Update for future tests
    logSuccess('Password changed successfully');
    logInfo('User will need to login again');
    return true;
  } else {
    logError(`Change password failed: ${data.message || 'Unknown error'}`);
    return false;
  }
}

async function testInvalidLogin() {
  logTest('Invalid Login Attempt');

  const { response, data, error } = await request('/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser.email,
      password: 'WrongPassword123'
    }),
    noAuth: true,
    noCookies: true
  });

  if (error) {
    logError(`Request failed: ${error}`);
    return false;
  }

  if (!response.ok) {
    logSuccess('Invalid login correctly rejected');
    logInfo(`Status: ${response.status}`);
    logInfo(`Message: ${data.message || data.error?.message}`);
    return true;
  } else {
    logError('Invalid login was accepted (security issue!)');
    return false;
  }
}

async function testUnauthorizedAccess() {
  logTest('Unauthorized Access Protection');

  const oldToken = accessToken;
  accessToken = 'invalid_token_12345';

  const { response, data } = await request('/me');

  accessToken = oldToken; // Restore

  if (!response.ok && response.status === 401) {
    logSuccess('Unauthorized access correctly blocked');
    logInfo(`Status: ${response.status}`);
    return true;
  } else {
    logError('Unauthorized access was allowed (security issue!)');
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(60), 'bright');
  log('🧪 AUTHENTICATION SYSTEM TEST SUITE', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  const tests = [
    { name: 'Health Check', fn: testHealthCheck, critical: true },
    { name: 'Registration', fn: testRegistration, critical: true },
    { name: 'Get Profile', fn: testGetProfile },
    { name: 'Update Profile', fn: testUpdateProfile },
    { name: 'Logout', fn: testLogout },
    { name: 'Login', fn: testLogin, critical: true },
    { name: 'Refresh Token', fn: testRefreshToken },
    { name: 'Change Password', fn: testChangePassword },
    { name: 'Login (after password change)', fn: testLogin, critical: true },
    { name: 'Invalid Login', fn: testInvalidLogin },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
        if (test.critical) {
          log('\n❌ Critical test failed. Stopping tests.\n', 'red');
          break;
        }
      }
    } catch (error) {
      failed++;
      logError(`Test threw exception: ${error.message}`);
      if (test.critical) {
        log('\n❌ Critical test failed. Stopping tests.\n', 'red');
        break;
      }
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Results summary
  log('\n' + '='.repeat(60), 'bright');
  log('TEST RESULTS', 'bright');
  log('='.repeat(60), 'bright');

  const total = passed + failed;
  const percentage = Math.round((passed / total) * 100);

  log(`\nTotal Tests: ${total}`);
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'reset');
  log(`Success Rate: ${percentage}%\n`, percentage === 100 ? 'green' : 'yellow');

  if (percentage === 100) {
    log('🎉 All tests passed! Authentication system is working correctly.\n', 'green');
  } else if (percentage >= 80) {
    log('⚠️  Most tests passed. Check failed tests above.\n', 'yellow');
  } else {
    log('❌ Multiple tests failed. Review the errors above.\n', 'red');
  }

  // Cleanup instructions
  log('='.repeat(60), 'bright');
  log('CLEANUP', 'bright');
  log('='.repeat(60), 'bright');
  log(`\nTest user email: ${testUser.email}`);
  log('To delete test user from MongoDB:');
  log(`  db.users.deleteOne({ email: "${testUser.email}" })\n`, 'cyan');
}

// Run tests
runTests().catch(error => {
  logError(`\nTest suite error: ${error.message}`);
  process.exit(1);
});
