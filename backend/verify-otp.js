/**
 * OTP Verification Test Script
 * Usage: node backend/verify-otp.js YOUR_OTP_CODE
 */

const axios = require('axios');

const API_BASE_URL = 'https://api.ecosudar.com/api';
const TEST_EMAIL = 'kaushikwork2004@gmail.com';

async function verifyOTP(otpCode) {
  console.log('🔐 Verifying OTP\n');
  console.log('='.repeat(50));

  if (!otpCode) {
    console.error('❌ Error: Please provide OTP code as argument');
    console.log('Usage: node backend/verify-otp.js YOUR_OTP_CODE');
    process.exit(1);
  }

  try {
    console.log('\n📧 Email:', TEST_EMAIL);
    console.log('🔢 OTP Code:', otpCode);
    console.log('\n⏳ Verifying...\n');

    const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
      identifier: TEST_EMAIL,
      otp: otpCode
    });
    
    console.log('✅ OTP Verified Successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data?.reset_token) {
      console.log('\n🎉 You can now reset your password using the reset_token above!');
    }
    
  } catch (error) {
    console.error('\n❌ Verification Failed!');
    
    const errorData = error.response?.data;
    console.error('Error:', JSON.stringify(errorData, null, 2));
    
    if (errorData?.errors?.attempts_remaining !== undefined) {
      const attemptsLeft = errorData.errors.attempts_remaining;
      console.log(`\n⚠️  Attempts Remaining: ${attemptsLeft}`);
      
      if (attemptsLeft === 0) {
        console.log('\n🚫 NO ATTEMPTS LEFT!');
        console.log('💡 Solutions:');
        console.log('   1. Wait 15-30 minutes for rate limit to reset');
        console.log('   2. Request a NEW OTP by running: node backend/test-otp-flow.js');
        console.log('   3. Try with a different email address');
        console.log('   4. Contact the API administrator to reset your rate limit');
      } else {
        console.log(`\n💡 You have ${attemptsLeft} more attempt(s). Double-check your OTP code!`);
      }
    }
    
    if (error.response?.status === 401) {
      console.log('\n🔍 Common Issues:');
      console.log('   • OTP code is incorrect (check for typos)');
      console.log('   • OTP has expired (valid for 10 minutes)');
      console.log('   • Too many failed attempts (0 remaining)');
    }
  }
}

// Get OTP from command line argument
const otpCode = process.argv[2];
verifyOTP(otpCode);