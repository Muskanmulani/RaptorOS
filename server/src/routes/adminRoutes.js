
const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/roles");

const router = express.Router();

router.get(
  "/me",
  authenticate,
  authorize("admin", "organizer"),
  (req, res) => {
    res.json({
      message: "Admin access verified",
      user: req.user
    });
  }
);

module.exports = router;
