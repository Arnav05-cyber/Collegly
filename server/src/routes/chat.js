const express = require('express');
const router = express.Router();
const { protectRoute } = require('../middleware/auth');
const upload = require('../config/multer');
const {
  getConversation,
  sendMessage,
  getUserConversations,
  uploadFile
} = require('../controllers/chat');

// All chat routes are protected
router.get('/conversations', protectRoute, getUserConversations);
router.get('/conversation/:conversationId', protectRoute, getConversation);
router.post('/send', protectRoute, sendMessage);
router.post('/upload', protectRoute, upload.single('file'), uploadFile);

module.exports = router;
