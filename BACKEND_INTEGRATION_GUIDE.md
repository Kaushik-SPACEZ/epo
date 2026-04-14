# 🔗 Backend API Integration Guide

## ✅ Integration Complete!

Your React Native app is now fully integrated with the backend API!

---

## 📊 What Was Integrated:

### **1. API Service Layer** (`services/api.ts`)
✅ Complete API client with axios  
✅ Automatic token management  
✅ Request/response interceptors  
✅ Error handling  
✅ All 23 endpoints wrapped  

### **2. Authentication** (`contexts/AuthContext.tsx`)
✅ Real API calls for login  
✅ Real API calls for registration  
✅ Real API calls for logout  
✅ JWT token storage  
✅ Automatic token injection  

### **3. Orders** (`contexts/OrderContext.tsx`)
✅ Real API calls to create orders  
✅ Real API calls to fetch orders  
✅ Proper error handling  
✅ Loading states  

### **4. Configuration**
✅ `.env` file with API URL  
✅ Axios dependency installed  
✅ Environment variables configured  

---

## 🎯 How It Works Now:

### **Before (Mock Data):**
```
User clicks button
      ↓
Fake setTimeout delay
      ↓
Local state update
      ↓
Data stored in AsyncStorage only
```

### **After (Real API):**
```
User clicks button
      ↓
API call to backend (http://localhost:3000/api)
      ↓
Backend proxies to Hostinger (https://api.ecosudar.com/api)
      ↓
Real database operation
      ↓
Response with real data
      ↓
Update local state + AsyncStorage
```

---

## 📝 API Endpoints Being Used:

### **Authentication:**
- ✅ `POST /api/auth/register` - User registration
- ✅ `POST /api/auth/login` - User login (phone or email)
- ✅ `POST /api/auth/logout` - User logout
- ✅ `GET /api/auth/me` - Get current user (ready to use)

### **Orders:**
- ✅ `POST /api/orders` - Create new order
- ✅ `GET /api/orders` - Fetch user orders
- ✅ `GET /api/orders/:id` - Get single order (ready to use)

### **Products (Ready to integrate):**
- ⏳ `GET /api/products` - Fetch all products
- ⏳ `GET /api/products/:id` - Get single product
- ⏳ `GET /api/products/:id/configurations` - Get configurations

### **Users (Ready to integrate):**
- ⏳ `GET /api/users/:id` - Get user profile
- ⏳ `PUT /api/users/:id` - Update user profile
- ⏳ `PUT /api/users/:id/password` - Change password

---

## 🔧 Configuration:

### **Frontend (.env):**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=development
```

### **Backend (backend/.env):**
```env
PORT=3000
API_BASE_URL=https://api.ecosudar.com/api
ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.100:8081
```

---

## 🚀 Testing the Integration:

### **Step 1: Start Backend Server**
```bash
cd backend
npm start
```

**Expected Output:**
```
🚀 EcoSudar API Proxy Server is running
📍 Port: 3000
🎯 Proxying to: https://api.ecosudar.com/api
```

### **Step 2: Start React Native App**
```bash
# In project root
npx expo start
```

### **Step 3: Test Registration**
1. Open app on device/emulator
2. Go to registration screen
3. Fill in details
4. Click "Register"
5. **Watch console logs:**
   ```
   [API Request] POST /auth/register
   [API Response] 201 /auth/register
   ```

### **Step 4: Test Login**
1. Go to login screen
2. Enter phone/email and password
3. Click "Login"
4. **Watch console logs:**
   ```
   [API Request] POST /auth/login
   [API Response] 200 /auth/login
   ```

### **Step 5: Test Order Creation**
1. Select a product
2. Fill in customer details
3. Review order summary
4. Click "Confirm Order"
5. **Watch console logs:**
   ```
   [API Request] POST /orders
   [API Response] 201 /orders
   ```

---

## 📱 What Happens When You Click Buttons:

### **Login Button:**
```typescript
// Before: Mock data
await new Promise(r => setTimeout(r, 1000));
const fakeUser = { id: 'user_123', name: 'Test' };

// After: Real API
const response = await api.auth.login({ phone, password });
const realUser = response.data.user;
const token = response.data.token; // Stored automatically
```

### **Register Button:**
```typescript
// Before: Mock data
await new Promise(r => setTimeout(r, 1200));
const fakeUser = { id: 'user_' + Date.now(), name, email };

// After: Real API
const response = await api.auth.register({ name, email, phone, password, user_type });
const realUser = response.data.user;
const token = response.data.token; // Stored automatically
```

### **Confirm Order Button:**
```typescript
// Before: Mock data
const fakeOrderId = 'ES-' + Math.random().toString(36);
setOrders([fakeOrder, ...orders]);

// After: Real API
const response = await api.orders.create(orderData);
const realOrder = response.data;
const realOrderNumber = realOrder.order_number; // From database
```

---

## 🔍 Debugging:

### **Check API Calls:**
Open React Native debugger console and look for:
```
[API Request] POST /auth/login
[API Response] 200 /auth/login
```

### **Check Backend Logs:**
In the terminal where backend is running:
```
POST /api/auth/login 200 318.917 ms
[API Request] POST /auth/login
[API Response] 200 /auth/login
```

### **Check Stored Tokens:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if token exists
const token = await AsyncStorage.getItem('auth_token');
console.log('Token:', token);
```

---

## ⚠️ Important Notes:

### **1. Backend Must Be Running:**
The Node.js proxy server must be running on port 3000 for the app to work.

### **2. Network Configuration:**
- **iOS Simulator:** Use `http://localhost:3000/api`
- **Android Emulator:** Use `http://10.0.2.2:3000/api`
- **Physical Device:** Use your computer's IP (e.g., `http://192.168.1.100:3000/api`)

Update `.env` accordingly:
```env
# For physical device
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
```

### **3. Hostinger Backend:**
Currently, the Node.js proxy tries to connect to Hostinger API. If Hostinger backend is not ready, you'll see connection errors (which is expected).

### **4. Token Expiration:**
Tokens expire after 7 days. The app will automatically clear tokens on 401 errors.

---

## 📚 Files Modified:

### **Created:**
1. `services/api.ts` - Complete API client
2. `.env` - Environment configuration
3. `BACKEND_INTEGRATION_GUIDE.md` - This file

### **Updated:**
1. `contexts/AuthContext.tsx` - Real API integration
2. `contexts/OrderContext.tsx` - Real API integration
3. `app/(tabs)/order-summary.tsx` - Fixed async handling
4. `package.json` - Added axios dependency

---

## 🎉 Success Indicators:

### **✅ Integration is working if:**
1. You see `[API Request]` and `[API Response]` in console
2. Backend server shows incoming requests
3. Login/Register returns real user data
4. Orders are created with real order numbers
5. Tokens are stored in AsyncStorage

### **❌ Integration has issues if:**
1. No console logs appear
2. Errors about "Network Error" or "ECONNREFUSED"
3. Backend server is not running
4. Wrong API URL in `.env`

---

## 🔄 Next Steps:

### **Optional Enhancements:**

1. **Fetch Products from API:**
   - Update `constants/products.ts` to fetch from API
   - Use `api.products.getAll()`

2. **Add Forgot Password:**
   - Create forgot password screen
   - Use `api.auth.forgotPassword()`
   - Use `api.auth.verifyOtp()`
   - Use `api.auth.resetPassword()`

3. **Add Profile Management:**
   - Create profile edit screen
   - Use `api.users.update()`
   - Use `api.users.updatePassword()`

4. **Add Order History:**
   - Fetch orders on app start
   - Use `api.orders.getAll()`
   - Display in orders screen

---

## 📞 Support:

If you encounter issues:
1. Check backend server is running
2. Check `.env` file has correct API URL
3. Check console logs for errors
4. Verify network connectivity
5. Check Hostinger backend status

---

**Last Updated:** April 14, 2026  
**Integration Status:** ✅ Complete  
**Ready for Testing:** YES!