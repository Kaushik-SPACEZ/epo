# User Role-Based Form - Verification Guide

## What Changed

### ✅ Removed
- Toggle boxes ("I am a" section with Customer/Dealer cards)
- Unused CSS styles for toggle boxes

### ✅ Updated
- Form now displays based on `user.user_type` from database
- No manual role switching allowed

## How to Verify Changes

### Step 1: Restart the App
The changes require a fresh app reload:

```bash
# Stop the current Metro bundler (Ctrl+C)
# Then restart:
npx expo start --clear
```

### Step 2: Test with Customer Account

**Expected Behavior:**
1. Login with a customer account
2. Navigate to "Your Details" screen
3. **You should see:**
   - ✅ "Customer Details" header
   - ✅ Customer form fields (Name, Email, Phone, Address, City, Pincode)
   - ❌ NO toggle boxes
   - ❌ NO "I am a" section

### Step 3: Test with Dealer Account

**To create a test dealer:**

```sql
-- Run this in MySQL
INSERT INTO users (
  name, email, phone, password_hash, user_type, 
  company_name, is_active, created_at
) VALUES (
  'Test Dealer',
  'dealer@test.com',
  '9876543210',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
  'dealer',
  'Test Company',
  TRUE,
  NOW()
);
```

**Expected Behavior:**
1. Login with dealer account (dealer@test.com / password)
2. Navigate to "Your Details" screen
3. **You should see:**
   - ✅ "Dealer Details" header
   - ✅ Dealer form fields (Business Name, Contact Person, Email, Phone, UDYAM, Address, City, Pincode, GST)
   - ❌ NO toggle boxes
   - ❌ NO "I am a" section

## Visual Comparison

### BEFORE (Old UI)
```
┌─────────────────────────────────────┐
│         Your Details                │
├─────────────────────────────────────┤
│ I am a                              │ ← THIS SECTION
│ ┌──────────┐  ┌──────────┐        │
│ │ Customer │  │  Dealer  │        │ ← REMOVED
│ └──────────┘  └──────────┘        │
│                                     │
│ Customer Details                    │
│ ┌─────────────────────────────────┐│
│ │ Name:    [____________]         ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### AFTER (New UI)
```
┌─────────────────────────────────────┐
│         Your Details                │
├─────────────────────────────────────┤
│ Customer Details                    │ ← Direct to form
│ ┌─────────────────────────────────┐│
│ │ Name:    [____________]         ││
│ │ Email:   [____________]         ││
│ │ Phone:   [____________]         ││
│ │ Address: [____________]         ││
│ │ City:    [____________]         ││
│ │ Pincode: [____________]         ││
│ └─────────────────────────────────┘│
│                                     │
│ [Edit this profile]                 │
│ [Continue to Summary]               │
└─────────────────────────────────────┘
```

## Troubleshooting

### Issue: Still seeing toggle boxes
**Solution:** 
1. Stop Metro bundler completely
2. Clear cache: `npx expo start --clear`
3. If using physical device, uninstall and reinstall app

### Issue: Wrong form showing
**Check:**
1. What is `user_type` in database for logged-in user?
   ```sql
   SELECT id, name, email, user_type FROM users WHERE email = 'your@email.com';
   ```
2. Verify AuthContext is loading user data correctly
3. Check browser console for any errors

### Issue: Form not saving
**Check:**
1. Backend API is running
2. User has valid authentication token
3. Check network tab for API errors

## Key Points

1. **Role is immutable** - Users cannot change their role (customer/dealer)
2. **Database-driven** - Form type determined by `user_type` column
3. **Admin control** - Only admin can create dealer accounts
4. **Backward compatible** - Existing customer data works without changes

## Next Steps

After verification:
1. ✅ Test customer flow end-to-end
2. ✅ Test dealer flow end-to-end
3. ✅ Verify data persistence
4. ✅ Update admin panel to support dealer creation (optional)

---

**Status:** Implementation complete, awaiting verification
**Last Updated:** April 26, 2026