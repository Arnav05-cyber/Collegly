const express = require('express');
const router = express.Router();
const { protectRoute } = require('../middleware/auth');
const { validateGigCreation } = require('../middleware/validation');
const {
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
} = require('../controllers/gig');

// Public routes
router.get('/', getAllGigs);

// Protected routes - specific routes MUST come before parameterized routes
router.get('/my/gigs', protectRoute, getMyGigs);
router.get('/my/accepted', protectRoute, getAcceptedGigs);
router.post('/', protectRoute, validateGigCreation, createGig);
router.get('/:id', getGigById);
router.put('/:id', protectRoute, updateGig);
router.delete('/:id', protectRoute, deleteGig);
router.post('/:id/accept', protectRoute, acceptGig);
router.post('/:id/complete', protectRoute, completeGig);
router.post('/:id/cancel', protectRoute, cancelAcceptedGig);

module.exports = router;
