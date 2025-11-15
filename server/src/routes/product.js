const express = require('express');
const router = express.Router();
const { protectRoute } = require('../middleware/auth');
const { validateProductCreation, validateBid } = require('../middleware/validation');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  placeBid,
  buyProduct,
  getMyProducts
} = require('../controllers/product');

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected routes
router.post('/', protectRoute, validateProductCreation, createProduct);
router.put('/:id', protectRoute, updateProduct);
router.delete('/:id', protectRoute, deleteProduct);
router.post('/:id/bid', protectRoute, validateBid, placeBid);
router.post('/:id/buy', protectRoute, buyProduct);
router.get('/my/products', protectRoute, getMyProducts);

module.exports = router;
