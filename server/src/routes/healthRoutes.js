const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/roles");

const {
  getEventHealth
} = require("../controllers/healthController");

const router = express.Router();

router.get(
  "/:eventId",
  authenticate,
  authorize("admin", "organizer"),
  getEventHealth
);

module.exports = router;