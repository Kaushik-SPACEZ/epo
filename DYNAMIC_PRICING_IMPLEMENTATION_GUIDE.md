# Dynamic Pricing Implementation Guide

## Overview
This guide explains how to implement dynamic pricing where the price changes based on the selected product size (6mm, 8mm, 10mm).

---

## Current System Analysis

### Current Database Structure
Your existing database already has support for this feature:

**Table: `product_configurations`**
```sql
CREATE TABLE product_configurations (
    config_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    size VARCHAR(20),           -- '6mm', '8mm', '10mm'
    purpose VARCHAR(100),        -- 'Commercial Kitchen', 'Industrial Dryer'
    price DECIMAL(10,2),        -- ✅ Price per configuration
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);
```

**Table: `products`**
```sql
CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(255),
    product_type ENUM('pellets', 'biomass-stove', 'biomass-burner'),
    base_price DECIMAL(10,2),   -- Base/default price
    -- ... other fields
);
```

---

## Implementation Options

### ✅ **Option 1: Use Existing `product_configurations` Table (RECOMMENDED)**

This is the **best approach** because:
- ✅ Database structure already exists
- ✅ Supports size + purpose combinations
- ✅ Flexible pricing per configuration
- ✅ Easy to manage via admin panel

#### Database Setup

**Step 1: Insert Configuration Data**

```sql
-- Example: Biomass Pellets pricing for different sizes
INSERT INTO product_configurations (product_id, size, purpose, price, is_available) VALUES
-- 6mm pellets
(1, '6mm', 'Commercial Kitchen', 12.00, TRUE),
(1, '6mm', 'Industrial Dryer', 12.00, TRUE),

-- 8mm pellets (standard - slightly higher)
(1, '8mm', 'Commercial Kitchen', 14.00, TRUE),
(1, '8mm', 'Industrial Dryer', 14.00, TRUE),

-- 10mm pellets (premium - highest price)
(1, '10mm', 'Commercial Kitchen', 16.00, TRUE),
(1, '10mm', 'Industrial Dryer', 16.00, TRUE);
```

**Step 2: API Endpoint (Already Exists!)**

Your backend already has this endpoint:
```
GET /api/products/:productId/configurations?size=8mm&purpose=Commercial Kitchen
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "config_id": 2,
      "product_id": 1,
      "size": "8mm",
      "purpose": "Commercial Kitchen",
      "price": 14.00,
      "is_available": true
    }
  ]
}
```

---

### Option 2: Simple Size-Based Pricing Table

If you want **simpler** pricing (only based on size, not purpose):

**Create New Table:**
```sql
CREATE TABLE product_size_pricing (
    pricing_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    size VARCHAR(20) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    UNIQUE KEY unique_product_size (product_id, size)
);
```

**Insert Data:**
```sql
INSERT INTO product_size_pricing (product_id, size, price) VALUES
(1, '6mm', 12.00),
(1, '8mm', 14.00),
(1, '10mm', 16.00);
```

---

## Frontend Implementation

### Step 1: Update Product Selection Page

**File: `app/product-selection.tsx`**

```typescript
// Add state for dynamic price
const [selectedPrice, setSelectedPrice] = useState<number>(0);

// Fetch price when size changes
useEffect(() => {
  if (selectedProduct && selectedSize) {
    fetchPriceForSize(selectedProduct.id, selectedSize);
  }
}, [selectedProduct, selectedSize]);

const fetchPriceForSize = async (productId: string, size: string) => {
  try {
    const response = await api.products.getConfigurations(
      parseInt(productId),
      { size, is_available: true }
    );
    
    if (response.success && response.data && response.data.length > 0) {
      const config = response.data[0];
      setSelectedPrice(config.price);
    }
  } catch (error) {
    console.error('Failed to fetch price:', error);
    // Fallback to base price
    setSelectedPrice(selectedProduct.price);
  }
};

// Update price calculation
const subtotal = selectedPrice * quantity;
```

### Step 2: Display Dynamic Price

```tsx
{selectedProduct && selectedSize && (
  <View style={styles.priceDisplay}>
    <Text style={styles.priceLabel}>Price per kg:</Text>
    <Text style={styles.priceValue}>₹{selectedPrice.toFixed(2)}</Text>
  </View>
)}
```

---

## Backend Implementation (If Needed)

### Option A: Use Existing Endpoint

**File: `backend/routes/products.js`**

The endpoint already exists:
```javascript
router.get('/:id/configurations', async (req, res) => {
  const { id } = req.params;
  const { size, purpose, is_available } = req.query;
  
  // Query filters configurations by size and purpose
  // Returns price for that specific configuration
});
```

### Option B: Add New Endpoint for Size-Only Pricing

**File: `backend/routes/products.js`**

```javascript
// GET /api/products/:id/price?size=8mm
router.get('/:id/price', async (req, res) => {
  try {
    const { id } = req.params;
    const { size } = req.query;
    
    if (!size) {
      return res.status(400).json({
        success: false,
        error: 'Size parameter is required'
      });
    }
    
    const query = `
      SELECT price 
      FROM product_configurations 
      WHERE product_id = ? AND size = ? AND is_available = TRUE
      LIMIT 1
    `;
    
    const [rows] = await db.query(query, [id, size]);
    
    if (rows.length === 0) {
      // Fallback to base price
      const [product] = await db.query(
        'SELECT base_price FROM products WHERE product_id = ?',
        [id]
      );
      
      return res.json({
        success: true,
        data: { price: product[0].base_price }
      });
    }
    
    res.json({
      success: true,
      data: { price: rows[0].price }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## Pricing Strategy Examples

### Example 1: Linear Pricing
```
6mm: ₹12/kg (base)
8mm: ₹14/kg (+₹2)
10mm: ₹16/kg (+₹2)
```

### Example 2: Premium Pricing
```
6mm: ₹12/kg (economy)
8mm: ₹15/kg (standard)
10mm: ₹20/kg (premium)
```

### Example 3: Purpose-Based Pricing
```
6mm Commercial Kitchen: ₹12/kg
6mm Industrial Dryer: ₹13/kg

8mm Commercial Kitchen: ₹14/kg
8mm Industrial Dryer: ₹15/kg

10mm Commercial Kitchen: ₹16/kg
10mm Industrial Dryer: ₹18/kg
```

---

## Testing Checklist

- [ ] Insert test data into `product_configurations` table
- [ ] Test API endpoint: `GET /api/products/1/configurations?size=8mm`
- [ ] Update frontend to fetch price when size changes
- [ ] Display dynamic price in UI
- [ ] Test price calculation with quantity
- [ ] Test order creation with correct price
- [ ] Verify price in order summary
- [ ] Test with all three sizes (6mm, 8mm, 10mm)

---

## Migration Script

**File: `backend/database/migrations/add_size_pricing.sql`**

```sql
-- Step 1: Clear existing configurations (if any)
DELETE FROM product_configurations;

-- Step 2: Insert pricing for Biomass Pellets (product_id = 1)
INSERT INTO product_configurations (product_id, size, purpose, price, is_available) VALUES
-- 6mm pellets
(1, '6mm', 'Commercial Kitchen', 12.00, TRUE),
(1, '6mm', 'Industrial Dryer', 12.00, TRUE),

-- 8mm pellets
(1, '8mm', 'Commercial Kitchen', 14.00, TRUE),
(1, '8mm', 'Industrial Dryer', 14.00, TRUE),

-- 10mm pellets
(1, '10mm', 'Commercial Kitchen', 16.00, TRUE),
(1, '10mm', 'Industrial Dryer', 16.00, TRUE);

-- Step 3: Verify data
SELECT * FROM product_configurations ORDER BY size, purpose;
```

---

## Recommended Approach

### ✅ **Use Option 1: Existing `product_configurations` Table**

**Why?**
1. Database structure already exists
2. API endpoint already implemented
3. Supports complex pricing (size + purpose)
4. Future-proof for additional configurations
5. Easy to manage via admin panel

**Implementation Steps:**
1. ✅ Run migration script to insert pricing data
2. ✅ Update frontend to fetch price when size changes
3. ✅ Display dynamic price in UI
4. ✅ Test thoroughly

**Estimated Time:** 2-3 hours

---

## Summary

| Approach | Complexity | Flexibility | Recommended |
|----------|-----------|-------------|-------------|
| **Option 1: product_configurations** | Low | High | ✅ **YES** |
| Option 2: New pricing table | Medium | Medium | ❌ No |
| Hardcoded in frontend | Very Low | Very Low | ❌ No |

**Next Steps:**
1. Run the migration script
2. Test the API endpoint
3. Update the frontend code
4. Test the complete flow

---

## Questions?

If you need help with:
- Writing the migration script
- Updating the frontend code
- Testing the implementation
- Setting up admin panel for price management

Just let me know! 🚀