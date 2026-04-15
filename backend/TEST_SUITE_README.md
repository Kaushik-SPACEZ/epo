# 🧪 API Test Suite - Complete Guide

## 📋 Overview

Comprehensive automated testing suite for all 23 API endpoints with positive, negative, and edge case scenarios.

---

## 🚀 Quick Start

### **Prerequisites:**
1. Backend server must be running
2. Node.js installed
3. Axios installed (`npm install axios`)

### **Run Tests:**

```bash
cd backend
node test-suite.js
```

---

## 📊 What Gets Tested

### **Total: 20 Test Scenarios**

#### **Authentication (8 tests):**
- ✅ Valid registration
- ✅ Duplicate email (409)
- ✅ Invalid email format (422)
- ✅ Weak password (422)
- ✅ Valid login
- ✅ Wrong password (401)
- ✅ Get user with token
- ✅ Get user without token (401)

#### **Products (3 tests):**
- ✅ Get all products
- ✅ Get single product
- ✅ Get product configurations

#### **Orders (4 tests):**
- ✅ Create order with valid data
- ✅ Create order with missing fields (422)
- ✅ Get all orders
- ✅ Get single order

#### **Users (3 tests):**
- ✅ Get user by ID
- ✅ Update user
- ✅ Get user orders

#### **Statistics (2 tests):**
- ✅ Get order statistics
- ✅ Get active orders

---

## 📈 Sample Output

```
╔═══════════════════════════════════════════════════════╗
║         API ENDPOINT COMPREHENSIVE TEST SUITE         ║
║                  EcoSudar Backend                     ║
╚═══════════════════════════════════════════════════════╝

🎯 Testing API: http://localhost:3000/api
📅 Started: 4/15/2026, 9:14:35 AM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTHENTICATION ENDPOINTS (8 tests)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ POST /auth/register - Valid registration: 201 - 245ms
✅ POST /auth/register - Duplicate email (409): 409 - 123ms
✅ POST /auth/register - Invalid email (422): 422 - 98ms
✅ POST /auth/register - Weak password (422): 422 - 87ms
✅ POST /auth/login - Valid login: 200 - 234ms
❌ POST /auth/login - Wrong password (401): Expected 401, got 500
✅ GET /auth/me - With valid token: 200 - 156ms
✅ GET /auth/me - Without token (401): 401 - 45ms

...

═══════════════════════════════════════════════════════
                  TEST SUMMARY                          
═══════════════════════════════════════════════════════

Total Tests: 20
✅ Passed: 18 (90%)
❌ Failed: 2 (10%)
⏭️  Skipped: 0
⏱️  Duration: 3.45s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FAILED TESTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ POST /auth/login - Wrong password (401)
   Error: Expected 401, got 500
   Details: {
     "success": false,
     "error": "Internal server error"
   }

📄 Report saved to: test-report.json
```

---

## 📁 Generated Files

### **1. test-report.json**
Complete test results in JSON format:

```json
{
  "total": 20,
  "passed": 18,
  "failed": 2,
  "skipped": 0,
  "tests": [
    {
      "name": "POST /auth/register - Valid registration",
      "status": "pass",
      "message": "201 - 245ms",
      "time": 245
    },
    ...
  ],
  "startTime": "2026-04-15T09:14:35.000Z",
  "endTime": "2026-04-15T09:14:38.450Z"
}
```

---

## 🔧 Configuration

### **Change API URL:**

```bash
# Test against different server
API_BASE_URL=https://api.ecosudar.com/api node test-suite.js
```

### **Modify Test Data:**

Edit `test-suite.js` and change the test data in each test function.

---

## 🐛 Troubleshooting

### **Error: "ECONNREFUSED"**
**Problem:** Backend server not running  
**Solution:** Start backend with `npm start`

### **Error: "Cannot find module 'axios'"**
**Problem:** Axios not installed  
**Solution:** Run `npm install axios`

### **All tests failing with 404**
**Problem:** Wrong API URL  
**Solution:** Check `BASE_URL` in test-suite.js

### **Tests timeout**
**Problem:** Backend too slow or not responding  
**Solution:** Check backend logs, increase timeout in axios config

---

## 📊 Understanding Results

### **Status Codes:**
- **200** - Success
- **201** - Created
- **401** - Unauthorized (missing/invalid token)
- **404** - Not Found
- **409** - Conflict (duplicate data)
- **422** - Validation Error
- **500** - Server Error

### **Common Failures:**

#### **Expected 401, got 500**
**Cause:** Backend error handling issue  
**Fix:** Check backend error handling for authentication

#### **Expected 422, got 200**
**Cause:** Missing validation  
**Fix:** Add validation in backend

#### **Network Error**
**Cause:** Backend not running or wrong URL  
**Fix:** Start backend or update BASE_URL

---

## 🎯 Next Steps

### **If Tests Pass:**
✅ Your backend is working correctly!  
✅ All endpoints are properly implemented  
✅ Ready for production  

### **If Tests Fail:**
1. Check the failed test details
2. Review backend logs
3. Fix the issue in backend
4. Re-run tests
5. Repeat until all pass

---

## 📝 Adding More Tests

To add more test scenarios, edit `test-suite.js`:

```javascript
// Add to appropriate section
await runTest('POST /auth/login - Empty password (422)', async () => {
  return await testEndpoint('POST', '/auth/login', {
    phone: '9876543210',
    password: '',
  }, 422);
});
```

---

## 🔄 Continuous Integration

### **Run in CI/CD:**

```yaml
# .github/workflows/test.yml
name: API Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start Backend
        run: cd backend && npm start &
      - name: Run Tests
        run: cd backend && node test-suite.js
      - name: Upload Report
        uses: actions/upload-artifact@v2
        with:
          name: test-report
          path: backend/test-report.json
```

---

## 📞 Support

If you encounter issues:
1. Check backend logs
2. Review test-report.json
3. Verify all endpoints are implemented
4. Check database connection
5. Ensure all dependencies are installed

---

**Happy Testing! 🚀**