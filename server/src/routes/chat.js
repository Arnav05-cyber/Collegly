const express = require('express');
const router = express.Router();
const { protectRoute } = require('../middleware/auth');
const {
  getConversation,
  sendMessage,
  getUserConversations
} = require('../controllers/chat');

// All chat routes are protected
router.get('/conversations', protectRoute, getUserConversations);
router.get('/conversation/:conversationId', protectRoute, getConversation);
router.post('/send', protectRoute, sendMessage);

module.exports = router;
