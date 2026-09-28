const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/roles");

const {
  issueRecord,
  verifyRecord
} = require("../controllers/judgeRecordController");

const router = express.Router();

router.post(
  "/event/:eventId",
  authenticate,
  authorize("admin", "organizer"),
  issueRecord
);

router.get(
  "/verify/:recordId",
  verifyRecord
);

module.exports = router;