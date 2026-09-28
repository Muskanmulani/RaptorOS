
const { query } = require("../config/db");

const createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      start_date,
      end_date,
      submission_deadline,
      status = "draft"
    } = req.body;

    if (!name || !start_date || !end_date || !submission_deadline) {
      return res.status(400).json({
        message:
          "Name, start date, end date and submission deadline are required"
      });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    const deadline = new Date(submission_deadline);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      Number.isNaN(deadline.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid event date"
      });
    }

    if (start >= end) {
      return res.status(400).json({
        message: "Event start must be before event end"
      });
    }

    if (deadline > end) {
      return res.status(400).json({
        message: "Submission deadline cannot be after event end"
      });
    }

    const allowedStatuses = ["draft", "active", "judging", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid event status"
      });
    }

    const result = await query(
      `INSERT INTO events
       (name, description, start_date, end_date, submission_deadline, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name.trim(),
        description || null,
        start,
        end,
        deadline,
        status,
        req.user.id
      ]
    );

    const event = result.rows[0];

    await query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "EVENT_CREATED",
        "event",
        event.id,
        JSON.stringify({
          name: event.name,
          status: event.status
        })
      ]
    );

    res.status(201).json({
      message: "Event created successfully",
      event
    });
  } catch (error) {
    console.error("Create event error:", error);

    res.status(500).json({
      message: "Failed to create event"
    });
  }
};

const getEvents = async (req, res) => {
  try {
    const result = await query(
      `SELECT
        e.*,
        u.name AS organizer_name,
        COUNT(DISTINCT t.id)::int AS team_count,
        COUNT(DISTINCT p.id)::int AS project_count
       FROM events e
       JOIN users u ON u.id = e.created_by
       LEFT JOIN teams t ON t.event_id = e.id
       LEFT JOIN projects p ON p.team_id = t.id
       GROUP BY e.id, u.name
       ORDER BY e.created_at DESC`
    );

    res.json({
      events: result.rows
    });
  } catch (error) {
    console.error("Get events error:", error);

    res.status(500).json({
      message: "Failed to fetch events"
    });
  }
};

const getEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
        e.*,
        u.name AS organizer_name,
        COUNT(DISTINCT t.id)::int AS team_count,
        COUNT(DISTINCT p.id)::int AS project_count
       FROM events e
       JOIN users u ON u.id = e.created_by
       LEFT JOIN teams t ON t.event_id = e.id
       LEFT JOIN projects p ON p.team_id = t.id
       WHERE e.id = $1
       GROUP BY e.id, u.name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    res.json({
      event: result.rows[0]
    });
  } catch (error) {
    console.error("Get event error:", error);

    res.status(500).json({
      message: "Failed to fetch event"
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query(
      "SELECT * FROM events WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const current = existing.rows[0];

    if (
      req.user.role !== "admin" &&
      current.created_by !== req.user.id
    ) {
      return res.status(403).json({
        message: "You cannot modify this event"
      });
    }

    const {
      name = current.name,
      description = current.description,
      start_date = current.start_date,
      end_date = current.end_date,
      submission_deadline = current.submission_deadline,
      status = current.status
    } = req.body;

    const start = new Date(start_date);
    const end = new Date(end_date);
    const deadline = new Date(submission_deadline);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      Number.isNaN(deadline.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid event date"
      });
    }

    if (start >= end) {
      return res.status(400).json({
        message: "Event start must be before event end"
      });
    }

    if (deadline > end) {
      return res.status(400).json({
        message: "Submission deadline cannot be after event end"
      });
    }

    const allowedStatuses = ["draft", "active", "judging", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid event status"
      });
    }

    const result = await query(
      `UPDATE events
       SET name = $1,
           description = $2,
           start_date = $3,
           end_date = $4,
           submission_deadline = $5,
           status = $6
       WHERE id = $7
       RETURNING *`,
      [
        name.trim(),
        description || null,
        start,
        end,
        deadline,
        status,
        id
      ]
    );

    const event = result.rows[0];

    await query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "EVENT_UPDATED",
        "event",
        id,
        JSON.stringify({
          name: event.name,
          status: event.status
        })
      ]
    );

    res.json({
      message: "Event updated successfully",
      event
    });
  } catch (error) {
    console.error("Update event error:", error);

    res.status(500).json({
      message: "Failed to update event"
    });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent
};
