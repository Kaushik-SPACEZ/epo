# Queries API Specification

## Overview
Simple query/contact form from Queries tab - just store name, email, and message.

---

## Database Schema

### Queries Table (Minimal)

```sql
CREATE TABLE queries (
    query_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    query_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'resolved', 'closed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);
```

**That's it! Just 8 columns:**
1. query_id
2. user_id (nullable - can be guest)
3. query_number
4. name
5. email
6. message
7. status
8. created_at

---

## API Endpoint

### **POST /api/queries**

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token> (optional - works for guests too)
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I would like to know more about biomass pellets pricing for bulk orders."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Query submitted successfully",
  "data": {
    "query_id": 1,
    "query_number": "QRY-2026-0001",
    "name": "John Doe",
    "email": "john@example.com",
    "message": "I would like to know more about biomass pellets pricing for bulk orders.",
    "status": "pending",
    "created_at": "2026-04-20T23:45:00Z"
  }
}
```

---

## That's It!

Simple contact form - just name, email, and message. Admin can read and respond.