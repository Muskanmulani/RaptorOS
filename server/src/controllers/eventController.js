const { pool, query } = require("../config/db");

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeTracks = (tracks) => {
  if (!Array.isArray(tracks)) {
    return [];
  }

  const seen = new Set();

  return tracks
    .map((track) => ({
      name: String(track?.name || "").trim(),
      description: track?.description
        ? String(track.description).trim()
        : null
    }))
    .filter((track) => track.name)
    .filter((track) => {
      const key = track.name.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
};

const normalizePrizes = (prizes) => {
  if (!Array.isArray(prizes)) {
    return [];
  }

  const positions = new Set();

  return prizes
    .map((prize) => {
      const rawPosition = prize?.position;

      const position =
        rawPosition === null ||
        rawPosition === undefined ||
        rawPosition === ""
          ? null
          : Number(rawPosition);

      const rawAmount = prize?.amount;

      const amount =
        rawAmount === null ||
        rawAmount === undefined ||
        rawAmount === ""
          ? null
          : Number(rawAmount);

      return {
        position,
        name: String(prize?.name || "").trim(),
        description: prize?.description
          ? String(prize.description).trim()
          : null,
        amount
      };
    })
    .filter((prize) => prize.name);
};

const validatePrizes = (prizes) => {
  for (const prize of prizes) {
    if (
      prize.position !== null &&
      (!Number.isInteger(prize.position) || prize.position < 1)
    ) {
      return "Prize position must be a positive integer";
    }

    if (
      prize.amount !== null &&
      (!Number.isFinite(prize.amount) || prize.amount < 0)
    ) {
      return "Prize amount must be a non-negative number";
    }
  }

  const positions = prizes
    .map((prize) => prize.position)
    .filter((position) => position !== null);

  if (new Set(positions).size !== positions.length) {
    return "Prize positions must be unique";
  }

  return null;
};

const validateEventDates = (start, end, deadline) => {
  if (!start || !end || !deadline) {
    return "Invalid event date";
  }

  if (start >= end) {
    return "Event start must be before event end";
  }

  if (deadline < start) {
    return "Submission deadline cannot be before event start";
  }

  if (deadline > end) {
    return "Submission deadline cannot be after event end";
  }

  return null;
};

const createEvent = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      name,
      description,
      start_date,
      end_date,
      submission_deadline,
      status = "draft",
      tracks = [],
      prizes = []
    } = req.body;

    const eventName = String(name || "").trim();

    if (!eventName) {
      return res.status(400).json({
        message: "Event name is required"
      });
    }

    const start = parseDate(start_date);
    const end = parseDate(end_date);
    const deadline = parseDate(submission_deadline);

    const dateError = validateEventDates(start, end, deadline);

    if (dateError) {
      return res.status(400).json({
        message: dateError
      });
    }

    const allowedStatuses = [
      "draft",
      "active",
      "judging",
      "completed"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid event status"
      });
    }

    const normalizedTracks = normalizeTracks(tracks);
    const normalizedPrizes = normalizePrizes(prizes);

    if (Array.isArray(tracks) && normalizedTracks.length !== tracks.length) {
      return res.status(400).json({
        message: "Every track must have a unique name"
      });
    }

    if (Array.isArray(prizes) && normalizedPrizes.length !== prizes.length) {
      return res.status(400).json({
        message: "Every prize must have a name"
      });
    }

    const prizeError = validatePrizes(normalizedPrizes);

    if (prizeError) {
      return res.status(400).json({
        message: prizeError
      });
    }

    await client.query("BEGIN");

    const eventResult = await client.query(
      `INSERT INTO events
       (
         name,
         description,
         start_date,
         end_date,
         submission_deadline,
         status,
         created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        eventName,
        description ? String(description).trim() : null,
        start,
        end,
        deadline,
        status,
        req.user.id
      ]
    );

    const event = eventResult.rows[0];

    const createdTracks = [];

    for (const track of normalizedTracks) {
      const trackResult = await client.query(
        `INSERT INTO event_tracks
         (event_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          event.id,
          track.name,
          track.description
        ]
      );

      createdTracks.push(trackResult.rows[0]);
    }

    const createdPrizes = [];

    for (const prize of normalizedPrizes) {
      const prizeResult = await client.query(
        `INSERT INTO event_prizes
         (event_id, position, name, description, amount)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          event.id,
          prize.position,
          prize.name,
          prize.description,
          prize.amount
        ]
      );

      createdPrizes.push(prizeResult.rows[0]);
    }

    await client.query(
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
          status: event.status,
          tracks: createdTracks.length,
          prizes: createdPrizes.length
        })
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Event created successfully",
      event: {
        ...event,
        tracks: createdTracks,
        prizes: createdPrizes
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create event error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "An event with the same configuration already exists"
      });
    }

    res.status(500).json({
      message: "Failed to create event"
    });
  } finally {
    client.release();
  }
};

const getEvents = async (req, res) => {
  try {
    const result = await query(
      `SELECT
        e.*,
        u.name AS organizer_name,
        COUNT(DISTINCT t.id)::int AS team_count,
        COUNT(DISTINCT p.id)::int AS project_count,
        COUNT(DISTINCT et.id)::int AS track_count,
        COUNT(DISTINCT ep.id)::int AS prize_count
       FROM events e
       JOIN users u ON u.id = e.created_by
       LEFT JOIN teams t ON t.event_id = e.id
       LEFT JOIN projects p ON p.team_id = t.id
       LEFT JOIN event_tracks et ON et.event_id = e.id
       LEFT JOIN event_prizes ep ON ep.event_id = e.id
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

    const eventResult = await query(
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

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const tracksResult = await query(
      `SELECT *
       FROM event_tracks
       WHERE event_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    const prizesResult = await query(
      `SELECT *
       FROM event_prizes
       WHERE event_id = $1
       ORDER BY
         CASE WHEN position IS NULL THEN 1 ELSE 0 END,
         position ASC,
         created_at ASC`,
      [id]
    );

    res.json({
      event: {
        ...eventResult.rows[0],
        tracks: tracksResult.rows,
        prizes: prizesResult.rows
      }
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

    const eventName = String(name || "").trim();

    if (!eventName) {
      return res.status(400).json({
        message: "Event name is required"
      });
    }

    const start = parseDate(start_date);
    const end = parseDate(end_date);
    const deadline = parseDate(submission_deadline);

    const dateError = validateEventDates(start, end, deadline);

    if (dateError) {
      return res.status(400).json({
        message: dateError
      });
    }

    const allowedStatuses = [
      "draft",
      "active",
      "judging",
      "completed"
    ];

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
        eventName,
        description ? String(description).trim() : null,
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