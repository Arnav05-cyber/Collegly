const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  gigId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: false,
    trim: true
  },
  fileUrl: {
    type: String,
    required: false
  },
  fileName: {
    type: String,
    required: false
  },
  fileType: {
    type: String,
    required: false
  },
  fileSize: {
    type: Number,
    required: false
  },
  read: {
    type: Boolean,
    default: false
  },
  chatEnded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
