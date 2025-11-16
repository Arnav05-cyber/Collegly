const Message = require('../models/Message');
const User = require('../models/User');
const Gig = require('../models/Gig');

// Get conversation messages
const getConversation = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { conversationId } = req.params;

    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get messages for this conversation
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'firstName lastName profileImage')
      .populate('receiverId', 'firstName lastName profileImage')
      .sort({ createdAt: 1 });

    // Mark messages as read if user is the receiver
    await Message.updateMany(
      { 
        conversationId, 
        receiverId: user._id,
        read: false 
      },
      { read: true }
    );

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation',
      error: error.message
    });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { gigId, receiverId, message } = req.body;

    const sender = await User.findOne({ clerkId });
    
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify gig exists
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    // Check if gig is completed (chat should be ended)
    if (gig.status === 'completed') {
      return res.status(403).json({
        success: false,
        message: 'This gig has been completed. The chat has ended.'
      });
    }

    // Create conversation ID (sorted user IDs + gig ID for consistency)
    const conversationId = [sender._id.toString(), receiverId, gigId]
      .sort()
      .join('_');

    // Check if chat has been ended
    const existingMessage = await Message.findOne({ 
      conversationId,
      chatEnded: true 
    });

    if (existingMessage) {
      return res.status(403).json({
        success: false,
        message: 'This chat has ended because the gig is completed.'
      });
    }

    const newMessage = await Message.create({
      conversationId,
      gigId,
      senderId: sender._id,
      receiverId,
      message
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'firstName lastName profileImage')
      .populate('receiverId', 'firstName lastName profileImage');

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Get user's conversations
const getUserConversations = async (req, res) => {
  try {
    console.log('getUserConversations called');
    const auth = req.auth();
    const clerkId = auth.userId;
    console.log('ClerkId:', clerkId);

    const user = await User.findOne({ clerkId });
    console.log('User found:', user ? user._id : 'No user');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get all unique conversations for this user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: user._id },
            { receiverId: user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiverId', user._id] },
                  { $eq: ['$read', false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    console.log('Conversations found:', conversations.length);
    console.log('Sample conversation:', JSON.stringify(conversations[0], null, 2));

    // Manually populate user and gig details
    const Gig = require('../models/Gig');
    
    for (let conv of conversations) {
      if (conv.lastMessage) {
        // Populate sender
        if (conv.lastMessage.senderId) {
          conv.lastMessage.senderId = await User.findById(conv.lastMessage.senderId)
            .select('firstName lastName profileImage');
        }
        // Populate receiver
        if (conv.lastMessage.receiverId) {
          conv.lastMessage.receiverId = await User.findById(conv.lastMessage.receiverId)
            .select('firstName lastName profileImage');
        }
        // Populate gig
        if (conv.lastMessage.gigId) {
          conv.lastMessage.gigId = await Gig.findById(conv.lastMessage.gigId)
            .select('title');
        }
      }
    }

    console.log('Conversations after populate:', conversations.length);
    console.log('Sample populated conversation:', JSON.stringify(conversations[0], null, 2));

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error in getUserConversations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
      error: error.message
    });
  }
};

// Upload file with message
const uploadFile = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { gigId, receiverId, message } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const sender = await User.findOne({ clerkId });
    
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify gig exists
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    // Check if user is the one who accepted the gig
    if (!gig.acceptedBy || gig.acceptedBy.toString() !== sender._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the person who accepted the gig can upload files'
      });
    }

    // Check if gig is completed
    if (gig.status === 'completed') {
      return res.status(403).json({
        success: false,
        message: 'This gig has been completed. The chat has ended.'
      });
    }

    // Create conversation ID
    const conversationId = [sender._id.toString(), receiverId, gigId]
      .sort()
      .join('_');

    // Check if chat has been ended
    const existingMessage = await Message.findOne({ 
      conversationId,
      chatEnded: true 
    });

    if (existingMessage) {
      return res.status(403).json({
        success: false,
        message: 'This chat has ended because the gig is completed.'
      });
    }

    // Create message with file
    const newMessage = await Message.create({
      conversationId,
      gigId,
      senderId: sender._id,
      receiverId,
      message: message || `Sent a file: ${file.originalname}`,
      fileUrl: `/uploads/${file.filename}`,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'firstName lastName profileImage')
      .populate('receiverId', 'firstName lastName profileImage');

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
};

module.exports = {
  getConversation,
  sendMessage,
  getUserConversations,
  uploadFile
};
