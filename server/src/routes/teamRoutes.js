
const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/roles");
const {
  createTeam,
  getTeamsByEvent,
  getTeam,
  joinTeam,
  getMyTeams
} = require("../controllers/teamController");

const router = express.Router();

router.get(
  "/mine",
  authenticate,
  authorize("participant", "organizer", "admin"),
  getMyTeams
);

router.get(
  "/event/:eventId",
  getTeamsByEvent
);

router.get(
  "/:id",
  getTeam
);

router.post(
  "/",
  authenticate,
  authorize("participant"),
  createTeam
);

router.post(
  "/join",
  authenticate,
  authorize("participant"),
  joinTeam
);

module.exports = router;
