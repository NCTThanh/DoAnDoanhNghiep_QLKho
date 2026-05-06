const app = require('./app');
const PORT = process.env.PORT || 5000;

const fs = require('fs');
const path = require('path');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.listen(PORT, () => {
  console.log(`✅ Server KiotViet Clone đang chạy tại: http://localhost:${PORT}`);
  console.log(`📌 API Products: http://localhost:${PORT}/api/products`);
  console.log(`📌 API Orders : http://localhost:${PORT}/api/orders`);
});