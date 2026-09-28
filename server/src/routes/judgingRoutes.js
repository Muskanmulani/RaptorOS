const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/roles");

const {
  createJudge,
  getJudges,
  createRubric,
  getEventRubrics,
  assignJudges,
  getAssignments,
  getMyAssignments,
  getProjectJudgingData,
  submitJudgment,
  getJudgeProgress,
  getNormalizedResults,
  explainProjectScore,
  exportResultsCsv,
  simulateEventJudging
} = require("../controllers/judgingController");

const router = express.Router();

router.get(
  "/my-assignments",
  authenticate,
  authorize("judge"),
  getMyAssignments
);

router.get(
  "/my-progress",
  authenticate,
  authorize("judge"),
  getJudgeProgress
);

router.get(
  "/project/:projectId",
  authenticate,
  authorize("judge"),
  getProjectJudgingData
);

router.get(
  "/explain/:projectId",
  authenticate,
  authorize("admin", "organizer", "judge"),
  explainProjectScore
);

router.post(
  "/judgments",
  authenticate,
  authorize("judge"),
  submitJudgment
);

router.get(
  "/judges",
  authenticate,
  authorize("admin", "organizer"),
  getJudges
);

router.post(
  "/judges",
  authenticate,
  authorize("admin", "organizer"),
  createJudge
);

router.get(
  "/rubrics/:eventId",
  authenticate,
  authorize("admin", "organizer", "judge"),
  getEventRubrics
);

router.post(
  "/rubrics",
  authenticate,
  authorize("admin", "organizer"),
  createRubric
);

router.get(
  "/assignments",
  authenticate,
  authorize("admin", "organizer"),
  getAssignments
);

router.post(
  "/assign",
  authenticate,
  authorize("admin", "organizer"),
  assignJudges
);
router.get(
  "/results/:eventId/export",
  authenticate,
  authorize("admin", "organizer"),
  exportResultsCsv
);

router.get(
  "/results/:eventId",
  authenticate,
  authorize("admin", "organizer"),
  getNormalizedResults
);
router.post(
  "/simulate/:eventId",
  authenticate,
  authorize("admin", "organizer"),
  simulateEventJudging
);

module.exports = router;