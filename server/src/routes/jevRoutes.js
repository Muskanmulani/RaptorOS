const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/roles");

const {
  indexProject,
  searchProjectEvidence,
  analyzeProjectWithJev,
  analyzeProjectCriterion
} = require("../controllers/jevController");

const router = express.Router();

router.post(
  "/project/:projectId/index",
  authenticate,
  authorize("admin", "organizer", "judge"),
  indexProject
);

router.get(
  "/project/:projectId/search",
  authenticate,
  authorize("admin", "organizer", "judge"),
  searchProjectEvidence
);

router.get(
  "/project/:projectId/analyze",
  authenticate,
  authorize("admin", "organizer", "judge"),
  analyzeProjectWithJev
);

router.get(
  "/project/:projectId/criterion/:criterionId",
  authenticate,
  authorize("admin", "organizer", "judge"),
  analyzeProjectCriterion
);

module.exports = router;