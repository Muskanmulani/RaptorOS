const { query } = require("../config/db");

const getVotingState = async (projectId) => {
  const result = await query(
    `SELECT
      p.id AS project_id,
      t.event_id,
      e.community_voting_enabled,
      e.voting_start,
      e.voting_end,
      e.hide_voting_results
     FROM projects p
     JOIN teams t ON t.id = p.team_id
     JOIN events e ON e.id = t.event_id
     WHERE p.id = $1`,
    [projectId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const event = result.rows[0];
  const now = new Date();

  const votingStarted =
    !event.voting_start ||
    now >= new Date(event.voting_start);

  const votingNotEnded =
    !event.voting_end ||
    now <= new Date(event.voting_end);

  return {
    ...event,
    votingOpen:
      event.community_voting_enabled &&
      votingStarted &&
      votingNotEnded
  };
};

const voteForProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const votingState = await getVotingState(projectId);

    if (!votingState) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    if (!votingState.votingOpen) {
      return res.status(403).json({
        message: "Community voting is not currently open"
      });
    }

    const submittedResult = await query(
      `SELECT 1
       FROM submissions
       WHERE project_id = $1
       AND status = 'submitted'
       LIMIT 1`,
      [projectId]
    );

    if (submittedResult.rows.length === 0) {
      return res.status(400).json({
        message: "Only submitted projects can receive votes"
      });
    }

    const existingVote = await query(
      `SELECT id
       FROM project_votes
       WHERE project_id = $1
       AND user_id = $2`,
      [projectId, req.user.id]
    );

    if (existingVote.rows.length > 0) {
      return res.status(409).json({
        message: "You have already voted for this project"
      });
    }

    const result = await query(
      `INSERT INTO project_votes
       (project_id, user_id)
       VALUES ($1, $2)
       RETURNING id, project_id, created_at`,
      [projectId, req.user.id]
    );

    await query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "PROJECT_VOTED",
        "project",
        projectId,
        JSON.stringify({
          voteId: result.rows[0].id
        })
      ]
    );

    res.status(201).json({
      message: "Vote recorded",
      vote: result.rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "You have already voted for this project"
      });
    }

    console.error("Vote project error:", error);

    res.status(500).json({
      message: "Failed to record vote"
    });
  }
};

const removeVote = async (req, res) => {
  try {
    const { projectId } = req.params;

    const votingState = await getVotingState(projectId);

    if (!votingState) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    if (!votingState.votingOpen) {
      return res.status(403).json({
        message: "Voting is not currently open"
      });
    }

    const result = await query(
      `DELETE FROM project_votes
       WHERE project_id = $1
       AND user_id = $2
       RETURNING id`,
      [projectId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vote not found"
      });
    }

    await query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "PROJECT_VOTE_REMOVED",
        "project",
        projectId,
        JSON.stringify({
          voteId: result.rows[0].id
        })
      ]
    );

    res.json({
      message: "Vote removed"
    });
  } catch (error) {
    console.error("Remove vote error:", error);

    res.status(500).json({
      message: "Failed to remove vote"
    });
  }
};

const getProjectVotingStatus = async (req, res) => {
  try {
    const { projectId } = req.params;

    const votingState = await getVotingState(projectId);

    if (!votingState) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const voteResult = await query(
      `SELECT COUNT(*)::int AS vote_count
       FROM project_votes
       WHERE project_id = $1`,
      [projectId]
    );

    const userVoteResult = await query(
      `SELECT id
       FROM project_votes
       WHERE project_id = $1
       AND user_id = $2`,
      [projectId, req.user.id]
    );

    const hideResults =
      votingState.hide_voting_results &&
      votingState.votingOpen;

    res.json({
      projectId,
      votingEnabled: votingState.community_voting_enabled,
      votingOpen: votingState.votingOpen,
      votingStart: votingState.voting_start,
      votingEnd: votingState.voting_end,
      hasVoted: userVoteResult.rows.length > 0,
      voteCount: hideResults
        ? null
        : Number(voteResult.rows[0].vote_count)
    });
  } catch (error) {
    console.error("Voting status error:", error);

    res.status(500).json({
      message: "Failed to fetch voting status"
    });
  }
};

const addComment = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        message: "Comment cannot be empty"
      });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({
        message: "Comment cannot exceed 1000 characters"
      });
    }

    const submittedResult = await query(
      `SELECT 1
       FROM submissions
       WHERE project_id = $1
       AND status = 'submitted'
       LIMIT 1`,
      [projectId]
    );

    if (submittedResult.rows.length === 0) {
      return res.status(404).json({
        message: "Public project not found"
      });
    }

    const result = await query(
      `INSERT INTO project_comments
       (project_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING id, project_id, comment, created_at, updated_at`,
      [
        projectId,
        req.user.id,
        comment.trim()
      ]
    );

    await query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "PROJECT_COMMENT_CREATED",
        "project_comment",
        result.rows[0].id,
        JSON.stringify({
          projectId
        })
      ]
    );

    const userResult = await query(
      `SELECT name
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    res.status(201).json({
      message: "Comment added",
      comment: {
        ...result.rows[0],
        userName: userResult.rows[0]?.name || "User"
      }
    });
  } catch (error) {
    console.error("Add comment error:", error);

    res.status(500).json({
      message: "Failed to add comment"
    });
  }
};

const getComments = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await query(
      `SELECT
        pc.id,
        pc.project_id,
        pc.user_id,
        u.name AS user_name,
        pc.comment,
        pc.created_at,
        pc.updated_at
       FROM project_comments pc
       JOIN users u ON u.id = pc.user_id
       WHERE pc.project_id = $1
       ORDER BY pc.created_at DESC`,
      [projectId]
    );

    res.json({
      comments: result.rows
    });
  } catch (error) {
    console.error("Get comments error:", error);

    res.status(500).json({
      message: "Failed to fetch comments"
    });
  }
};

const configureVoting = async (req, res) => {
  try {
    const { eventId } = req.params;

    const {
      enabled,
      votingStart,
      votingEnd,
      hideResults
    } = req.body;

    if (
      votingStart &&
      votingEnd &&
      new Date(votingStart) >= new Date(votingEnd)
    ) {
      return res.status(400).json({
        message: "Voting start must be before voting end"
      });
    }

    const result = await query(
      `UPDATE events
       SET
         community_voting_enabled = COALESCE($1, community_voting_enabled),
         voting_start = COALESCE($2, voting_start),
         voting_end = COALESCE($3, voting_end),
         hide_voting_results = COALESCE($4, hide_voting_results)
       WHERE id = $5
       RETURNING
         id,
         name,
         community_voting_enabled,
         voting_start,
         voting_end,
         hide_voting_results`,
      [
        enabled,
        votingStart || null,
        votingEnd || null,
        hideResults,
        eventId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    await query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "VOTING_CONFIGURED",
        "event",
        eventId,
        JSON.stringify({
          enabled,
          votingStart,
          votingEnd,
          hideResults
        })
      ]
    );

    res.json({
      message: "Voting configuration updated",
      event: result.rows[0]
    });
  } catch (error) {
    console.error("Configure voting error:", error);

    res.status(500).json({
      message: "Failed to configure voting"
    });
  }
};

module.exports = {
  voteForProject,
  removeVote,
  getProjectVotingStatus,
  addComment,
  getComments,
  configureVoting
};