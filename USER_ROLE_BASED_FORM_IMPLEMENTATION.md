# User Role-Based Form Implementation Plan

## Overview
Remove customer/dealer toggle boxes from user details screen and show forms based on `user_type` from database.

---

## Current System Analysis

### Database Structure
- **Table**: `users`
- **Role Column**: `user_type ENUM('customer', 'dealer')`
- **Default**: All signups → `customer`
- **Dealer Creation**: Admin adds directly to MySQL with `user_type='dealer'`

### Current Issues
1. ❌ User details screen shows toggle boxes for Customer/Dealer selection
2. ❌ Users can switch between customer/dealer forms manually
3. ❌ Form type not determined by database `user_type`

---

## Implementation Plan

### 1. Remove Toggle Boxes Section

**File**: `app/(tabs)/user-details.tsx`

**Lines to Remove**: 591-617

```typescript
// REMOVE THIS ENTIRE SECTION:
{/* ── User type cards ────────────────────────────────────────────── */}
<Text style={styles.sectionLabel}>I am a</Text>
<View style={styles.typeRow}>
  {(['customer', 'dealer'] as UserType[]).map(t => {
    const active = displayType === t;
    return (
      <Pressable
        key={t}
        style={[styles.typeCard, active && styles.typeCardActive]}
        onPress={() => {
          if (isEditing) {
            setUserType(t);
          } else {
            // In view mode: switch the active set's userType directly
            setSets(prev => prev.map((s, i) => i === activeIdx ? { ...s, userType: t } : s));
          }
        }}
      >
        <MaterialIcons name={t === 'customer' ? 'person' : 'business'} size={32} color={active ? Colors.primary : Colors.textMedium} />
        <Text style={[styles.typeTitle, active && styles.typeTitleActive]}>
          {t === 'customer' ? 'Customer' : 'Dealer'}
        </Text>
        <Text style={styles.typeSub}>{t === 'customer' ? 'For personal use' : 'For business'}</Text>
      </Pressable>
    );
  })}
</View>
```

### 2. Update State Management

**Remove State Variable** (Line 252):
```typescript
// REMOVE:
const [userType, setUserType] = useState<UserType>('customer');
```

**Use `user.user_type` from AuthContext instead**:
```typescript
// The user object from AuthContext already has user_type
const { user } = useAuth();
// user.user_type will be 'customer' or 'dealer' from database
```

### 3. Update Form Display Logic

**Current Logic** (Line 579):
```typescript
const displayType = isEditing ? userType : activeSet.userType;
```

**New Logic**:
```typescript
// Use user_type from database (via AuthContext)
const displayType = user?.user_type || 'customer';
```

### 4. Update Initial Set Creation

**Current** (Lines 238-240):
```typescript
const initialSet: DetailSet = { id: '0', userType: 'customer', c: initC, d: initD };
```

**New**:
```typescript
const initialSet: DetailSet = { 
  id: '0', 
  userType: user?.user_type || 'customer', // Use database value
  c: initC, 
  d: initD 
};
```

### 5. Update Data Fetch Logic

**Current** (Lines 290-295):
```typescript
setSets([{
  id: '0',
  userType: userData.user_type || 'customer',
  c: updatedC,
  d: updatedD,
}]);
```

**Keep this** - it's already correct! ✅

### 6. Remove Toggle Functionality in Edit Mode

**Remove from handleAddNew** (Line 334):
```typescript
// REMOVE:
setUserType(sets[activeIdx].userType);
```

**Remove from handleEditSet** (Line 323):
```typescript
// REMOVE:
setUserType(set.userType);
```

### 7. Update Form Rendering

**Current** (Lines 690-712):
```typescript
{isEditing && userType === 'customer' && (
  // Customer form fields
)}
{isEditing && userType === 'dealer' && (
  // Dealer form fields
)}
```

**New**:
```typescript
{isEditing && displayType === 'customer' && (
  // Customer form fields
)}
{isEditing && displayType === 'dealer' && (
  // Dealer form fields
)}
```

---

## User Flows

### Customer Flow
1. User signs up → `user_type='customer'` (database default)
2. Admin approves account
3. User logs in
4. Opens "Your Details" screen
5. **Sees**: "Customer Details" form directly (no toggle boxes)
6. Fills: Name, Email, Phone, Address, City, Pincode
7. Saves and continues

### Dealer Flow
1. **Admin adds dealer via Admin Panel** (see Admin Panel section below)
2. Dealer logs in with provided email
3. Opens "Your Details" screen
4. **Sees**: "Dealer Details" form directly (no toggle boxes)
5. Fills: Business Name, Contact Person, Email, Phone, UDYAM, Address, City, Pincode, GST
6. Saves and continues

---

## Admin Panel - Adding Dealers

### Current Admin System
Your admin panel is built with PHP and uses the following structure:
- **File**: `admin.php` (main router)
- **Controller**: `AdminUserController.php`
- **Endpoint**: `POST /admin/users`

### How Admin Adds a Dealer

#### Option 1: Via Admin Panel UI (Recommended)
The admin panel should have a "Add User" form with these fields:

**Required Fields:**
- Name
- Email
- Phone
- Password
- **User Type** (dropdown: Customer / Dealer) ← **Important!**

**Dealer-Specific Fields** (shown when User Type = Dealer):
- Company Name
- GST Number
- UDYAM Number
- Address
- City
- State
- Pincode

**API Call:**
```javascript
POST /admin/users
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "name": "Dealer Name",
  "email": "dealer@example.com",
  "phone": "9876543210",
  "password": "SecurePassword123",
  "user_type": "dealer",           // ← KEY FIELD
  "company_name": "ABC Industries",
  "gst_number": "29ABCDE1234F1Z5",
  "udyam_number": "UDYAM-TN-12-1234567",
  "address": "123 Business Street",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "pincode": "600001"
}
```

#### Option 2: Direct MySQL Insert (Alternative)
If admin panel UI is not ready, admin can add dealers directly via MySQL:

```sql
INSERT INTO users (
  name, 
  email, 
  phone, 
  password_hash, 
  user_type,           -- Set to 'dealer'
  company_name, 
  gst_number, 
  udyam_number,
  address,
  city,
  state,
  pincode,
  is_active,           -- Set to TRUE (dealer is auto-approved)
  created_at
) VALUES (
  'Dealer Name',
  'dealer@example.com',
  '9876543210',
  '$2y$10$hashed_password_here',  -- Use password_hash() in PHP
  'dealer',                         -- ← IMPORTANT
  'ABC Industries',
  '29ABCDE1234F1Z5',
  'UDYAM-TN-12-1234567',
  '123 Business Street',
  'Chennai',
  'Tamil Nadu',
  '600001',
  TRUE,                             -- Auto-approved
  NOW()
);
```

### AdminUserController.php Changes

**File**: `controllers/admin/AdminUserController.php`

The `store()` method should handle dealer creation:

```php
public function store(): void
{
    $data = Request::getBody();
    
    // Validate required fields
    $required = ['name', 'email', 'phone', 'password'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            Response::error("Field '$field' is required", 400);
        }
    }
    
    // Validate user_type
    $userType = $data['user_type'] ?? 'customer';
    if (!in_array($userType, ['customer', 'dealer'], true)) {
        Response::error("Invalid user_type. Must be 'customer' or 'dealer'", 400);
    }
    
    // Hash password
    $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);
    
    // Prepare user data
    $userData = [
        'name' => $data['name'],
        'email' => $data['email'],
        'phone' => $data['phone'],
        'password_hash' => $passwordHash,
        'user_type' => $userType,  // ← KEY FIELD
        'is_active' => true,       // Auto-approve dealers
    ];
    
    // Add dealer-specific fields if user_type is 'dealer'
    if ($userType === 'dealer') {
        $userData['company_name'] = $data['company_name'] ?? null;
        $userData['gst_number'] = $data['gst_number'] ?? null;
        $userData['udyam_number'] = $data['udyam_number'] ?? null;
        $userData['address'] = $data['address'] ?? null;
        $userData['city'] = $data['city'] ?? null;
        $userData['state'] = $data['state'] ?? null;
        $userData['pincode'] = $data['pincode'] ?? null;
    }
    
    try {
        $userId = User::create($userData);
        Response::success([
            'message' => ucfirst($userType) . ' created successfully',
            'user_id' => $userId,
            'user_type' => $userType
        ], 201);
    } catch (Exception $e) {
        Response::error('Failed to create user: ' . $e->getMessage(), 500);
    }
}
```

### Admin Panel UI Recommendations

**Add User Form** should include:

```html
<form id="addUserForm">
  <!-- Basic Fields -->
  <input type="text" name="name" placeholder="Full Name" required>
  <input type="email" name="email" placeholder="Email" required>
  <input type="tel" name="phone" placeholder="Phone" required>
  <input type="password" name="password" placeholder="Password" required>
  
  <!-- User Type Selection -->
  <select name="user_type" id="userType" required>
    <option value="customer">Customer</option>
    <option value="dealer">Dealer</option>
  </select>
  
  <!-- Dealer-Specific Fields (hidden by default) -->
  <div id="dealerFields" style="display: none;">
    <input type="text" name="company_name" placeholder="Company Name">
    <input type="text" name="gst_number" placeholder="GST Number">
    <input type="text" name="udyam_number" placeholder="UDYAM Number">
    <textarea name="address" placeholder="Address"></textarea>
    <input type="text" name="city" placeholder="City">
    <input type="text" name="state" placeholder="State">
    <input type="text" name="pincode" placeholder="Pincode">
  </div>
  
  <button type="submit">Create User</button>
</form>

<script>
// Show/hide dealer fields based on user type
document.getElementById('userType').addEventListener('change', function() {
  const dealerFields = document.getElementById('dealerFields');
  dealerFields.style.display = this.value === 'dealer' ? 'block' : 'none';
});
</script>
```

### Key Points for Admin

1. ✅ **User Type Field**: Must be set to `'dealer'` when creating dealer accounts
2. ✅ **Auto-Approval**: Dealers are automatically approved (`is_active = TRUE`)
3. ✅ **No Signup**: Dealers don't sign up through the app - admin creates them
4. ✅ **Dealer Fields**: Company name, GST, UDYAM are dealer-specific
5. ✅ **Password**: Admin sets initial password, dealer can change it later

---

## Visual Changes

### Before (Current UI)
```
┌─────────────────────────────────────┐
│         Your Details                │
├─────────────────────────────────────┤
│ I am a                              │
│ ┌──────────┐  ┌──────────┐        │
│ │ Customer │  │  Dealer  │        │ ← REMOVE
│ └──────────┘  └──────────┘        │
│                                     │
│ Customer Details                    │
│ ┌─────────────────────────────────┐│
│ │ Name:    [____________]         ││
│ │ Email:   [____________]         ││
│ │ ...                             ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### After (New UI)
```
┌─────────────────────────────────────┐
│         Your Details                │
├─────────────────────────────────────┤
│ Customer Details                    │ ← Shows based on user_type
│ ┌─────────────────────────────────┐│
│ │ Name:    [____________]         ││
│ │ Email:   [____________]         ││
│ │ ...                             ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## Files to Modify

### 1. Frontend - `app/(tabs)/user-details.tsx`
- ✅ Remove lines 591-617 (toggle boxes)
- ✅ Remove `userType` state variable (line 252)
- ✅ Update `displayType` logic (line 579)
- ✅ Update initial set creation (line 240)
- ✅ Remove toggle functionality in edit handlers
- ✅ Update form rendering conditions

### 2. Backend - No Changes Required
- ✅ `contexts/AuthContext.tsx` - Already has `user_type` ✅
- ✅ `backend/routes/auth.js` - Already correct ✅
- ✅ `services/api.ts` - Already has `user_type` ✅
- ✅ Database schema - Already has `user_type` column ✅

### 3. Admin Panel (PHP) - Optional Enhancement
**File**: `controllers/admin/AdminUserController.php`

**Current Status**: The `POST /admin/users` endpoint likely exists but may need to ensure:
- ✅ Accepts `user_type` field in request body
- ✅ Validates `user_type` is either 'customer' or 'dealer'
- ✅ Stores dealer-specific fields (company_name, gst_number, udyam_number)
- ✅ Sets `is_active = TRUE` for dealers (auto-approved)

**If the endpoint doesn't handle `user_type` properly**, update the `store()` method as shown in the "Admin Panel - Adding Dealers" section above.

---

## Testing Checklist

### Customer Testing
- [ ] Sign up as new customer
- [ ] Wait for admin approval
- [ ] Log in
- [ ] Navigate to "Your Details"
- [ ] Verify: No toggle boxes shown
- [ ] Verify: "Customer Details" header shown
- [ ] Verify: Only customer form fields shown
- [ ] Fill and save customer details
- [ ] Verify: Data saved correctly

### Dealer Testing
- [ ] Admin adds dealer to database
- [ ] Log in with dealer email
- [ ] Navigate to "Your Details"
- [ ] Verify: No toggle boxes shown
- [ ] Verify: "Dealer Details" header shown
- [ ] Verify: Only dealer form fields shown
- [ ] Fill and save dealer details
- [ ] Verify: Data saved correctly

---

## Code Changes Summary

### Removed
- ❌ "I am a" section label
- ❌ Customer/Dealer toggle boxes (2 cards)
- ❌ `userType` state variable
- ❌ Toggle functionality in view/edit modes

### Modified
- 🔄 `displayType` logic → uses `user.user_type` from database
- 🔄 Initial set creation → uses `user.user_type`
- 🔄 Form rendering → based on database role

### Kept
- ✅ Page header: "Your Details"
- ✅ Form card header: "Customer Details" / "Dealer Details"
- ✅ All form fields and validation
- ✅ Save/Edit functionality
- ✅ Data fetching from API

---

## Benefits

1. ✅ **Simplified UX**: Users see only relevant form
2. ✅ **Database-driven**: Role determined by `user_type` column
3. ✅ **No confusion**: No manual role selection
4. ✅ **Admin control**: Only admin can create dealers
5. ✅ **Cleaner code**: Less state management
6. ✅ **Better security**: Role can't be changed by user

---

## Implementation Steps

### Phase 1: Documentation & Planning ✅
1. **Create this documentation** ✅
2. **Review admin panel capabilities**

### Phase 2: Frontend Changes (Act Mode Required)
3. **Toggle to Act Mode**
4. **Modify user-details.tsx**
   - Remove toggle boxes
   - Update state management
   - Fix form display logic
5. **Test customer flow**
6. **Test dealer flow**

### Phase 3: Admin Panel (Optional)
7. **Verify AdminUserController.php** handles `user_type` field
8. **Update admin UI** to include user type selection
9. **Test dealer creation** via admin panel

### Phase 4: Verification
10. **Create test dealer** via admin panel
11. **Login as dealer** and verify form display
12. **Verify data persistence**
13. **Mark task complete**

---

## Notes

- No database migrations needed
- No backend API changes needed
- Only frontend UI changes required
- Backward compatible with existing data
- Admin can add dealers anytime via MySQL

---

**Status**: Ready for implementation
**Estimated Time**: 15-20 minutes
**Risk Level**: Low (UI-only changes)