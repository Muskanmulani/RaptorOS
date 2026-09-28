const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/roles");

const {
  getAssignmentConflicts,
  getJudgeConflicts,
  getDuplicateProjects
} = require("../controllers/conflictController");

const router = express.Router();

router.get(
  "/event/:eventId",
  authenticate,
  authorize("admin", "organizer"),
  getAssignmentConflicts
);

router.get(
  "/judge/:judgeId",
  authenticate,
  authorize("admin", "organizer"),
  getJudgeConflicts
);

router.get(
  "/duplicates/:eventId",
  authenticate,
  authorize("admin", "organizer"),
  getDuplicateProjects
);

module.exports = router;