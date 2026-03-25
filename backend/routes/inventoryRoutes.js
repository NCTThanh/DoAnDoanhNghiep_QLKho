const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/dashboard', inventoryController.getDashboardStats);
router.post('/purchase-orders', inventoryController.createPurchaseOrder);

module.exports = router;