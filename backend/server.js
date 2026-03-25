const express = require('express');
const cors = require('cors');
const path = require('path');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server bách hóa đang chạy tại http://localhost:${PORT}`);
});