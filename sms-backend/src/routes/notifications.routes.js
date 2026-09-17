const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const ctrl = require("../controllers/notifications.controller");

const router = express.Router();
router.use(authenticate);

// List and filtering
router.get("/", asyncHandler(ctrl.list));
router.get("/summary", asyncHandler(ctrl.getUnreadSummary));
router.get("/by-module", asyncHandler(ctrl.getByModule));
router.get("/by-entity/:entityType", asyncHandler(ctrl.getByEntityType));
router.get("/statistics", asyncHandler(ctrl.getStatistics));

// Mark as read
router.post("/:id/read", asyncHandler(ctrl.markRead));
router.post("/batch/read", asyncHandler(ctrl.markMultipleRead));
router.post("/read-all", asyncHandler(ctrl.markAllRead));
router.post("/module/:module/read", asyncHandler(ctrl.markModuleRead));

// Delete (soft delete)
router.delete("/:id", asyncHandler(ctrl.deleteNotification));
router.post("/batch/delete", asyncHandler(ctrl.deleteMultiple));

module.exports = router;
