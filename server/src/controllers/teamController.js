
const crypto = require("crypto");
const { query } = require("../config/db");

const createTeam = async (req, res) => {
  try {
    const { event_id, name } = req.body;

    if (!event_id || !name) {
      return res.status(400).json({
        message: "Event ID and team name are required"
      });
    }

    const event = await query(
      "SELECT id, status FROM events WHERE id = $1",
      [event_id]
    );

    if (event.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    if (event.rows[0].status === "completed") {
      return res.status(400).json({
        message: "Teams cannot be created after the event is completed"
      });
    }

    const existingMembership = await query(
      `SELECT tm.team_id
       FROM team_members tm
       JOIN teams t ON t.id = tm.team_id
       WHERE tm.user_id = $1
       AND t.event_id = $2`,
      [req.user.id, event_id]
    );

    if (existingMembership.rows.length > 0) {
      return res.status(409).json({
        message: "You are already part of a team in this event"
      });
    }

    const inviteCode = crypto.randomBytes(6).toString("hex");

    const result = await query(
      `INSERT INTO teams (event_id, name, invite_code)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [event_id, name.trim(), inviteCode]
    );

    const team = result.rows[0];

    await query(
      `INSERT INTO team_members (team_id, user_id)
       VALUES ($1, $2)`,
      [team.id, req.user.id]
    );

    await query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "TEAM_CREATED",
        "team",
        team.id,
        JSON.stringify({
          event_id,
          team_name: team.name
        })
      ]
    );

    res.status(201).json({
      message: "Team created successfully",
      team
    });
  } catch (error) {
    console.error("Create team error:", error);

    res.status(500).json({
      message: "Failed to create team"
    });
  }
};

const getTeamsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await query(
      `SELECT
        t.id,
        t.name,
        t.invite_code,
        t.created_at,
        COUNT(tm.user_id)::int AS member_count
       FROM teams t
       LEFT JOIN team_members tm ON tm.team_id = t.id
       WHERE t.event_id = $1
       GROUP BY t.id
       ORDER BY t.created_at ASC`,
      [eventId]
    );

    res.json({
      teams: result.rows
    });
  } catch (error) {
    console.error("Get teams error:", error);

    res.status(500).json({
      message: "Failed to fetch teams"
    });
  }
};

const getTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const teamResult = await query(
      `SELECT
        t.id,
        t.event_id,
        t.name,
        t.invite_code,
        t.created_at
       FROM teams t
       WHERE t.id = $1`,
      [id]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({
        message: "Team not found"
      });
    }

    const membersResult = await query(
      `SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        tm.joined_at
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at ASC`,
      [id]
    );

    res.json({
      team: teamResult.rows[0],
      members: membersResult.rows
    });
  } catch (error) {
    console.error("Get team error:", error);

    res.status(500).json({
      message: "Failed to fetch team"
    });
  }
};

const joinTeam = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({
        message: "Invite code is required"
      });
    }

    const teamResult = await query(
      `SELECT
        t.id,
        t.event_id,
        t.name,
        e.status
       FROM teams t
       JOIN events e ON e.id = t.event_id
       WHERE t.invite_code = $1`,
      [inviteCode.trim()]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({
        message: "Invalid invite code"
      });
    }

    const team = teamResult.rows[0];

    if (team.status === "completed") {
      return res.status(400).json({
        message: "This event is already completed"
      });
    }

    const existingMembership = await query(
      `SELECT tm.team_id
       FROM team_members tm
       JOIN teams t ON t.id = tm.team_id
       WHERE tm.user_id = $1
       AND t.event_id = $2`,
      [req.user.id, team.event_id]
    );

    if (existingMembership.rows.length > 0) {
      return res.status(409).json({
        message: "You are already part of a team in this event"
      });
    }

    await query(
      `INSERT INTO team_members (team_id, user_id)
       VALUES ($1, $2)`,
      [team.id, req.user.id]
    );

    await query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "TEAM_JOINED",
        "team",
        team.id,
        JSON.stringify({
          event_id: team.event_id
        })
      ]
    );

    res.json({
      message: "Joined team successfully",
      team: {
        id: team.id,
        name: team.name,
        event_id: team.event_id
      }
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "You are already a member of this team"
      });
    }

    console.error("Join team error:", error);

    res.status(500).json({
      message: "Failed to join team"
    });
  }
};

const getMyTeams = async (req, res) => {
  try {
    const result = await query(
      `SELECT
        t.id,
        t.event_id,
        t.name,
        t.invite_code,
        e.name AS event_name,
        e.status AS event_status
       FROM team_members tm
       JOIN teams t ON t.id = tm.team_id
       JOIN events e ON e.id = t.event_id
       WHERE tm.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    res.json({
      teams: result.rows
    });
  } catch (error) {
    console.error("Get my teams error:", error);

    res.status(500).json({
      message: "Failed to fetch your teams"
    });
  }
};

module.exports = {
  createTeam,
  getTeamsByEvent,
  getTeam,
  joinTeam,
  getMyTeams
};
