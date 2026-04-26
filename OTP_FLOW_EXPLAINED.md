# OTP Flow - Step by Step Explanation

## Step 1: User Clicks "Send OTP"

### What Happens:
```
Frontend → POST https://api.ecosudar.com/api/auth/send-otp
```

### Request Payload:
```json
{
  "email": "kaushikwork2004@gmail.com"
}
```

### Response (SUCCESS ✅):
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "identifier": "kaushikwork2004@gmail.com",
    "type": "email",
    "purpose": "email_verification",
    "expires_in": 600,
    "user_exists": true
  }
}
```

### Result:
✅ You receive an email with OTP code (e.g., `961402`)

---

## Step 2: User Enters OTP and Clicks "Verify"

### What Happens:
```
Frontend → POST https://api.ecosudar.com/api/auth/verify-otp
```

### Request Payload:
```json
{
  "identifier": "kaushikwork2004@gmail.com",
  "otp": "961402"
}
```

### Response (ERROR ❌):
```json
{
  "success": false,
  "message": "Invalid OTP code",
  "errors": {
    "attempts_remaining": 0
  }
}
```

---

## The Problem

### Why "Invalid OTP code" Error?

The API is returning "Invalid OTP code" with `attempts_remaining: 0` because:

1. **You tried to verify OTP 5 times before** with wrong codes
2. **The API blocked your email** after 5 failed attempts
3. **Now every verification attempt fails immediately** with 0 attempts remaining
4. **Even if you enter the CORRECT OTP**, it will still fail because you're blocked

### The Payload is Correct ✅

Your request payload is formatted correctly:
```json
{
  "identifier": "kaushikwork2004@gmail.com",  // ✅ Correct
  "otp": "961402"                              // ✅ Correct format
}
```

### The OTP Code is Valid ✅

The OTP you received in email is valid and correct.

### But You're Rate Limited 🚫

The API has a security feature:
- **5 attempts per email address**
- After 5 failed attempts → `attempts_remaining: 0`
- You're blocked from verifying ANY OTP (even correct ones)

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Send OTP                                        │
├─────────────────────────────────────────────────────────┤
│ User clicks "Send OTP"                                  │
│         ↓                                               │
│ POST /auth/send-otp                                     │
│ Body: { email: "kaushikwork2004@gmail.com" }           │
│         ↓                                               │
│ Response: { success: true, ... }                        │
│         ↓                                               │
│ ✅ Email arrives with OTP: 961402                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Step 2: Verify OTP                                      │
├─────────────────────────────────────────────────────────┤
│ User enters OTP: 961402                                 │
│ User clicks "Verify"                                    │
│         ↓                                               │
│ POST /auth/verify-otp                                   │
│ Body: {                                                 │
│   identifier: "kaushikwork2004@gmail.com",             │
│   otp: "961402"                                         │
│ }                                                       │
│         ↓                                               │
│ ❌ Response: {                                          │
│   success: false,                                       │
│   message: "Invalid OTP code",                          │
│   errors: { attempts_remaining: 0 }                     │
│ }                                                       │
│         ↓                                               │
│ 🚫 BLOCKED -                             │
└─────────────────────────────────────────────────────────┘
```

---

