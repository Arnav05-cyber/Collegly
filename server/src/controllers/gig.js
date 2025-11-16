const Gig = require('../models/Gig');
const User = require('../models/User');

// Create a new gig
const createGig = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { title, description, images, price, category } = req.body;

    // Find user by clerkId to get MongoDB _id
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent product listers from creating gigs (to avoid bid manipulation)
    if (user.roles.includes('product_lister')) {
      return res.status(403).json({
        success: false,
        message: 'Product listers cannot create gigs. This prevents manipulation of product bids.'
      });
    }

    const gig = await Gig.create({
      userId: user._id,
      title,
      description,
      images: images || [],
      price,
      category
    });

    res.status(201).json({
      success: true,
      message: 'Gig created successfully',
      gig: gig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating gig',
      error: error.message
    });
  }
};

// Get all gigs
const getAllGigs = async (req, res) => {
  try {
    const gigs = await Gig.find({ status: 'active' })
      .populate('userId', 'firstName lastName email profileImage')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: gigs.length,
      gigs: gigs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching gigs',
      error: error.message
    });
  }
};

// Get single gig by ID
const getGigById = async (req, res) => {
  try {
    const { id } = req.params;

    const gig = await Gig.findById(id)
      .populate('userId', 'firstName lastName email profileImage');

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    res.json({
      success: true,
      gig: gig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching gig',
      error: error.message
    });
  }
};

// Update gig
const updateGig = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { id } = req.params;
    const updates = req.body;

    // Find user by clerkId
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find gig and check ownership
    const gig = await Gig.findById(id);

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    if (gig.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this gig'
      });
    }

    const updatedGig = await Gig.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Gig updated successfully',
      gig: updatedGig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating gig',
      error: error.message
    });
  }
};

// Delete gig (owner can delete even if accepted)
const deleteGig = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { id } = req.params;

    // Find user by clerkId
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find gig and check ownership
    const gig = await Gig.findById(id);

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    if (gig.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this gig'
      });
    }

    // If gig was accepted, remove it from the worker's acceptedGigs
    if (gig.acceptedBy) {
      await User.findByIdAndUpdate(
        gig.acceptedBy,
        { $pull: { acceptedGigs: gig._id } }
      );
    }

    await Gig.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Gig deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting gig',
      error: error.message
    });
  }
};

// Accept/Choose a gig (for users who want to do the gig)
const acceptGig = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { id } = req.params;

    // Find user by clerkId
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const gig = await Gig.findById(id);

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    if (gig.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This gig is no longer available'
      });
    }

    // Check if user is trying to accept their own gig
    if (gig.userId.toString() === user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot accept your own gig'
      });
    }

    // Check if user already accepted this gig
    if (user.acceptedGigs.includes(gig._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already accepted this gig'
      });
    }

    // Check if time limit has passed
    if (gig.timeLimit && new Date() > new Date(gig.timeLimit)) {
      return res.status(400).json({
        success: false,
        message: 'This gig has expired. The time limit has passed.'
      });
    }

    // Update gig with acceptance details
    gig.acceptedBy = user._id;
    gig.acceptedAt = new Date();
    await gig.save();

    // Add gig to user's acceptedGigs and add gig_worker role if not present
    user.acceptedGigs.push(gig._id);
    if (!user.roles.includes('gig_worker')) {
      user.roles.push('gig_worker');
    }
    await user.save();

    res.json({
      success: true,
      message: 'Gig accepted successfully',
      gig: gig,
      roles: user.roles,
      timeLimit: gig.timeLimit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error accepting gig',
      error: error.message
    });
  }
};

// Complete a gig (mark as completed by the worker)
const completeGig = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { id } = req.params;

    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const gig = await Gig.findById(id);

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    // Check if user is the one who accepted the gig
    if (!gig.acceptedBy || gig.acceptedBy.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to complete this gig'
      });
    }

    // Check if already completed
    if (gig.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This gig is already completed'
      });
    }

    // Check if time limit has passed
    if (gig.timeLimit && new Date() > new Date(gig.timeLimit)) {
      gig.status = 'inactive';
      await gig.save();
      
      return res.status(400).json({
        success: false,
        message: 'Time limit exceeded. You cannot complete this gig anymore.',
        gig: gig
      });
    }

    // Mark gig as completed
    gig.status = 'completed';
    gig.completedAt = new Date();
    await gig.save();

    // End the chat between the gig poster and acceptor
    const Message = require('../models/Message');
    const conversationId = [gig.userId.toString(), gig.acceptedBy.toString()].sort().join('_');
    
    await Message.updateMany(
      { 
        conversationId: conversationId,
        gigId: gig._id
      },
      { 
        $set: { chatEnded: true }
      }
    );

    res.json({
      success: true,
      message: 'Gig completed successfully',
      gig: gig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing gig',
      error: error.message
    });
  }
};

// Get user's own gigs
const getMyGigs = async (req, res) => {
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

    const gigs = await Gig.find({ userId: user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: gigs.length,
      gigs: gigs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your gigs',
      error: error.message
    });
  }
};

// Get user's accepted gigs
const getAcceptedGigs = async (req, res) => {
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

    const gigs = await Gig.find({ acceptedBy: user._id })
      .populate('userId', 'firstName lastName email profileImage')
      .sort({ acceptedAt: -1 });

    res.json({
      success: true,
      count: gigs.length,
      gigs: gigs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching accepted gigs',
      error: error.message
    });
  }
};

// Cancel accepted gig (worker can cancel if conditions are met)
const cancelAcceptedGig = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { id } = req.params;

    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const gig = await Gig.findById(id);

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    // Check if user is the one who accepted the gig
    if (!gig.acceptedBy || gig.acceptedBy.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You have not accepted this gig'
      });
    }

    // Check if gig is already completed
    if (gig.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed gig'
      });
    }

    // Calculate time elapsed since acceptance
    const acceptedAt = new Date(gig.acceptedAt);
    const now = new Date();
    const deadline = new Date(acceptedAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const totalDuration = deadline - acceptedAt; // Total time in milliseconds
    const timeElapsed = now - acceptedAt;
    const percentageElapsed = (timeElapsed / totalDuration) * 100;

    // Check if total duration is more than 1 hour (3600000 ms)
    if (totalDuration <= 3600000) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel gigs with duration of 1 hour or less'
      });
    }

    // Check if more than 5% of time has elapsed
    if (percentageElapsed > 5) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel gig after 5% of the deadline has passed',
        percentageElapsed: percentageElapsed.toFixed(2)
      });
    }

    // Cancel the gig - reset acceptance
    gig.acceptedBy = null;
    gig.acceptedAt = null;
    gig.status = 'active';
    await gig.save();

    // Remove gig from user's acceptedGigs
    user.acceptedGigs = user.acceptedGigs.filter(
      gigId => gigId.toString() !== gig._id.toString()
    );
    await user.save();

    res.json({
      success: true,
      message: 'Gig cancelled successfully',
      gig: gig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling gig',
      error: error.message
    });
  }
};

module.exports = {
  createGig,
  getAllGigs,
  getGigById,
  updateGig,
  deleteGig,
  acceptGig,
  completeGig,
  getMyGigs,
  getAcceptedGigs,
  cancelAcceptedGig
};
