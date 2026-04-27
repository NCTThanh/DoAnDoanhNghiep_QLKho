const app = require('./app');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server KiotViet Clone đang chạy tại: http://localhost:${PORT}`);
  console.log(`📌 API Products: http://localhost:${PORT}/api/products`);
  console.log(`📌 API Orders : http://localhost:${PORT}/api/orders`);
});