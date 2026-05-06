const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');


// ====================== PURCHASE ORDERS ROUTES ======================
router.get('/', purchaseOrderController.getAllPurchaseOrders);
router.post('/', purchaseOrderController.createPurchaseOrder);
router.put('/:id', purchaseOrderController.updatePurchaseOrder);
router.get('/:id', purchaseOrderController.getPurchaseOrderById);
router.put('/:id/confirm', purchaseOrderController.confirmPurchaseOrder);
router.put('/:id/receive', purchaseOrderController.receivePurchaseOrder);
router.put('/:id/return', purchaseOrderController.returnPurchaseOrder);
router.delete('/:id', purchaseOrderController.deletePurchaseOrder);

module.exports = router;
