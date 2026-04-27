const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Route GET cho Dashboard
router.get('/dashboard', inventoryController.getDashboardStats);

router.post('/purchase-orders', inventoryController.createPurchaseOrder);

module.exports = router;