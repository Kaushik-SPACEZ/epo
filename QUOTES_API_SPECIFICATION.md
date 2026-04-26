now lets do# Quotes API Specification

## Overview
Simple quote request from Savings Calculator - just store the formatted message with user details.

---

## Database Schema

### Quotes Table (Minimal)

```sql
CREATE TABLE quotes (
    quote_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    message TEXT NOT NULL COMMENT 'Pre-formatted calculation summary',
    status ENUM('pending', 'sent', 'closed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);
```

**That's it! Just 9 columns:**
1. quote_id
2. user_id
3. quote_number
4. name
5. email
6. phone
7. message (the formatted calculation text)
8. status
9. created_at

---

## API Endpoint

### **POST /api/quotes**

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "phone": "9876543210",
  "message": "Customer uses 100 kg of LPG at ₹85/kg (₹8,500/month). They need 283 kg/month of Biomass Pellets (≈ ₹3,967/month), saving ₹4,533/month."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quote request submitted successfully",
  "data": {
    "quote_id": 1,
    "quote_number": "QT-2026-0001",
    "name": "Jane Smith",
    "email": "jane@company.com",
    "phone": "9876543210",
    "message": "Customer uses 100 kg of LPG at ₹85/kg (₹8,500/month). They need 283 kg/month of Biomass Pellets (≈ ₹3,967/month), saving ₹4,533/month.",
    "status": "pending",
    "created_at": "2026-04-20T23:45:00Z"
  }
}
```

---

## Message Template

```
"Customer uses {consumption} {unit} of {fuel_type} at ₹{price}/{unit} (₹{monthly_cost}/month). They need {pellet_qty} kg/month of Biomass Pellets (≈ ₹{pellet_cost}/month), saving ₹{savings}/month."
```

**Example:**
```
"Customer uses 100 kg of LPG at ₹85/kg (₹8,500/month). They need 283 kg/month of Biomass Pellets (≈ ₹3,967/month), saving ₹4,533/month."
```

## That's It!

Simple and clean - just store the formatted message with user details. Admin can read the message and respond.