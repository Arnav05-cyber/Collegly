const { clerkMiddleware, requireAuth } = require('@clerk/express');

// Apply Clerk middleware to all routes
const clerkAuth = clerkMiddleware();

// Middleware to require authentication
const protectRoute = requireAuth();

module.exports = {
  clerkAuth,
  protectRoute
};
