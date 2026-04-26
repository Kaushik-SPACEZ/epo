/**
 * Complete OTP Flow Test Script
 * Tests both send-otp and verify-otp endpoints
 * 
 * Usage: node backend/test-otp-complete.js YOUR_EMAIL
 */

const axios = require('axios');
const readline = require('readline');

const API_BASE_URL = 'https://api.ecosudar.com/api';

// Get email from command line or use default
const TEST_EMAIL = process.argv[2] || 'kaushikwork2004@gmail.com';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Helper function to make API calls with better error handling
async function makeRequest(method, endpoint, data = null) {
  try {
    console.log(`\n📡 Making ${method} request to: ${endpoint}`);
    console.log(`📦 Payload:`, JSON.stringify(data, null, 2));
    
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        data: error.response.data,
        error: error.response.data?.message || error.response.data?.error || 'Request failed'
      };
    } else {
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }
}

async function testCompleteOTPFlow() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Complete OTP Flow Test (send-otp + verify-otp)    ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n📧 Testing with email: ${TEST_EMAIL}\n`);

  try {
    // ============================================
    // STEP 1: Send OTP
    // ============================================
    console.log('═'.repeat(60));
    console.log('STEP 1: Sending OTP');
    console.log('═'.repeat(60));

    const sendResult = await makeRequest('POST', '/auth/send-otp', {
      email: TEST_EMAIL
    });

    console.log(`\n📊 Response Status: ${sendResult.status}`);
    console.log('📄 Response Body:');
    console.log(JSON.stringify(sendResult.data, null, 2));

    if (!sendResult.success) {
      console.log('\n❌ FAILED: Could not send OTP');
      console.log(`Error: ${sendResult.error}`);
      
      if (sendResult.status === 429) {
        console.log('\n⚠️  Rate Limited! You need to wait before requesting another OTP.');
        console.log('💡 Try again in 15-30 minutes.');
      }
      
      rl.close();
      return;
    }

    console.log('\n✅ SUCCESS: OTP sent successfully!');
    console.log(`📧 Check your email: ${TEST_EMAIL}`);
    
    if (sendResult.data.data) {
      console.log(`⏰ OTP expires in: ${sendResult.data.data.expires_in} seconds (${Math.floor(sendResult.data.data.expires_in / 60)} minutes)`);
      console.log(`🎯 Purpose: ${sendResult.data.data.purpose}`);
      console.log(`👤 User exists: ${sendResult.data.data.user_exists}`);
    }

    // ============================================
    // STEP 2: Get OTP from user
    // ============================================
    console.log('\n' + '═'.repeat(60));
    console.log('STEP 2: Enter OTP Code');
    console.log('═'.repeat(60));

    const otpCode = await askQuestion('\n🔢 Enter the OTP code from your email: ');

    if (!otpCode || otpCode.trim().length < 4) {
      console.log('\n❌ Invalid OTP code. Please run the script again.');
      rl.close();
      return;
    }

    // ============================================
    // STEP 3: Verify OTP
    // ============================================
    console.log('\n' + '═'.repeat(60));
    console.log('STEP 3: Verifying OTP');
    console.log('═'.repeat(60));

    const verifyResult = await makeRequest('POST', '/auth/verify-otp', {
      identifier: TEST_EMAIL,
      otp: otpCode.trim(),
      purpose: 'email_verification'  // or 'password_reset' depending on use case
    });

    console.log(`\n📊 Response Status: ${verifyResult.status}`);
    console.log('📄 Response Body:');
    console.log(JSON.stringify(verifyResult.data, null, 2));

    if (!verifyResult.success) {
      console.log('\n❌ FAILED: OTP verification failed');
      console.log(`Error: ${verifyResult.error}`);
      
      if (verifyResult.data?.errors?.attempts_remaining !== undefined) {
        const attemptsLeft = verifyResult.data.errors.attempts_remaining;
        console.log(`\n⚠️  Attempts Remaining: ${attemptsLeft}`);
        
        if (attemptsLeft === 0) {
          console.log('\n🚫 NO ATTEMPTS LEFT!');
          console.log('💡 Solutions:');
          console.log('   1. Wait 15-30 minutes for rate limit to reset');
          console.log('   2. Request a NEW OTP by running this script again');
          console.log('   3. Try with a different email address');
        } else {
          console.log(`\n💡 You have ${attemptsLeft} more attempt(s). Try again!`);
        }
      }
      
      rl.close();
      return;
    }

    console.log('\n✅ SUCCESS: OTP verified successfully!');
    
    if (verifyResult.data.data?.reset_token) {
      console.log('\n🎉 Got reset_token for password reset!');
      console.log(`🔑 Token: ${verifyResult.data.data.reset_token.substring(0, 50)}...`);
      if (verifyResult.data.data.expires_at) {
        console.log(`⏰ Expires at: ${verifyResult.data.data.expires_at}`);
      }
      console.log('\n💡 You can now use this token to reset your password!');
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '═'.repeat(60));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log('✅ Step 1: Send OTP - SUCCESS');
    console.log('✅ Step 2: User Input - SUCCESS');
    console.log('✅ Step 3: Verify OTP - SUCCESS');
    console.log('\n🎉 Complete OTP flow working perfectly!');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ Unexpected Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the test
console.log('\n🚀 Starting Complete OTP Flow Test...\n');
testCompleteOTPFlow();