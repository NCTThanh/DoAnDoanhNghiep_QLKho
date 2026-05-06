const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

// ====================== SUPPLIERS ROUTES ======================
router.get('/', supplierController.getAllSuppliers);
router.post('/', supplierController.createSupplier);
router.get('/:id', supplierController.getSupplierById);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);
router.get('/:id/debt-history', supplierController.getDebtHistory);

module.exports = router;
