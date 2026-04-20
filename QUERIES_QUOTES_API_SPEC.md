# Queries & Quotes API Specification

## Overview
This document specifies the API endpoints and database schema for handling customer queries and quote requests in the Eco Sudar application.

---

## Database Schema

### 1. Queries Table

```sql
CREATE TABLE queries (
    query_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    query_type ENUM('general', 'product', 'order', 'technical', 'other') DEFAULT 'general',
    status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    assigned_to INT,
    response TEXT,
    responded_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

**Column Details:**
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| query_id | INT | NO | Primary key, auto-increment |
| user_id | INT | YES | Foreign key to users table (null for guest queries) |
| name | VARCHAR(100) | NO | Customer's full name |
| email | VARCHAR(100) | NO | Customer's email address |
| phone | VARCHAR(15) | NO | Customer's phone number |
| subject | VARCHAR(200) | NO | Query subject/title |
| message | TEXT | NO | Detailed query message |
| query_type | ENUM | NO | Type of query (general/product/order/technical/other) |
| status | ENUM | NO | Current status (pending/in_progress/resolved/closed) |
| priority | ENUM | NO | Priority level (low/medium/high/urgent) |
| assigned_to | INT | YES | User ID of admin/staff assigned to handle query |
| response | TEXT | YES | Admin's response to the query |
| responded_at | DATETIME | YES | Timestamp when response was provided |
| created_at | DATETIME | NO | Timestamp when query was created |
| updated_at | DATETIME | NO | Timestamp when query was last updated |

---

### 2. Quotes Table

```sql
CREATE TABLE quotes (
    quote_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    company_name VARCHAR(200),
    business_type ENUM('customer', 'dealer', 'distributor', 'other') DEFAULT 'customer',
    product_type VARCHAR(100),
    quantity INT NOT NULL,
    size VARCHAR(50),
    purpose VARCHAR(100),
    delivery_address TEXT NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    delivery_state VARCHAR(100) NOT NULL,
    delivery_pincode VARCHAR(10) NOT NULL,
    additional_requirements TEXT,
    estimated_amount DECIMAL(10, 2),
    quote_status ENUM('pending', 'processing', 'sent', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
    valid_until DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_quote_number (quote_number),
    INDEX idx_status (quote_status),
    INDEX idx_created_at (created_at)
);
```

**Column Details:**
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| quote_id | INT | NO | Primary key, auto-increment |
| user_id | INT | YES | Foreign key to users table (null for guest quotes) |
| quote_number | VARCHAR(50) | NO | Unique quote reference number (e.g., QT-2024-0001) |
| name | VARCHAR(100) | NO | Customer's full name |
| email | VARCHAR(100) | NO | Customer's email address |
| phone | VARCHAR(15) | NO | Customer's phone number |
| company_name | VARCHAR(200) | YES | Company/business name (for dealers) |
| business_type | ENUM | NO | Type of business (customer/dealer/distributor/other) |
| product_type | VARCHAR(100) | YES | Type of product interested in |
| quantity | INT | NO | Requested quantity |
| size | VARCHAR(50) | YES | Product size (e.g., 6mm, 8mm, 10mm) |
| purpose | VARCHAR(100) | YES | Intended purpose/use case |
| delivery_address | TEXT | NO | Full delivery address |
| delivery_city | VARCHAR(100) | NO | Delivery city |
| delivery_state | VARCHAR(100) | NO | Delivery state |
| delivery_pincode | VARCHAR(10) | NO | Delivery pincode |
| additional_requirements | TEXT | YES | Any special requirements or notes |
| estimated_amount | DECIMAL(10,2) | YES | Estimated quote amount |
| quote_status | ENUM | NO | Current status of quote |
| valid_until | DATE | YES | Quote validity date |
| notes | TEXT | YES | Internal notes (admin use) |
| created_at | DATETIME | NO | Timestamp when quote was created |
| updated_at | DATETIME | NO | Timestamp when quote was last updated |

---

## API Endpoints

### 1. Queries Endpoints

#### **POST /api/queries**
Create a new query

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token> (optional - for logged-in users)
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "subject": "Product Inquiry",
  "message": "I would like to know more about biomass pellets pricing for bulk orders.",
  "query_type": "product"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Query submitted successfully",
  "data": {
    "query_id": 1,
    "query_number": "QRY-2024-0001",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "subject": "Product Inquiry",
    "message": "I would like to know more about biomass pellets pricing for bulk orders.",
    "query_type": "product",
    "status": "pending",
    "priority": "medium",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

#### **GET /api/queries**
Get all queries (with pagination and filters)

**Request Headers:**
```
Authorization: Bearer <token> (required)
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10) |
| status | string | No | Filter by status (pending/in_progress/resolved/closed) |
| query_type | string | No | Filter by type (general/product/order/technical/other) |
| priority | string | No | Filter by priority (low/medium/high/urgent) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "query_id": 1,
      "user_id": 5,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "subject": "Product Inquiry",
      "message": "I would like to know more about biomass pellets...",
      "query_type": "product",
      "status": "pending",
      "priority": "medium",
      "response": null,
      "responded_at": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

#### **GET /api/queries/:id**
Get a specific query by ID

**Request Headers:**
```
Authorization: Bearer <token> (required)
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "query_id": 1,
    "user_id": 5,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "subject": "Product Inquiry",
    "message": "I would like to know more about biomass pellets pricing for bulk orders.",
    "query_type": "product",
    "status": "resolved",
    "priority": "medium",
    "response": "Thank you for your inquiry. Our bulk pricing starts at...",
    "responded_at": "2024-01-15T14:30:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
  }
}
```

---

#### **PUT /api/queries/:id**
Update query status or add response (Admin only)

**Request Headers:**
```
Authorization: Bearer <token> (required - admin)
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "resolved",
  "priority": "high",
  "response": "Thank you for your inquiry. Our bulk pricing starts at ₹12/kg for orders above 1000kg.",
  "assigned_to": 3
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Query updated successfully",
  "data": {
    "query_id": 1,
    "status": "resolved",
    "response": "Thank you for your inquiry...",
    "responded_at": "2024-01-15T14:30:00Z"
  }
}
```

---

### 2. Quotes Endpoints

#### **POST /api/quotes**
Create a new quote request

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token> (optional - for logged-in users)
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "phone": "9876543210",
  "company_name": "ABC Industries",
  "business_type": "dealer",
  "product_type": "Biomass Pellets",
  "quantity": 5000,
  "size": "8mm",
  "purpose": "Industrial Dryer",
  "delivery_address": "123 Industrial Area, Sector 5",
  "delivery_city": "Chennai",
  "delivery_state": "Tamil Nadu",
  "delivery_pincode": "600001",
  "additional_requirements": "Need delivery within 2 weeks. Require GST invoice."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Quote request submitted successfully",
  "data": {
    "quote_id": 1,
    "quote_number": "QT-2024-0001",
    "name": "Jane Smith",
    "email": "jane@company.com",
    "phone": "9876543210",
    "company_name": "ABC Industries",
    "business_type": "dealer",
    "product_type": "Biomass Pellets",
    "quantity": 5000,
    "size": "8mm",
    "purpose": "Industrial Dryer",
    "delivery_address": "123 Industrial Area, Sector 5",
    "delivery_city": "Chennai",
    "delivery_state": "Tamil Nadu",
    "delivery_pincode": "600001",
    "additional_requirements": "Need delivery within 2 weeks. Require GST invoice.",
    "quote_status": "pending",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

#### **GET /api/quotes**
Get all quotes (with pagination and filters)

**Request Headers:**
```
Authorization: Bearer <token> (required)
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10) |
| quote_status | string | No | Filter by status (pending/processing/sent/accepted/rejected/expired) |
| business_type | string | No | Filter by business type |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "quote_id": 1,
      "quote_number": "QT-2024-0001",
      "user_id": 5,
      "name": "Jane Smith",
      "email": "jane@company.com",
      "phone": "9876543210",
      "company_name": "ABC Industries",
      "business_type": "dealer",
      "product_type": "Biomass Pellets",
      "quantity": 5000,
      "size": "8mm",
      "purpose": "Industrial Dryer",
      "estimated_amount": 60000.00,
      "quote_status": "sent",
      "valid_until": "2024-02-15",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

---

#### **GET /api/quotes/:id**
Get a specific quote by ID

**Request Headers:**
```
Authorization: Bearer <token> (required)
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "quote_id": 1,
    "quote_number": "QT-2024-0001",
    "user_id": 5,
    "name": "Jane Smith",
    "email": "jane@company.com",
    "phone": "9876543210",
    "company_name": "ABC Industries",
    "business_type": "dealer",
    "product_type": "Biomass Pellets",
    "quantity": 5000,
    "size": "8mm",
    "purpose": "Industrial Dryer",
    "delivery_address": "123 Industrial Area, Sector 5",
    "delivery_city": "Chennai",
    "delivery_state": "Tamil Nadu",
    "delivery_pincode": "600001",
    "additional_requirements": "Need delivery within 2 weeks. Require GST invoice.",
    "estimated_amount": 60000.00,
    "quote_status": "sent",
    "valid_until": "2024-02-15",
    "notes": "Customer is a regular dealer. Offer 5% discount.",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-16T09:00:00Z"
  }
}
```

---

#### **PUT /api/quotes/:id**
Update quote (Admin only)

**Request Headers:**
```
Authorization: Bearer <token> (required - admin)
Content-Type: application/json
```

**Request Body:**
```json
{
  "estimated_amount": 60000.00,
  "quote_status": "sent",
  "valid_until": "2024-02-15",
  "notes": "Customer is a regular dealer. Offer 5% discount."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quote updated successfully",
  "data": {
    "quote_id": 1,
    "quote_number": "QT-2024-0001",
    "estimated_amount": 60000.00,
    "quote_status": "sent",
    "valid_until": "2024-02-15"
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "email": "Invalid email format",
    "phone": "Phone number must be 10 digits"
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "You don't have permission to perform this action"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Query/Quote not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Implementation Notes

1. **Quote Number Generation:** Use format `QT-YYYY-NNNN` where YYYY is year and NNNN is sequential number
2. **Query Number Generation:** Use format `QRY-YYYY-NNNN` for tracking
3. **Email Notifications:** Send email to customer when query/quote is responded to
4. **Admin Dashboard:** Provide interface for admins to manage queries and quotes
5. **Auto-expiry:** Quotes should auto-expire after valid_until date
6. **Priority Assignment:** Auto-assign priority based on keywords in query message
7. **Response Templates:** Provide common response templates for admins

---

## Security Considerations

1. Rate limiting: Max 5 queries/quotes per hour per IP for guest users
2. Input validation: Sanitize all user inputs to prevent SQL injection
3. Email verification: Send confirmation email for new queries/quotes
4. Admin authentication: Only authenticated admins can update status/response
5. Data privacy: Mask sensitive information in logs

---

## Future Enhancements

1. File attachments for queries (images, documents)
2. Real-time chat integration
3. Quote comparison feature
4. Automated quote generation based on product configurations
5. SMS notifications for quote updates
6. Multi-language support