/**
 * 2FA Complete Test Script
 * Tests all 2FA endpoints end-to-end
 */

const speakeasy = require('speakeasy');

const API_URL = 'http://localhost:4000/api';

// Test user credentials
const TEST_USER = {
  email: 'test2fa@test.com',
  password: 'Test123!@#',
  name: 'Test 2FA User'
};

let authToken = null;
let twoFactorSecret = null;
let tempToken = null;

async function request(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (authToken) {
    options.headers['Cookie'] = `token=${authToken}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();

  // Extract token from Set-Cookie header
  const setCookie = response.headers.get('set-cookie');
  if (setCookie && setCookie.includes('token=')) {
    const match = setCookie.match(/token=([^;]+)/);
    if (match) {
      authToken = match[1];
    }
  }

  return { status: response.status, data };
}

async function registerOrLogin() {
  console.log('\n📝 Step 1: Register or Login test user...');

  // Try to register
  let result = await request('/auth/register', 'POST', TEST_USER);

  if (result.status === 409) {
    // User exists, login instead
    console.log('   User exists, logging in...');
    result = await request('/auth/login', 'POST', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (result.data.data?.requires2FA) {
      console.log('   ⚠️  2FA already enabled, need to disable first');
      return { requires2FA: true, tempToken: result.data.data.tempToken };
    }
  }

  if (result.status !== 200 && result.status !== 201) {
    throw new Error(`Login/Register failed: ${result.data.message}`);
  }

  console.log('   ✅ Logged in successfully');
  return { requires2FA: false };
}

async function test2FAStatus() {
  console.log('\n📊 Step 2: Check 2FA status...');

  const result = await request('/auth/2fa/status', 'GET');

  if (result.status !== 200) {
    throw new Error(`Status check failed: ${result.data.message}`);
  }

  console.log(`   ✅ 2FA Enabled: ${result.data.data.enabled}`);
  console.log(`   ✅ Backup Codes: ${result.data.data.backupCodesRemaining}`);

  return result.data.data;
}

async function test2FASetup() {
  console.log('\n🔧 Step 3: Setup 2FA...');

  const result = await request('/auth/2fa/setup', 'POST');

  if (result.status !== 200) {
    throw new Error(`Setup failed: ${result.data.message}`);
  }

  twoFactorSecret = result.data.data.secret;
  console.log(`   ✅ Secret generated: ${twoFactorSecret.substring(0, 8)}...`);
  console.log(`   ✅ QR Code generated: ${result.data.data.qrCode ? 'Yes' : 'No'}`);

  return result.data.data;
}

async function test2FAEnable() {
  console.log('\n🔐 Step 4: Enable 2FA with verification code...');

  // Generate valid TOTP token using the secret
  const token = speakeasy.totp({
    secret: twoFactorSecret,
    encoding: 'base32'
  });

  console.log(`   Generated TOTP: ${token}`);

  const result = await request('/auth/2fa/enable', 'POST', { token });

  if (result.status !== 200) {
    throw new Error(`Enable failed: ${result.data.message}`);
  }

  console.log(`   ✅ 2FA Enabled successfully`);
  console.log(`   ✅ Backup codes received: ${result.data.data.backupCodes?.length || 0}`);

  return result.data.data;
}

async function testLoginWith2FA() {
  console.log('\n🔑 Step 5: Test login with 2FA...');

  // Clear auth token to simulate fresh login
  authToken = null;

  // Login - should require 2FA
  let result = await request('/auth/login', 'POST', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });

  if (result.status !== 200) {
    throw new Error(`Login failed: ${result.data.message}`);
  }

  if (!result.data.data.requires2FA) {
    throw new Error('Expected requires2FA to be true');
  }

  tempToken = result.data.data.tempToken;
  console.log(`   ✅ Login requires 2FA (tempToken received)`);

  // Generate valid TOTP
  const token = speakeasy.totp({
    secret: twoFactorSecret,
    encoding: 'base32'
  });

  // Verify 2FA
  result = await request('/auth/2fa/verify', 'POST', {
    tempToken,
    token
  });

  if (result.status !== 200) {
    throw new Error(`2FA verification failed: ${result.data.message}`);
  }

  console.log(`   ✅ 2FA verified, login complete`);

  return result.data.data;
}

async function test2FADisable() {
  console.log('\n🔓 Step 6: Disable 2FA...');

  // Generate valid TOTP for disabling
  const token = speakeasy.totp({
    secret: twoFactorSecret,
    encoding: 'base32'
  });

  const result = await request('/auth/2fa/disable', 'POST', {
    password: TEST_USER.password,
    token
  });

  if (result.status !== 200) {
    throw new Error(`Disable failed: ${result.data.message}`);
  }

  console.log(`   ✅ 2FA Disabled successfully`);

  return result.data.data;
}

async function runTests() {
  console.log('═══════════════════════════════════════════');
  console.log('       2FA Complete Test Suite');
  console.log('═══════════════════════════════════════════');

  try {
    // Step 1: Login or register
    const loginResult = await registerOrLogin();

    if (loginResult.requires2FA) {
      console.log('\n⚠️  2FA is already enabled. Running disable test first...');
      // Need to verify 2FA to get logged in
      tempToken = loginResult.tempToken;
      console.log('   Please manually disable 2FA first or provide the current TOTP');
      return;
    }

    // Step 2: Check initial status
    const initialStatus = await test2FAStatus();

    if (initialStatus.enabled) {
      console.log('\n⚠️  2FA already enabled. Disabling first...');
      await test2FADisable();
    }

    // Step 3: Setup 2FA
    await test2FASetup();

    // Step 4: Enable 2FA
    await test2FAEnable();

    // Step 5: Verify 2FA is enabled
    const statusAfterEnable = await test2FAStatus();
    if (!statusAfterEnable.enabled) {
      throw new Error('2FA should be enabled but is not');
    }

    // Step 6: Test login with 2FA
    await testLoginWith2FA();

    // Step 7: Disable 2FA
    await test2FADisable();

    // Step 8: Verify 2FA is disabled
    const finalStatus = await test2FAStatus();
    if (finalStatus.enabled) {
      throw new Error('2FA should be disabled but is not');
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('       ✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.log('\n═══════════════════════════════════════════');
    console.log(`       ❌ TEST FAILED: ${error.message}`);
    console.log('═══════════════════════════════════════════\n');
    process.exit(1);
  }
}

runTests();
