const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middleware/upload');

router.get('/', productController.getAllProducts);
router.post('/', upload.single('image'), productController.createProduct);
router.put('/:id', productController.updateProduct);

module.exports = router;