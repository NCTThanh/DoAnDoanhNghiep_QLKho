const express = require('express');
const cors = require('cors');
const morgan = require('morgan');           
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
// Thêm các routes mới
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const supplierPaymentRoutes = require('./routes/supplierPaymentRoutes');
const inventoryLogRoutes = require('./routes/inventoryLogRoutes'); 
const proxyRoutes = require('./routes/proxyRoutes');

const path = require('path');
const app = express();

// ====================== MIDDLEWARE ======================
app.use(cors({
  origin: '*',                    
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());           
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));            

// ====================== ROUTES ======================
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
// Các routes mới
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/supplier-payments', supplierPaymentRoutes);
app.use('/api/inventory-log', inventoryLogRoutes); 
// Proxy for external images (caches into backend/uploads)
app.use('/api', proxyRoutes);

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====================== ROUTE TEST ======================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "🚀 KiotViet Clone API Server is running!",
    version: "2.0.0",
    endpoints: {
      products: "/api/products",
      orders: "/api/orders",
      inventory: "/api/inventory",
      suppliers: "/api/suppliers (NEW)",
      purchase_orders: "/api/purchase-orders (NEW)",
      supplier_payments: "/api/supplier-payments (NEW)",
      inventory_log: "/api/inventory-log (NEW)"
    }
  });
});

// ====================== ERROR HANDLING ======================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route không tồn tại"
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: "Lỗi server nội bộ",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ====================== EXPORT ======================
module.exports = app;