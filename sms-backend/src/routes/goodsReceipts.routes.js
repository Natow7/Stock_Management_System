const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/goodsReceipts.controller");

const router = express.Router();
router.use(authenticate);

router.get("/", asyncHandler(ctrl.list));
router.post(
  "/",
  requireRole(
    "Store Head",
    "Stock Clerk",
    "Administrator",
  ),
  asyncHandler(ctrl.create),
);
router.post(
  "/:id/evaluate",
  requireRole("Technical Evaluation Committee", "Administrator"),
  asyncHandler(ctrl.evaluate),
);

// ============================================================================
// NEW DELEGATION WORKFLOW ENDPOINTS
// ============================================================================

// STEP 1: PRO approves receipt for GRN generation
router.post(
  "/:id/approve-for-grn",
  requireRole("Property Registration Officer", "Administrator"),
  asyncHandler(ctrl.approveForGRN),
);

// STEP 2: Stock Clerk executes GRN generation (FIFO, bin cards, stock update)
router.post(
  "/:id/execute-grn",
  requireRole("Stock Clerk", "Administrator"),
  asyncHandler(ctrl.executeGRN),
);

// STEP 3: Store Head verifies physical stock
router.post(
  "/:id/verify-physical-stock",
  requireRole("Store Head", "Administrator"),
  asyncHandler(ctrl.verifyPhysicalStock),
);

// ============================================================================
// OLD WORKFLOW ENDPOINT (Deprecated - kept for backward compatibility)
// ============================================================================
router.post(
  "/:id/generate-grn",
  requireRole("Property Registration Officer"),
  asyncHandler(ctrl.generateGrn),
);

module.exports = router;
