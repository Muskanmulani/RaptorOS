const { query, pool } = require("../config/db");

const createInvitation = async (req, res) => {
  try {
    const { eventId, judgeId } = req.body;

    if (!eventId || !judgeId) {
      return res.status(400).json({
        message: "Event ID and judge ID are required"
      });
    }

    const eventResult = await query(
      `SELECT id, name, status
       FROM events
       WHERE id = $1`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const judgeResult = await query(
      `SELECT
        j.id,
        j.user_id,
        u.name,
        u.email
       FROM judges j
       JOIN users u ON u.id = j.user_id
       WHERE j.id = $1`,
      [judgeId]
    );

    if (judgeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Judge not found"
      });
    }

    const existingInvitation = await query(
      `SELECT id, status
       FROM judge_invitations
       WHERE event_id = $1
       AND judge_id = $2`,
      [eventId, judgeId]
    );

    if (existingInvitation.rows.length > 0) {
      return res.status(409).json({
        message: "Judge has already been invited to this event",
        invitation: existingInvitation.rows[0]
      });
    }

    const result = await query(
      `INSERT INTO judge_invitations
       (event_id, judge_id)
       VALUES ($1, $2)
       RETURNING *`,
      [eventId, judgeId]
    );

    await query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "JUDGE_INVITED",
        "judge_invitation",
        result.rows[0].id,
        JSON.stringify({
          eventId,
          judgeId
        })
      ]
    );

    res.status(201).json({
      message: "Judge invitation created",
      invitation: result.rows[0],
      judge: judgeResult.rows[0]
    });
  } catch (error) {
    console.error("Create judge invitation error:", error);

    res.status(500).json({
      message: "Failed to create judge invitation"
    });
  }
};

const getEventInvitations = async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await query(
      `SELECT
        ji.id,
        ji.event_id,
        ji.judge_id,
        u.name AS judge_name,
        u.email AS judge_email,
        ji.status,
        ji.invited_at,
        ji.responded_at
       FROM judge_invitations ji
       JOIN judges j ON j.id = ji.judge_id
       JOIN users u ON u.id = j.user_id
       WHERE ji.event_id = $1
       ORDER BY ji.invited_at DESC`,
      [eventId]
    );

    res.json({
      eventId,
      invitations: result.rows
    });
  } catch (error) {
    console.error("Get event invitations error:", error);

    res.status(500).json({
      message: "Failed to fetch judge invitations"
    });
  }
};

const getMyInvitations = async (req, res) => {
  try {
    const result = await query(
      `SELECT
        ji.id,
        ji.event_id,
        e.name AS event_name,
        e.description AS event_description,
        ji.status,
        ji.invited_at,
        ji.responded_at
       FROM judge_invitations ji
       JOIN judges j ON j.id = ji.judge_id
       JOIN events e ON e.id = ji.event_id
       WHERE j.user_id = $1
       ORDER BY ji.invited_at DESC`,
      [req.user.id]
    );

    res.json({
      invitations: result.rows
    });
  } catch (error) {
    console.error("Get my invitations error:", error);

    res.status(500).json({
      message: "Failed to fetch invitations"
    });
  }
};

const respondToInvitation = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({
        message: "Status must be accepted or declined"
      });
    }

    const invitationResult = await client.query(
      `SELECT
        ji.id,
        ji.event_id,
        ji.judge_id,
        ji.status,
        j.user_id
       FROM judge_invitations ji
       JOIN judges j ON j.id = ji.judge_id
       WHERE ji.id = $1`,
      [id]
    );

    if (invitationResult.rows.length === 0) {
      return res.status(404).json({
        message: "Invitation not found"
      });
    }

    const invitation = invitationResult.rows[0];

    if (invitation.user_id !== req.user.id) {
      return res.status(403).json({
        message: "You can only respond to your own invitations"
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        message: "This invitation has already been answered"
      });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE judge_invitations
       SET
         status = $1,
         responded_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    await client.query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        `JUDGE_INVITATION_${status.toUpperCase()}`,
        "judge_invitation",
        id,
        JSON.stringify({
          eventId: invitation.event_id
        })
      ]
    );

    await client.query("COMMIT");

    res.json({
      message: `Judge invitation ${status}`,
      invitation: result.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Respond to invitation error:", error);

    res.status(500).json({
      message: "Failed to respond to invitation"
    });
  } finally {
    client.release();
  }
};

module.exports = {
  createInvitation,
  getEventInvitations,
  getMyInvitations,
  respondToInvitation
};