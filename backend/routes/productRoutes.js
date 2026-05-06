const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middleware/upload');

// ==================== PRODUCT ROUTES ====================

// Lấy danh sách sản phẩm (có hỗ trợ search)
router.get('/', productController.getAllProducts);

// Lấy chi tiết 1 sản phẩm
router.get('/:id', productController.getProductById);

// Thêm sản phẩm mới
router.post('/', upload.single('image'), productController.createProduct);

// Cập nhật sản phẩm
router.put('/:id', upload.single('image'), productController.updateProduct);

// Xóa sản phẩm
router.delete('/:id', productController.deleteProduct);

module.exports = router;