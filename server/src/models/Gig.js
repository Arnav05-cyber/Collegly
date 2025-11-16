const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'in_progress', 'submitted', 'in_revision', 'completed'],
    default: 'active'
  },
  timeLimit: {
    type: Date,
    required: false
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  submittedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  revisionCount: {
    type: Number,
    default: 0
  },
  maxRevisions: {
    type: Number,
    default: 2
  },
  revisionHistory: [{
    requestedAt: Date,
    reason: String,
    resolvedAt: Date
  }]
}, {
  timestamps: true
});

const Gig = mongoose.model('Gig', gigSchema);

module.exports = Gig;
