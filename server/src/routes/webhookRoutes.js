const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/roles");

const {
  createEventWebhook,
  getWebhooks,
  getWebhookDeliveries,
  recordTestDelivery
} = require("../controllers/webhookController");

const router = express.Router();

router.post(
  "/event/:eventId",
  authenticate,
  authorize("admin", "organizer"),
  createEventWebhook
);

router.get(
  "/event/:eventId",
  authenticate,
  authorize("admin", "organizer"),
  getWebhooks
);

router.get(
  "/:webhookId/deliveries",
  authenticate,
  authorize("admin", "organizer"),
  getWebhookDeliveries
);

router.post(
  "/:webhookId/test",
  authenticate,
  authorize("admin", "organizer"),
  recordTestDelivery
);

module.exports = router;