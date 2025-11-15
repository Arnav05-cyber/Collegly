const express = require('express');
const router = express.Router();
const { protectRoute } = require('../middleware/auth');
const {
  createGigPayment,
  createProductPayment,
  confirmPayment,
  getPaymentById,
  getUserPayments
} = require('../controllers/payment');

// Protected routes
router.post('/gig/:gigId', protectRoute, createGigPayment);
router.post('/product/:productId', protectRoute, createProductPayment);
router.put('/:paymentId/confirm', protectRoute, confirmPayment);
router.get('/:paymentId', protectRoute, getPaymentById);
router.get('/user/history', protectRoute, getUserPayments);

module.exports = router;
