const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/roles");

const {
  createInvitation,
  getEventInvitations,
  getMyInvitations,
  respondToInvitation
} = require("../controllers/invitationController");

const router = express.Router();

router.get(
  "/mine",
  authenticate,
  authorize("judge"),
  getMyInvitations
);

router.get(
  "/event/:eventId",
  authenticate,
  authorize("admin", "organizer"),
  getEventInvitations
);

router.post(
  "/",
  authenticate,
  authorize("admin", "organizer"),
  createInvitation
);

router.put(
  "/:id/respond",
  authenticate,
  authorize("judge"),
  respondToInvitation
);

module.exports = router;