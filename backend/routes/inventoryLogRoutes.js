const express = require('express');
const router = express.Router();
const inventoryLogController = require('../controllers/inventoryLogController');

// ====================== INVENTORY LOG ROUTES ======================
router.get('/', inventoryLogController.getInventoryLog);
router.get('/product/:product_id/history', inventoryLogController.getProductHistory);

module.exports = router;
