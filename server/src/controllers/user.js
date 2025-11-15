const User = require('../models/User');

// Get current user profile
const getUserProfile = async (req, res) => {
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
    
    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// Create or update user profile
const updateUserProfile = async (req, res) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;
    const { email, firstName, lastName, profileImage } = req.body;
    
    const user = await User.findOneAndUpdate(
      { clerkId },
      { email, firstName, lastName, profileImage },
      { new: true, upsert: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'User profile updated successfully',
      user: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Sign in or sign up user (OAuth callback handler)
const signInOrSignUp = async (req, res) => {
  try {
    console.log('Sign in/up request received');
    console.log('Request body:', req.body);
    
    const auth = req.auth();
    const clerkId = auth?.userId;
    
    if (!clerkId) {
      console.log('No Clerk ID found in request');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No user ID found. Make sure CLERK_SECRET_KEY is set in .env'
      });
    }

    // Get user data from request body (sent from frontend after Clerk auth)
    const { email, firstName, lastName, profileImage } = req.body;

    console.log('Looking for user with clerkId:', clerkId);

    // Check if user exists
    let user = await User.findOne({ clerkId });

    if (user) {
      console.log('User found, updating...');
      // User exists - sign in (optionally update profile)
      user = await User.findOneAndUpdate(
        { clerkId },
        { email, firstName, lastName, profileImage },
        { new: true }
      );

      return res.json({
        success: true,
        message: 'User signed in successfully',
        isNewUser: false,
        user: user
      });
    } else {
      console.log('User not found, creating new user...');
      // User doesn't exist - sign up (create new user)
      user = await User.create({
        clerkId,
        email,
        firstName,
        lastName,
        profileImage,
        roles: ['buyer']
      });

      console.log('New user created:', user);

      return res.status(201).json({
        success: true,
        message: 'User signed up successfully',
        isNewUser: true,
        user: user
      });
    }
  } catch (error) {
    console.error('Error in signInOrSignUp:', error);
    res.status(500).json({
      success: false,
      message: 'Error during sign in/sign up',
      error: error.message
    });
  }
};

// Sign out user
const signOut = async (req, res) => {
  try {
    // With Clerk, sign out is handled on the frontend
    // This endpoint can be used for any server-side cleanup if needed
    res.json({
      success: true,
      message: 'User signed out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during sign out',
      error: error.message
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  signInOrSignUp,
  signOut
};
