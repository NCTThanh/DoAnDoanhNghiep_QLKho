const express = require('express');
const router = express.Router();
const supplierPaymentController = require('../controllers/supplierPaymentController');

// ====================== SUPPLIER PAYMENTS ROUTES ======================
router.get('/', supplierPaymentController.getAllPayments);
router.post('/', supplierPaymentController.createPayment);
router.get('/:id', supplierPaymentController.getPaymentById);

module.exports = router;
