/**
 * Check Rate Limit Headers
 * This script checks if the API returns rate limit information in headers
 */

const axios = require('axios');

const API_BASE_URL = 'https://api.ecosudar.com/api';
const TEST_EMAIL = 'kaushikwork2004@gmail.com';

async function checkRateLimit() {
  console.log('🔍 Checking Rate Limit Status\n');
  console.log('='.repeat(50));

  try {
    console.log('\n📧 Testing with email:', TEST_EMAIL);
    console.log('⏳ Sending request...\n');

    const response = await axios.post(
      `${API_BASE_URL}/auth/verify-otp`,
      {
        identifier: TEST_EMAIL,
        otp: '000000' // Intentionally wrong OTP
      },
      {
        validateStatus: () => true // Don't throw on error status
      }
    );
    
    console.log('📊 Response Status:', response.status);
    console.log('\n📋 Response Headers:');
    console.log('='.repeat(50));
    
    // Check for common rate limit headers
    const rateLimitHeaders = {
      'x-ratelimit-limit': response.headers['x-ratelimit-limit'],
      'x-ratelimit-remaining': response.headers['x-ratelimit-remaining'],
      'x-ratelimit-reset': response.headers['x-ratelimit-reset'],
      'retry-after': response.headers['retry-after'],
      'x-rate-limit-limit': response.headers['x-rate-limit-limit'],
      'x-rate-limit-remaining': response.headers['x-rate-limit-remaining'],
      'x-rate-limit-reset': response.headers['x-rate-limit-reset'],
    };
    
    let foundRateLimitInfo = false;
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      if (value !== undefined) {
        console.log(`${key}: ${value}`);
        foundRateLimitInfo = true;
      }
    }
    
    if (!foundRateLimitInfo) {
      console.log('❌ No rate limit headers found');
      console.log('\n💡 The API does not expose rate limit information in headers.');
    }
    
    console.log('\n📄 Response Body:');
    console.log('='.repeat(50));
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.errors?.attempts_remaining !== undefined) {
      const remaining = response.data.errors.attempts_remaining;
      console.log('\n⚠️  Attempts Remaining:', remaining);
      
      if (remaining === 0) {
        console.log('\n🚫 RATE LIMITED!');
        console.log('💡 You need to wait for the rate limit to reset.');
        console.log('⏰ Typical reset time: 15-30 minutes');
        console.log('\n📝 What to do:');
        console.log('   1. Wait 30-60 minutes');
        console.log('   2. Try with a different email address');
        console.log('   3. Contact api.ecosudar.com administrator');
      } else {
        console.log(`\n✅ You have ${remaining} attempt(s) remaining!`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

checkRateLimit();