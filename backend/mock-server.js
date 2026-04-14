const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
let users = [];
let orders = [];
let orderCounter = 1;

// Helper to generate order number
function generateOrderNumber() {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const orderNum = String(orderCounter++).padStart(4, '0');
  return `ES-${dateStr}-${orderNum}`;
}

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password, user_type } = req.body;
  
  const user = {
    user_id: users.length + 1,
    name,
    email,
    phone,
    user_type: user_type || 'customer',
    is_active: true,
    created_at: new Date().toISOString(),
  };
  
  users.push(user);
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token: 'mock_token_' + user.user_id,
      refresh_token: 'mock_refresh_token_' + user.user_id,
    },
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { phone, email, password } = req.body;
  
  let user = users.find(u => u.phone === phone || u.email === email);
  
  if (!user) {
    // Create a mock user if not found
    user = {
      user_id: users.length + 1,
      name: 'Test User',
      email: email || 'test@example.com',
      phone: phone || '9876543210',
      user_type: 'customer',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    users.push(user);
  }
  
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token: 'mock_token_' + user.user_id,
      refresh_token: 'mock_refresh_token_' + user.user_id,
    },
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  const user = users[0] || {
    user_id: 1,
    name: 'Test User',
    email: 'test@example.com',
    phone: '9876543210',
    user_type: 'customer',
    is_active: true,
    created_at: new Date().toISOString(),
  };
  
  res.json({
    success: true,
    data: user,
  });
});

// ============================================
// PRODUCT ENDPOINTS
// ============================================

app.get('/api/products', (req, res) => {
  const products = [
    {
      product_id: 1,
      product_name: 'Biomass Pellets',
      product_type: 'pellets',
      description: 'Premium quality biomass pellets',
      base_price: 8.5,
      category: 'Fuel',
      is_available: true,
    },
    {
      product_id: 2,
      product_name: 'Biomass Stove',
      product_type: 'biomass-stove',
      description: 'Efficient biomass stove',
      base_price: 7.0,
      category: 'Equipment',
      is_available: true,
    },
    {
      product_id: 3,
      product_name: 'Biomass Burner',
      product_type: 'biomass-burner',
      description: 'Industrial biomass burner',
      base_price: 10.0,
      category: 'Equipment',
      is_available: true,
    },
  ];
  
  res.json({
    success: true,
    data: {
      data: products,
      pagination: {
        page: 1,
        limit: 10,
        total: products.length,
        total_pages: 1,
      },
    },
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = {
    product_id: parseInt(req.params.id),
    product_name: 'Biomass Product',
    product_type: 'pellets',
    description: 'Test product',
    base_price: 8.5,
    category: 'Fuel',
    is_available: true,
  };
  
  res.json({
    success: true,
    data: product,
  });
});

// ============================================
// ORDER ENDPOINTS
// ============================================

app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    data: {
      data: orders,
      pagination: {
        page: 1,
        limit: 10,
        total: orders.length,
        total_pages: 1,
      },
    },
  });
});

app.post('/api/orders', (req, res) => {
  console.log('📦 [Mock Server] Received order:', JSON.stringify(req.body, null, 2));
  
  const {
    delivery_address,
    delivery_city,
    delivery_state,
    delivery_pincode,
    payment_method,
    notes,
    items,
  } = req.body;
  
  // Calculate total
  const itemTotal = items.reduce((sum, item) => {
    const price = item.product_id === 1 ? 8.5 : item.product_id === 2 ? 7.0 : 10.0;
    return sum + (price * item.quantity);
  }, 0);
  
  const deliveryFee = 150;
  const totalAmount = itemTotal + deliveryFee;
  
  const order = {
    order_id: orders.length + 1,
    order_number: generateOrderNumber(),
    user_id: 1,
    total_amount: totalAmount,
    delivery_fee: deliveryFee,
    order_status: 'pending',
    payment_status: 'pending',
    payment_method: payment_method || 'COD',
    delivery_address,
    delivery_city,
    delivery_state,
    delivery_pincode,
    notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: items,
  };
  
  orders.push(order);
  
  console.log('✅ [Mock Server] Order created:', order.order_number);
  
  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order,
  });
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.order_id === parseInt(req.params.id));
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found',
    });
  }
  
  res.json({
    success: true,
    data: {
      order,
      items: order.items || [],
    },
  });
});

// ============================================
// USER ENDPOINTS
// ============================================

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.user_id === parseInt(req.params.id)) || {
    user_id: parseInt(req.params.id),
    name: 'Test User',
    email: 'test@example.com',
    phone: '9876543210',
    user_type: 'customer',
    is_active: true,
    created_at: new Date().toISOString(),
  };
  
  res.json({
    success: true,
    data: user,
  });
});

// ============================================
// STATISTICS ENDPOINTS
// ============================================

app.get('/api/statistics/orders', (req, res) => {
  res.json({
    success: true,
    data: {
      total_orders: orders.length,
      pending_orders: orders.filter(o => o.order_status === 'pending').length,
      completed_orders: orders.filter(o => o.order_status === 'delivered').length,
      total_revenue: orders.reduce((sum, o) => sum + o.total_amount, 0),
    },
  });
});

app.get('/api/statistics/active-orders', (req, res) => {
  const activeOrders = orders.filter(o => 
    ['pending', 'confirmed', 'processing', 'shipped'].includes(o.order_status)
  );
  
  res.json({
    success: true,
    data: activeOrders,
  });
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mock API Server is running',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 Mock API Server is running');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('📋 Mock Endpoints Available:');
  console.log('  POST   /api/auth/register');
  console.log('  POST   /api/auth/login');
  console.log('  POST   /api/auth/logout');
  console.log('  GET    /api/auth/me');
  console.log('  GET    /api/products');
  console.log('  GET    /api/products/:id');
  console.log('  GET    /api/orders');
  console.log('  POST   /api/orders  ← Test this!');
  console.log('  GET    /api/orders/:id');
  console.log('  GET    /api/users/:id');
  console.log('  GET    /api/statistics/orders');
  console.log('  GET    /api/statistics/active-orders');
  console.log('');
  console.log('💡 This is a MOCK server for testing only!');
  console.log('═══════════════════════════════════════════════════════');
});