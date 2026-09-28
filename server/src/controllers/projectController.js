const { query, pool } = require("../config/db");

const {
  isDuplicateProject
} = require("../services/duplicateDetectionService");

const getTeamMembership = async (teamId, userId) => {
  const result = await query(
    `SELECT 1
     FROM team_members
     WHERE team_id = $1
     AND user_id = $2`,
    [teamId, userId]
  );

  return result.rows.length > 0;
};

const getTrackForEvent = async (trackId, eventId, client = null) => {
  const database = client || { query };

  const result = await database.query(
    `SELECT id, name, description
     FROM event_tracks
     WHERE id = $1
     AND event_id = $2`,
    [trackId, eventId]
  );

  return result.rows[0] || null;
};

const validateTrackSelection = async (trackId, eventId, client = null) => {
  const database = client || { query };

  const tracksResult = await database.query(
    `SELECT COUNT(*)::int AS count
     FROM event_tracks
     WHERE event_id = $1`,
    [eventId]
  );

  const trackCount = tracksResult.rows[0].count;

  if (trackCount === 0 && !trackId) {
    return {
      valid: true,
      track: null
    };
  }

  if (trackCount > 0 && !trackId) {
    return {
      valid: false,
      message: "A project track is required for this event"
    };
  }

  const track = await getTrackForEvent(trackId, eventId, client);

  if (!track) {
    return {
      valid: false,
      message: "Selected track does not belong to this event"
    };
  }

  return {
    valid: true,
    track
  };
};

const createProject = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      teamId,
      title,
      tagline,
      description,
      repositoryUrl,
      demoUrl,
      trackId
    } = req.body;

    if (!teamId || !title) {
      return res.status(400).json({
        message: "Team ID and project title are required"
      });
    }

    const projectTitle = String(title).trim();

    if (!projectTitle) {
      return res.status(400).json({
        message: "Project title is required"
      });
    }

    const teamResult = await client.query(
      `SELECT
        t.id,
        t.name,
        t.event_id,
        e.name AS event_name,
        e.submission_deadline,
        e.status
       FROM teams t
       JOIN events e ON e.id = t.event_id
       WHERE t.id = $1`,
      [teamId]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({
        message: "Team not found"
      });
    }

    const team = teamResult.rows[0];

    if (team.status === "completed") {
      return res.status(400).json({
        message: "This event has already been completed"
      });
    }

    if (new Date() > new Date(team.submission_deadline)) {
      return res.status(400).json({
        message: "Submission deadline has passed"
      });
    }

    const isMember = await getTeamMembership(teamId, req.user.id);

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this team"
      });
    }

    const trackValidation = await validateTrackSelection(
      trackId,
      team.event_id,
      client
    );

    if (!trackValidation.valid) {
      return res.status(400).json({
        message: trackValidation.message
      });
    }

    const existingProject = await client.query(
      `SELECT id
       FROM projects
       WHERE team_id = $1`,
      [teamId]
    );

    if (existingProject.rows.length > 0) {
      return res.status(409).json({
        message: "This team already has a project"
      });
    }

    const duplicateCheck = await isDuplicateProject({
      eventId: team.event_id,
      title: projectTitle,
      description,
      repositoryUrl
    });

    if (duplicateCheck.duplicate) {
      return res.status(409).json({
        message: "A duplicate project already exists in this event",
        duplicateProject: duplicateCheck.project
      });
    }

    await client.query("BEGIN");

    const projectResult = await client.query(
      `INSERT INTO projects
       (
         team_id,
         track_id,
         title,
         tagline,
         description,
         repository_url,
         demo_url
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        teamId,
        trackId || null,
        projectTitle,
        tagline || null,
        description || null,
        repositoryUrl || null,
        demoUrl || null
      ]
    );

    const project = projectResult.rows[0];

    const submissionResult = await client.query(
      `INSERT INTO submissions
       (project_id, version, status)
       VALUES ($1, 1, 'draft')
       RETURNING *`,
      [project.id]
    );

    await client.query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "PROJECT_CREATED",
        "project",
        project.id,
        JSON.stringify({
          teamId,
          eventId: team.event_id,
          trackId: trackId || null
        })
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Project created",
      project,
      track: trackValidation.track,
      submission: submissionResult.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create project error:", error);

    res.status(500).json({
      message: "Failed to create project"
    });
  } finally {
    client.release();
  }
};

const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    const projectResult = await query(
      `SELECT
        p.id,
        p.team_id,
        p.track_id,
        p.title,
        p.tagline,
        p.description,
        p.repository_url,
        p.demo_url,
        p.created_at,
        p.updated_at,
        t.name AS team_name,
        t.event_id,
        e.name AS event_name,
        e.status AS event_status,
        et.name AS track_name,
        et.description AS track_description
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       JOIN events e ON e.id = t.event_id
       LEFT JOIN event_tracks et ON et.id = p.track_id
       WHERE p.id = $1`,
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const submissionsResult = await query(
      `SELECT
        id,
        version,
        status,
        submitted_at,
        created_at
       FROM submissions
       WHERE project_id = $1
       ORDER BY version DESC`,
      [id]
    );

    res.json({
      project: projectResult.rows[0],
      submissions: submissionsResult.rows
    });
  } catch (error) {
    console.error("Get project error:", error);

    res.status(500).json({
      message: "Failed to fetch project"
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const {
      eventId,
      search,
      sort = "latest",
      limit = 50,
      offset = 0,
      publicOnly = "false"
    } = req.query;

    const params = [];
    const conditions = [];

    if (eventId) {
      params.push(eventId);
      conditions.push(`t.event_id = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      conditions.push(`
        (
          p.title ILIKE $${params.length}
          OR p.tagline ILIKE $${params.length}
          OR p.description ILIKE $${params.length}
          OR t.name ILIKE $${params.length}
          OR et.name ILIKE $${params.length}
        )
      `);
    }

    if (publicOnly === "true") {
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM submissions ps
          WHERE ps.project_id = p.id
          AND ps.status = 'submitted'
        )
      `);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const safeLimit = Math.min(
      Math.max(Number(limit) || 50, 1),
      100
    );

    const safeOffset = Math.max(Number(offset) || 0, 0);

    let orderClause = `
      p.created_at DESC
    `;

    if (sort === "random") {
      orderClause = "RANDOM()";
    }

    if (sort === "title") {
      orderClause = "p.title ASC";
    }

    if (sort === "oldest") {
      orderClause = "p.created_at ASC";
    }

    params.push(safeLimit);
    const limitIndex = params.length;

    params.push(safeOffset);
    const offsetIndex = params.length;

    const result = await query(
      `SELECT
        p.id,
        p.team_id,
        p.track_id,
        p.title,
        p.tagline,
        p.description,
        p.repository_url,
        p.demo_url,
        p.created_at,
        p.updated_at,
        t.name AS team_name,
        t.event_id,
        e.name AS event_name,
        e.status AS event_status,
        et.name AS track_name,
        et.description AS track_description,
        latest_submission.version AS latest_version,
        latest_submission.status AS latest_submission_status,
        latest_submission.submitted_at
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       JOIN events e ON e.id = t.event_id
       LEFT JOIN event_tracks et ON et.id = p.track_id
       LEFT JOIN LATERAL (
         SELECT
           s.version,
           s.status,
           s.submitted_at
         FROM submissions s
         WHERE s.project_id = p.id
         ORDER BY s.version DESC
         LIMIT 1
       ) latest_submission ON true
       ${whereClause}
       ORDER BY ${orderClause}
       LIMIT $${limitIndex}
       OFFSET $${offsetIndex}`,
      params
    );

    res.json({
      projects: result.rows,
      pagination: {
        limit: safeLimit,
        offset: safeOffset,
        count: result.rows.length
      }
    });
  } catch (error) {
    console.error("Get projects error:", error);

    res.status(500).json({
      message: "Failed to fetch projects"
    });
  }
};

const getPublicProject = async (req, res) => {
  try {
    const { id } = req.params;

    const projectResult = await query(
      `SELECT
        p.id,
        p.title,
        p.tagline,
        p.description,
        p.repository_url,
        p.demo_url,
        p.created_at,
        p.updated_at,
        p.track_id,
        et.name AS track_name,
        et.description AS track_description,
        t.id AS team_id,
        t.name AS team_name,
        e.id AS event_id,
        e.name AS event_name,
        e.description AS event_description,
        latest_submission.version AS latest_version,
        latest_submission.submitted_at
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       JOIN events e ON e.id = t.event_id
       LEFT JOIN event_tracks et ON et.id = p.track_id
       JOIN LATERAL (
         SELECT
           s.version,
           s.status,
           s.submitted_at
         FROM submissions s
         WHERE s.project_id = p.id
         AND s.status = 'submitted'
         ORDER BY s.version DESC
         LIMIT 1
       ) latest_submission ON true
       WHERE p.id = $1`,
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        message: "Public project not found"
      });
    }

    res.json({
      project: projectResult.rows[0]
    });
  } catch (error) {
    console.error("Get public project error:", error);

    res.status(500).json({
      message: "Failed to fetch public project"
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      tagline,
      description,
      repositoryUrl,
      demoUrl,
      trackId
    } = req.body;

    const projectResult = await query(
      `SELECT
        p.id,
        p.team_id,
        p.track_id,
        t.event_id,
        e.submission_deadline,
        e.status
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       JOIN events e ON e.id = t.event_id
       WHERE p.id = $1`,
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const project = projectResult.rows[0];

    if (project.status === "completed") {
      return res.status(400).json({
        message: "This event has already been completed"
      });
    }

    if (new Date() > new Date(project.submission_deadline)) {
      return res.status(400).json({
        message: "Submission deadline has passed"
      });
    }

    const isMember = await getTeamMembership(
      project.team_id,
      req.user.id
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project team"
      });
    }

    let validatedTrackId = project.track_id;

    if (Object.prototype.hasOwnProperty.call(req.body, "trackId")) {
      const trackValidation = await validateTrackSelection(
        trackId,
        project.event_id
      );

      if (!trackValidation.valid) {
        return res.status(400).json({
          message: trackValidation.message
        });
      }

      validatedTrackId = trackId || null;
    }

    const result = await query(
      `UPDATE projects
       SET
         title = COALESCE($1, title),
         tagline = COALESCE($2, tagline),
         description = COALESCE($3, description),
         repository_url = COALESCE($4, repository_url),
         demo_url = COALESCE($5, demo_url),
         track_id = $6,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        title ? title.trim() : null,
        tagline,
        description,
        repositoryUrl,
        demoUrl,
        validatedTrackId,
        id
      ]
    );

    await query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "PROJECT_UPDATED",
        "project",
        id,
        JSON.stringify({
          fields: Object.keys(req.body),
          trackId: validatedTrackId
        })
      ]
    );

    res.json({
      message: "Project updated",
      project: result.rows[0]
    });
  } catch (error) {
    console.error("Update project error:", error);

    res.status(500).json({
      message: "Failed to update project"
    });
  }
};

const createSubmissionVersion = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const projectResult = await client.query(
      `SELECT
        p.id,
        p.team_id,
        e.submission_deadline,
        e.status
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       JOIN events e ON e.id = t.event_id
       WHERE p.id = $1`,
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const project = projectResult.rows[0];

    if (project.status === "completed") {
      return res.status(400).json({
        message: "Cannot create a submission version for a completed event"
      });
    }

    if (new Date() > new Date(project.submission_deadline)) {
      return res.status(400).json({
        message: "Submission deadline has passed"
      });
    }

    const isMember = await getTeamMembership(
      project.team_id,
      req.user.id
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project team"
      });
    }

    const latestResult = await client.query(
      `SELECT version, status
       FROM submissions
       WHERE project_id = $1
       ORDER BY version DESC
       LIMIT 1`,
      [id]
    );

    const latestSubmission = latestResult.rows[0];

    if (latestSubmission?.status === "draft") {
      return res.status(400).json({
        message: "A draft submission version already exists"
      });
    }

    const nextVersion = latestSubmission
      ? Number(latestSubmission.version) + 1
      : 1;

    await client.query("BEGIN");

    const submissionResult = await client.query(
      `INSERT INTO submissions
       (project_id, version, status)
       VALUES ($1, $2, 'draft')
       RETURNING *`,
      [id, nextVersion]
    );

    await client.query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "SUBMISSION_VERSION_CREATED",
        "submission",
        submissionResult.rows[0].id,
        JSON.stringify({
          projectId: id,
          version: nextVersion
        })
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Submission version created",
      submission: submissionResult.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create submission version error:", error);

    res.status(500).json({
      message: "Failed to create submission version"
    });
  } finally {
    client.release();
  }
};

const submitProject = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const projectResult = await client.query(
      `SELECT
        p.id,
        p.team_id,
        p.track_id,
        e.id AS event_id,
        e.submission_deadline,
        e.status
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       JOIN events e ON e.id = t.event_id
       WHERE p.id = $1`,
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const project = projectResult.rows[0];

    if (new Date() > new Date(project.submission_deadline)) {
      return res.status(400).json({
        message: "Submission deadline has passed"
      });
    }

    const isMember = await getTeamMembership(
      project.team_id,
      req.user.id
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project team"
      });
    }

    const trackValidation = await validateTrackSelection(
      project.track_id,
      project.event_id,
      client
    );

    if (!trackValidation.valid) {
      return res.status(400).json({
        message: trackValidation.message
      });
    }

    const latestResult = await client.query(
      `SELECT *
       FROM submissions
       WHERE project_id = $1
       ORDER BY version DESC
       LIMIT 1`,
      [id]
    );

    if (latestResult.rows.length === 0) {
      return res.status(400).json({
        message: "No submission version exists"
      });
    }

    const latest = latestResult.rows[0];

    if (latest.status === "submitted") {
      return res.status(400).json({
        message: "Latest submission is already submitted"
      });
    }

    await client.query("BEGIN");

    const submissionResult = await client.query(
      `UPDATE submissions
       SET
         status = 'submitted',
         submitted_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [latest.id]
    );

    await client.query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "PROJECT_SUBMITTED",
        "submission",
        latest.id,
        JSON.stringify({
          projectId: id,
          eventId: project.event_id,
          trackId: project.track_id,
          version: latest.version
        })
      ]
    );

    await client.query("COMMIT");

    res.json({
      message: "Project submitted successfully",
      submission: submissionResult.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Submit project error:", error);

    res.status(500).json({
      message: "Failed to submit project"
    });
  } finally {
    client.release();
  }
};

const getProjectSubmissions = async (req, res) => {
  try {
    const { id } = req.params;

    const projectResult = await query(
      `SELECT
        p.id,
        p.team_id,
        t.event_id,
        e.submission_deadline
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       JOIN events e ON e.id = t.event_id
       WHERE p.id = $1`,
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const result = await query(
      `SELECT
        id,
        version,
        status,
        submitted_at,
        created_at,
        CASE
          WHEN status = 'submitted' THEN true
          ELSE false
        END AS is_submitted
       FROM submissions
       WHERE project_id = $1
       ORDER BY version DESC`,
      [id]
    );

    const latestSubmitted = result.rows.find(
      (submission) => submission.status === "submitted"
    );

    res.json({
      projectId: id,
      submissionDeadline: projectResult.rows[0].submission_deadline,
      latestSubmittedVersion: latestSubmitted
        ? latestSubmitted.version
        : null,
      submissions: result.rows
    });
  } catch (error) {
    console.error("Get project submissions error:", error);

    res.status(500).json({
      message: "Failed to fetch project submissions"
    });
  }
};

module.exports = {
  createProject,
  getProject,
  getProjects,
  getPublicProject,
  updateProject,
  createSubmissionVersion,
  submitProject,
  getProjectSubmissions
};