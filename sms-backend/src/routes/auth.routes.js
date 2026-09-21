const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const { checkRateLimit } = require("../middleware/rateLimiter");
const ctrl = require("../controllers/auth.controller");

const router = express.Router();

// Rate limiting applied before authentication attempt
router.post("/login", checkRateLimit, asyncHandler(ctrl.login));
router.post("/logout", authenticate, asyncHandler(ctrl.logout));
router.get("/me", authenticate, asyncHandler(ctrl.me));

module.exports = router;
