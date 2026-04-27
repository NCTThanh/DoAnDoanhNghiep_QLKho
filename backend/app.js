const express = require('express');
const cors = require('cors');
const morgan = require('morgan');           
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
// Thêm dòng import này
const inventoryRoutes = require('./routes/inventoryRoutes'); 

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
// Thêm dòng này để Backend nhận diện đường dẫn Dashboard
app.use('/api/inventory', inventoryRoutes); 

// ====================== ROUTE TEST ======================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "🚀 KiotViet Clone API Server is running!",
    version: "1.0.0",
    endpoints: {
      products: "/api/products",
      orders: "/api/orders",
      inventory: "/api/inventory" // Bổ sung vào route test cho đẹp
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