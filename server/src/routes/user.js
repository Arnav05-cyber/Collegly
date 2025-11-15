const express = require('express');
const router = express.Router();
const { protectRoute } = require('../middleware/auth');
const { validateUserUpdate } = require('../middleware/validation');
const {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  signInOrSignUp,
  signOut
} = require('../controllers/user');

// Auth routes
router.post('/auth/signin-signup', protectRoute, signInOrSignUp);
router.post('/signout', protectRoute, signOut);

// Protected routes
router.get('/profile', protectRoute, getUserProfile);
router.put('/profile', protectRoute, validateUserUpdate, updateUserProfile);

// Admin routes
router.get('/all', protectRoute, getAllUsers);

module.exports = router;
