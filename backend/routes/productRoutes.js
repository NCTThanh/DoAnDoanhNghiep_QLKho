const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// ==================== PRODUCT ROUTES ====================

// Lấy danh sách sản phẩm (có hỗ trợ search)
router.get('/', productController.getAllProducts);

// Lấy chi tiết 1 sản phẩm
router.get('/:id', productController.getProductById);

// Thêm sản phẩm mới
router.post('/', productController.createProduct);

// Cập nhật sản phẩm
router.put('/:id', productController.updateProduct);

// Xóa sản phẩm
router.delete('/:id', productController.deleteProduct);

module.exports = router;