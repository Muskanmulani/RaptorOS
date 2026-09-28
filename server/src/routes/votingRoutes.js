const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/roles");
const rateLimit = require("../middleware/rateLimit");

const {
  voteForProject,
  removeVote,
  getProjectVotingStatus,
  addComment,
  getComments,
  configureVoting
} = require("../controllers/votingController");

const router = express.Router();

router.get(
  "/project/:projectId",
  authenticate,
  getProjectVotingStatus
);

router.post(
  "/project/:projectId",
  authenticate,
  authorize("participant"),
  rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 10
  }),
  voteForProject
);

router.delete(
  "/project/:projectId",
  authenticate,
  authorize("participant"),
  rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 10
  }),
  removeVote
);

router.get(
  "/project/:projectId/comments",
  getComments
);

router.post(
  "/project/:projectId/comments",
  authenticate,
  authorize("participant", "judge", "organizer", "admin"),
  rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 10
  }),
  addComment
);

router.put(
  "/event/:eventId",
  authenticate,
  authorize("admin", "organizer"),
  configureVoting
);

module.exports = router;