# Auto-Logout When User is Rejected - Implementation Guide

## Problem Statement
When an admin changes a user's `approval_status` to rejected (or sets `is_active = FALSE`) in the MySQL database, the user should be automatically logged out from the mobile app.

---

## Solution Overview

We'll implement a **periodic status check** mechanism that:
1. Periodically calls `/api/auth/me` endpoint to check user status
2. Automatically logs out the user if their account is no longer active
3. Shows an appropriate message to the user

---

## Implementation Approach

### Option 1: Periodic Status Check (RECOMMENDED)
✅ **Best for mobile apps**
✅ **Works even when app is in background**
✅ **No server-side changes needed**

### Option 2: WebSocket/Push Notifications
❌ Complex to implement
❌ Requires additional infrastructure
❌ Overkill for this use case

We'll use **Option 1** - Periodic Status Check

---

## Backend Requirements

### 1. Ensure `/api/auth/me` Returns User Status

The `/api/auth/me` endpoint should return:
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "user_type": "customer",
    "is_active": true,           // ← IMPORTANT
    "approval_status": "approved" // ← IMPORTANT
  }
}
```

**If user is rejected/inactive, the PHP backend should return:**
```json
{
  "success": false,
  "error": "Account has been deactivated",
  "code": "ACCOUNT_INACTIVE"
}
```

### 2. PHP Backend Changes (if needed)

**File:** Your PHP AuthController (e.g., `AuthController.php`)

**Method:** `me()` or `getCurrentUser()`

```php
public function me(): void
{
    $userId = Request::getUserId(); // From JWT token
    
    try {
        $user = User::findById($userId);
        
        if (!$user) {
            Response::error('User not found', 404);
        }
        
        // CHECK IF USER IS ACTIVE
        if (!$user['is_active'] || $user['approval_status'] === 'rejected') {
            Response::error('Account has been deactivated', 403, [
                'code' => 'ACCOUNT_INACTIVE'
            ]);
        }
        
        // Return user data
        Response::success([
            'user_id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'user_type' => $user['user_type'],
            'is_active' => $user['is_active'],
            'approval_status' => $user['approval_status']
        ]);
    } catch (Exception $e) {
        Response::error('Failed to fetch user data', 500);
    }
}
```

---

## Frontend Implementation

### Step 1: Update AuthContext

Add a periodic status check function to `contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import api, { User as ApiUser, AuthResponse } from '../services/api';

// ... existing code ...

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  // ... existing useEffect for loading user ...

  // NEW: Periodic status check
  useEffect(() => {
    if (!user) return; // Only check if user is logged in

    const checkUserStatus = async () => {
      try {
        const response = await api.auth.me();
        
        if (!response.success) {
          // User account is inactive/rejected
          console.log('[Auth] User account deactivated, logging out...');
          await signOut();
          // Optionally show alert
          // Alert.alert('Account Deactivated', 'Your account has been deactivated by an administrator.');
        }
      } catch (error: any) {
        // If error code is ACCOUNT_INACTIVE, log out
        if (error.response?.data?.code === 'ACCOUNT_INACTIVE') {
          console.log('[Auth] User account inactive, logging out...');
          await signOut();
        }
      }
    };

    // Check immediately on mount
    checkUserStatus();

    // Then check every 5 minutes
    statusCheckInterval.current = setInterval(checkUserStatus, 5 * 60 * 1000);

    // Handle app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, check status immediately
        checkUserStatus();
      }
      appState.current = nextAppState;
    });

    // Cleanup
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      subscription.remove();
    };
  }, [user]);

  // ... rest of existing code ...
}
```

### Step 2: Update services/api.ts

Ensure the `me()` function is available:

```typescript
export const api = {
  auth: {
    // ... existing methods ...
    
    me: async (): Promise<ApiResponse<ApiUser>> => {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
  },
  // ... rest of API ...
};
```

---

## Configuration Options

### Check Interval
You can adjust how often to check user status:

```typescript
// Check every 5 minutes (recommended)
const CHECK_INTERVAL = 5 * 60 * 1000;

// Check every 2 minutes (more frequent)
const CHECK_INTERVAL = 2 * 60 * 1000;

// Check every 10 minutes (less frequent)
const CHECK_INTERVAL = 10 * 60 * 1000;
```

### When to Check
1. **On app launch** - Immediate check when user logs in
2. **Periodic intervals** - Every N minutes while app is running
3. **On app foreground** - When user returns to app from background
4. **On API errors** - If any API call returns 401/403

---

## User Experience

### Scenario 1: User is Active
- App checks status every 5 minutes
- User continues using app normally
- No interruption

### Scenario 2: Admin Rejects User
1. Admin changes `approval_status` to 'rejected' in database
2. Within 5 minutes, app checks `/api/auth/me`
3. Backend returns error: "Account has been deactivated"
4. App automatically logs out user
5. User is redirected to login screen
6. (Optional) Alert message: "Your account has been deactivated"

---

## Testing

### Test Case 1: Normal Operation
1. Login as active user
2. Wait 5 minutes
3. Verify app continues working
4. Check console logs for status checks

### Test Case 2: Account Rejection
1. Login as active user
2. Admin changes `is_active = FALSE` in database
3. Wait up to 5 minutes (or bring app to foreground)
4. Verify user is automatically logged out
5. Verify user sees login screen

### Test Case 3: App Foreground
1. Login as active user
2. Put app in background
3. Admin rejects user
4. Bring app to foreground
5. Verify immediate logout

---

## Alternative: Check on Every API Call

For more immediate logout, you can also check user status on every API call:

```typescript
// In services/api.ts
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 403 && 
        error.response?.data?.code === 'ACCOUNT_INACTIVE') {
      // User account deactivated, log out
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      // Redirect to login
      // navigation.navigate('auth');
    }
    return Promise.reject(error);
  }
);
```

---

## Security Considerations

1. ✅ **Token Validation**: Backend validates JWT on every `/auth/me` call
2. ✅ **Status Check**: Backend checks `is_active` and `approval_status`
3. ✅ **Automatic Cleanup**: Frontend clears all auth data on logout
4. ✅ **No Bypass**: User cannot bypass this check (server-side validation)

---

## Performance Impact

- **Network**: 1 API call every 5 minutes (~12 calls/hour)
- **Battery**: Minimal (background checks are lightweight)
- **Data Usage**: ~1KB per check (~12KB/hour)

**Impact:** Negligible for mobile apps

---

## Summary

### Backend Changes
1. ✅ Ensure `/api/auth/me` checks `is_active` and `approval_status`
2. ✅ Return error 403 with code `ACCOUNT_INACTIVE` if user is rejected

### Frontend Changes
1. ✅ Add periodic status check in AuthContext (every 5 minutes)
2. ✅ Check on app foreground
3. ✅ Auto-logout if account is inactive
4. ✅ (Optional) Show alert message to user

### Testing
1. ✅ Test normal operation
2. ✅ Test account rejection
3. ✅ Test app foreground/background

---

**Status:** Ready for implementation
**Estimated Time:** 30-45 minutes
**Risk Level:** Low (non-breaking change)