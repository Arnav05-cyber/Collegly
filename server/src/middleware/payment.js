const Payment = require('../models/Payment');

// Validate payment amount
const validatePaymentAmount = (req, res, next) => {
  const { amount } = req.body;

  if (amount && (amount <= 0 || isNaN(amount))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment amount'
    });
  }

  next();
};

// Check if payment already exists
const checkDuplicatePayment = async (req, res, next) => {
  try {
    const { gigId, productId } = req.params;
    const relatedId = gigId || productId;
    const paymentType = gigId ? 'gig' : 'product';

    const existingPayment = await Payment.findOne({
      relatedId,
      paymentType,
      status: { $in: ['pending', 'completed'] }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already exists for this item'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking payment',
      error: error.message
    });
  }
};

// Verify payment ownership
const verifyPaymentOwnership = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const clerkId = req.auth.userId;

    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user is either payer or recipient
    const User = require('../models/User');
    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isOwner = payment.userId.toString() === user._id.toString() ||
                    payment.payerDetails.userId.toString() === user._id.toString() ||
                    payment.recipientDetails.userId.toString() === user._id.toString();

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this payment'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying payment ownership',
      error: error.message
    });
  }
};

module.exports = {
  validatePaymentAmount,
  checkDuplicatePayment,
  verifyPaymentOwnership
};
