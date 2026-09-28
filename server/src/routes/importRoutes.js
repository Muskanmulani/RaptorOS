const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/roles");

const {
  importParticipantsController,
  getImportJobs
} = require("../controllers/importController");

const router = express.Router();

router.post(
  "/participants/:eventId",
  authenticate,
  authorize("admin", "organizer"),
  importParticipantsController
);

router.get(
  "/jobs/:eventId",
  authenticate,
  authorize("admin", "organizer"),
  getImportJobs
);

module.exports = router;