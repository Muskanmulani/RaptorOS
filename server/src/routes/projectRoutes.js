const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/roles");

const {
  createProject,
  getProject,
  getProjects,
  getPublicProject,
  updateProject,
  createSubmissionVersion,
  submitProject,
  getProjectSubmissions
} = require("../controllers/projectController");

const router = express.Router();

router.get("/", getProjects);

router.get("/public/:id", getPublicProject);
router.get(
  "/:id/submissions",
  authenticate,
  authorize("participant", "judge", "organizer", "admin"),
  getProjectSubmissions
);

router.get("/:id", getProject);

router.post(
  "/",
  authenticate,
  authorize("participant"),
  createProject
);

router.put(
  "/:id",
  authenticate,
  authorize("participant"),
  updateProject
);

router.post(
  "/:id/versions",
  authenticate,
  authorize("participant"),
  createSubmissionVersion
);

router.post(
  "/:id/submit",
  authenticate,
  authorize("participant"),
  submitProject
);

module.exports = router;