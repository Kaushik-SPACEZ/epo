/**
 * OTP Flow Test Script
 * Tests the complete OTP flow: send-otp -> verify-otp
 */

const axios = require('axios');

const API_BASE_URL = 'https://api.ecosudar.com/api';
const TEST_EMAIL = 'kaushikwork2004@gmail.com';

async function testOTPFlow() {
  console.log('🧪 Testing OTP Flow\n');
  console.log('='.repeat(50));

  try {
    // Step 1: Send OTP
    console.log('\n📧 Step 1: Sending OTP to', TEST_EMAIL);
    const sendResponse = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
      email: TEST_EMAIL
    });
    
    console.log('✅ OTP Sent Successfully!');
    console.log('Response:', JSON.stringify(sendResponse.data, null, 2));
    
    // Step 2: Wait for user to enter OTP
    console.log('\n⏳ Step 2: Check your email for the OTP code');
    console.log('📝 Once you have the OTP, run this command:');
    console.log(`\nnode backend/verify-otp.js YOUR_OTP_CODE\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      console.log('\n⚠️  Rate Limited! You need to wait before requesting another OTP.');
      console.log('💡 Try again in 15-30 minutes.');
    }
  }
}

testOTPFlow();