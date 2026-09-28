
const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/roles");
const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent
} = require("../controllers/eventController");

const router = express.Router();

router.get("/", getEvents);

router.get("/:id", getEvent);

router.post(
  "/",
  authenticate,
  authorize("admin", "organizer"),
  createEvent
);

router.put(
  "/:id",
  authenticate,
  authorize("admin", "organizer"),
  updateEvent
);

module.exports = router;
