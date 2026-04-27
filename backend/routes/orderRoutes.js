// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Danh sách đơn hàng
router.get('/', orderController.getAllOrders);

// Chi tiết đơn hàng
router.get('/:id', orderController.getOrderById);

// Tạo đơn hàng
router.post('/', orderController.createOrder);

// Cập nhật trạng thái
router.put('/:id/status', orderController.updateOrderStatus);

// Xóa / Hủy đơn
router.delete('/:id', orderController.deleteOrder);

module.exports = router;