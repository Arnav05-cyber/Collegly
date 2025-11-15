const Payment = require('../models/Payment');
const Gig = require('../models/Gig');
const Product = require('../models/Product');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create payment intent for gig
const createGigPayment = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { gigId } = req.params;
    const { paymentMethod = 'stripe' } = req.body;

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const gig = await Gig.findById(gigId).populate('userId', 'email firstName lastName');
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    if (gig.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Gig must be completed before payment'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      relatedId: gigId,
      paymentType: 'gig',
      status: { $in: ['pending', 'completed'] }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already exists for this gig'
      });
    }

    let paymentIntentId = null;

    // Create Stripe payment intent if using Stripe
    if (paymentMethod === 'stripe' && process.env.STRIPE_SECRET_KEY) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(gig.price * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          gigId: gigId.toString(),
          userId: user._id.toString(),
          type: 'gig'
        }
      });
      paymentIntentId = paymentIntent.id;
    }

    // Create payment record
    const payment = await Payment.create({
      userId: user._id,
      paymentType: 'gig',
      relatedId: gigId,
      amount: gig.price,
      status: paymentMethod === 'cash' ? 'completed' : 'pending',
      paymentMethod,
      stripePaymentIntentId: paymentIntentId,
      payerDetails: {
        userId: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      },
      recipientDetails: {
        userId: gig.userId._id,
        email: gig.userId.email,
        name: `${gig.userId.firstName} ${gig.userId.lastName}`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      payment,
      clientSecret: paymentMethod === 'stripe' ? paymentIntentId : null
    });
  } catch (error) {
    console.error('Error creating gig payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment',
      error: error.message
    });
  }
};

// Create payment intent for product auction
const createProductPayment = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { productId } = req.params;
    const { paymentMethod = 'stripe' } = req.body;

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const product = await Product.findById(productId)
      .populate('userId', 'email firstName lastName')
      .populate('highestBidder', 'email firstName lastName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.status !== 'bought') {
      return res.status(400).json({
        success: false,
        message: 'Product must be marked as bought before payment'
      });
    }

    if (!product.highestBidder || product.highestBidder._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the highest bidder can make payment'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      relatedId: productId,
      paymentType: 'product',
      status: { $in: ['pending', 'completed'] }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already exists for this product'
      });
    }

    let paymentIntentId = null;

    // Create Stripe payment intent if using Stripe
    if (paymentMethod === 'stripe' && process.env.STRIPE_SECRET_KEY) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(product.currentPrice * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          productId: productId.toString(),
          userId: user._id.toString(),
          type: 'product'
        }
      });
      paymentIntentId = paymentIntent.id;
    }

    // Create payment record
    const payment = await Payment.create({
      userId: user._id,
      paymentType: 'product',
      relatedId: productId,
      amount: product.currentPrice,
      status: paymentMethod === 'cash' ? 'completed' : 'pending',
      paymentMethod,
      stripePaymentIntentId: paymentIntentId,
      payerDetails: {
        userId: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      },
      recipientDetails: {
        userId: product.userId._id,
        email: product.userId.email,
        name: `${product.userId.firstName} ${product.userId.lastName}`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      payment,
      clientSecret: paymentMethod === 'stripe' ? paymentIntentId : null
    });
  } catch (error) {
    console.error('Error creating product payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment',
      error: error.message
    });
  }
};

// Confirm payment (webhook handler or manual confirmation)
const confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status = 'completed' } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    payment.status = status;
    await payment.save();

    res.json({
      success: true,
      message: 'Payment status updated',
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
      error: error.message
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('userId', 'firstName lastName email')
      .populate('payerDetails.userId', 'firstName lastName email')
      .populate('recipientDetails.userId', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment',
      error: error.message
    });
  }
};

// Get user's payment history
const getUserPayments = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const payments = await Payment.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate('payerDetails.userId', 'firstName lastName email')
      .populate('recipientDetails.userId', 'firstName lastName email');

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

module.exports = {
  createGigPayment,
  createProductPayment,
  confirmPayment,
  getPaymentById,
  getUserPayments
};
