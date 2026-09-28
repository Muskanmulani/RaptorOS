const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/roles");

const {
  getAuditLogs,
  getEntityTimeline
} = require("../controllers/auditController");

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("admin", "organizer"),
  getAuditLogs
);

router.get(
  "/:entityType/:entityId",
  authenticate,
  authorize("admin", "organizer"),
  getEntityTimeline
);

module.exports = router;