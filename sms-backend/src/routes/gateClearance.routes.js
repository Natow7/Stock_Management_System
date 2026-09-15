/**
 * Gate Clearance Request Routes
 * 
 * Pre-approval workflow for Security Officer gate pass clearance
 */

const express = require('express');
const router = express.Router();
const {
  createClearanceRequest,
  listClearanceRequests,
  getClearanceRequest,
  approveClearanceRequest,
  rejectClearanceRequest,
  cancelClearanceRequest,
  listGateClearances,
} = require('../controllers/gateClearance.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/gate-clearance-requests
 * Create a new gate clearance request
 * Access: Store Head
 */
router.post(
  '/',
  requireRole('Store Head'),
  createClearanceRequest
);

/**
 * GET /api/gate-clearance-requests
 * List clearance requests (filtered by role)
 * Access: Store Head (own store), Security Officer (all), Gate Guard (all), Admin (all)
 */
router.get(
  '/',
  requireRole('Store Head', 'Campus Security Officer', 'Gate Security Guard', 'Administrator'),
  listClearanceRequests
);

/**
 * GET /api/gate-clearance-requests/clearances
 * List actual gate clearances (physical exits)
 * Access: Campus Security Officer, Gate Security Guard, Administrator
 * NOTE: This MUST come BEFORE /:id route to avoid "clearances" being treated as a UUID
 */
router.get(
  '/clearances',
  requireRole('Campus Security Officer', 'Gate Security Guard', 'Administrator'),
  listGateClearances
);

/**
 * GET /api/gate-clearance-requests/:id
 * Get single clearance request details
 * Access: Store Head (own), Security Officer (all), Gate Guard (all), Admin (all)
 */
router.get(
  '/:id',
  requireRole('Store Head', 'Campus Security Officer', 'Gate Security Guard', 'Administrator'),
  getClearanceRequest
);

/**
 * POST /api/gate-clearance-requests/:id/approve
 * Approve a clearance request
 * Access: Security Officer only
 */
router.post(
  '/:id/approve',
  requireRole('Campus Security Officer'),
  approveClearanceRequest
);

/**
 * POST /api/gate-clearance-requests/:id/reject
 * Reject a clearance request
 * Access: Security Officer only
 */
router.post(
  '/:id/reject',
  requireRole('Campus Security Officer'),
  rejectClearanceRequest
);

/**
 * POST /api/gate-clearance-requests/:id/cancel
 * Cancel a clearance request (before approval)
 * Access: Store Head (own requests only)
 */
router.post(
  '/:id/cancel',
  requireRole('Store Head'),
  cancelClearanceRequest
);

module.exports = router;
