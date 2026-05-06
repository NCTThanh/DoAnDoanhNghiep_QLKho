const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

// Lấy danh sách NCC
router.get('/', supplierController.getAll);
// Tạo mới
router.post('/', supplierController.create);
// Cập nhật
router.put('/:id', supplierController.update);
// Xóa
router.delete('/:id', supplierController.delete);

module.exports = router;