const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/roles");

const {
  issueCertificateForUser,
  verifyCertificate
} = require("../controllers/certificateController");

const router = express.Router();

router.post(
  "/event/:eventId",
  authenticate,
  authorize("admin", "organizer"),
  issueCertificateForUser
);

router.get(
  "/verify/:certificateCode",
  verifyCertificate
);

module.exports = router;