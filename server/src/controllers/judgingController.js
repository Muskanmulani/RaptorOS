const { calculateNormalization } = require("../services/normalizationService");
const { query, pool } = require("../config/db");
const { generateResultsCsv } = require("../services/csvService");
const { simulateJudging } = require("../services/judgingSimulatorService");

const createJudge = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required"
      });
    }

    const userResult = await query(
      `SELECT id, name, email, role
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const user = userResult.rows[0];

    if (user.role !== "judge") {
      return res.status(400).json({
        message: "User must have judge role"
      });
    }

    const existingJudge = await query(
      "SELECT id FROM judges WHERE user_id = $1",
      [userId]
    );

    if (existingJudge.rows.length > 0) {
      return res.status(409).json({
        message: "Judge profile already exists"
      });
    }

    const result = await query(
      `INSERT INTO judges (user_id)
       VALUES ($1)
       RETURNING id, user_id, created_at`,
      [userId]
    );

    await query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "JUDGE_CREATED",
        "judge",
        result.rows[0].id,
        JSON.stringify({ judgeUserId: userId })
      ]
    );

    res.status(201).json({
      message: "Judge profile created",
      judge: {
        ...result.rows[0],
        user
      }
    });
  } catch (error) {
    console.error("Create judge error:", error);

    res.status(500).json({
      message: "Failed to create judge"
    });
  }
};

const getJudges = async (req, res) => {
  try {
    const result = await query(
      `SELECT
        j.id,
        j.user_id,
        u.name,
        u.email,
        j.created_at,
        COUNT(DISTINCT ja.id)::int AS assigned_projects,
        COUNT(DISTINCT CASE WHEN jd.id IS NOT NULL THEN jd.id END)::int AS completed_judgments
       FROM judges j
       JOIN users u ON u.id = j.user_id
       LEFT JOIN judge_assignments ja ON ja.judge_id = j.id
       LEFT JOIN judgments jd
         ON jd.judge_id = j.id
         AND jd.project_id = ja.project_id
       GROUP BY j.id, j.user_id, u.name, u.email, j.created_at
       ORDER BY u.name`,
      []
    );

    res.json({
      judges: result.rows
    });
  } catch (error) {
    console.error("Get judges error:", error);

    res.status(500).json({
      message: "Failed to fetch judges"
    });
  }
};

const createRubric = async (req, res) => {
  const client = await pool.connect();

  try {
    const { eventId, name, criteria } = req.body;

    if (!eventId || !name || !Array.isArray(criteria) || criteria.length === 0) {
      return res.status(400).json({
        message: "Event ID, rubric name and criteria are required"
      });
    }

    const eventResult = await client.query(
      "SELECT id FROM events WHERE id = $1",
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    let totalWeight = 0;

    for (const criterion of criteria) {
      const weight = Number(criterion.weight);
      const maxScore = Number(
        criterion.maxScore === undefined ? 10 : criterion.maxScore
      );

      if (
        !criterion.name ||
        !Number.isFinite(weight) ||
        !Number.isFinite(maxScore) ||
        weight <= 0 ||
        maxScore <= 0
      ) {
        return res.status(400).json({
          message: "Invalid rubric criteria"
        });
      }

      totalWeight += weight;
    }

    if (Math.abs(totalWeight - 100) > 0.001) {
      return res.status(400).json({
        message: "Rubric criteria weights must total 100"
      });
    }

    await client.query("BEGIN");

    const rubricResult = await client.query(
      `INSERT INTO rubrics (event_id, name)
       VALUES ($1, $2)
       RETURNING id, event_id, name, created_at`,
      [eventId, name.trim()]
    );

    const rubric = rubricResult.rows[0];

    const createdCriteria = [];

    for (const criterion of criteria) {
      const criterionResult = await client.query(
        `INSERT INTO rubric_criteria
         (rubric_id, name, description, weight, max_score)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, rubric_id, name, description, weight, max_score`,
        [
          rubric.id,
          criterion.name.trim(),
          criterion.description || null,
          Number(criterion.weight),
          Number(
            criterion.maxScore === undefined ? 10 : criterion.maxScore
          )
        ]
      );

      createdCriteria.push(criterionResult.rows[0]);
    }

    await client.query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "RUBRIC_CREATED",
        "rubric",
        rubric.id,
        JSON.stringify({
          eventId,
          criteriaCount: createdCriteria.length
        })
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Rubric created",
      rubric: {
        ...rubric,
        criteria: createdCriteria
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create rubric error:", error);

    res.status(500).json({
      message: "Failed to create rubric"
    });
  } finally {
    client.release();
  }
};

const getEventRubrics = async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await query(
      `SELECT
        r.id,
        r.event_id,
        r.name,
        r.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', rc.id,
              'name', rc.name,
              'description', rc.description,
              'weight', rc.weight,
              'maxScore', rc.max_score
            )
            ORDER BY rc.id
          ) FILTER (WHERE rc.id IS NOT NULL),
          '[]'
        ) AS criteria
       FROM rubrics r
       LEFT JOIN rubric_criteria rc ON rc.rubric_id = r.id
       WHERE r.event_id = $1
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
      [eventId]
    );

    res.json({
      rubrics: result.rows
    });
  } catch (error) {
    console.error("Get rubrics error:", error);

    res.status(500).json({
      message: "Failed to fetch rubrics"
    });
  }
};

const assignJudges = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      eventId,
      judgeId,
      projectIds
    } = req.body;

    if (
      !eventId ||
      !judgeId ||
      !Array.isArray(projectIds) ||
      projectIds.length === 0
    ) {
      return res.status(400).json({
        message: "Event ID, judge ID and project IDs are required"
      });
    }

    const judgeResult = await client.query(
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

    const judge = judgeResult.rows[0];

    const invitationResult = await client.query(
      `SELECT id, status
       FROM judge_invitations
       WHERE event_id = $1
       AND judge_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [eventId, judgeId]
    );

    if (invitationResult.rows.length === 0) {
      return res.status(400).json({
        message: "Judge has not been invited to this event"
      });
    }

    if (invitationResult.rows[0].status !== "accepted") {
      return res.status(400).json({
        message: "Judge must accept the invitation before assignment"
      });
    }

    const eventResult = await client.query(
      `SELECT id, status, judging_end
       FROM events
       WHERE id = $1`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const event = eventResult.rows[0];

    if (event.status === "completed") {
      return res.status(400).json({
        message: "Event has already been completed"
      });
    }

    if (
      event.judging_end &&
      new Date() > new Date(event.judging_end)
    ) {
      return res.status(400).json({
        message: "Judging period has ended"
      });
    }

    const uniqueProjectIds = [...new Set(projectIds)];

    const projectResult = await client.query(
      `SELECT
        p.id,
        p.title,
        t.id AS team_id
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       WHERE t.event_id = $1
       AND p.id = ANY($2::uuid[])`,
      [eventId, uniqueProjectIds]
    );

    if (projectResult.rows.length !== uniqueProjectIds.length) {
      return res.status(400).json({
        message: "One or more projects do not belong to this event"
      });
    }

    const conflictResult = await client.query(
      `SELECT p.id, p.title
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       JOIN team_members tm ON tm.team_id = t.id
       WHERE p.id = ANY($1::uuid[])
       AND tm.user_id = $2`,
      [uniqueProjectIds, judge.user_id]
    );

    if (conflictResult.rows.length > 0) {
      return res.status(409).json({
        message: "Judge cannot be assigned to their own team project",
        conflicts: conflictResult.rows
      });
    }

    await client.query("BEGIN");

    const assignments = [];

    for (const projectId of uniqueProjectIds) {
      const existingAssignment = await client.query(
        `SELECT id
         FROM judge_assignments
         WHERE judge_id = $1
         AND project_id = $2`,
        [judgeId, projectId]
      );

      if (existingAssignment.rows.length > 0) {
        continue;
      }

      const result = await client.query(
        `INSERT INTO judge_assignments
         (judge_id, project_id)
         VALUES ($1, $2)
         RETURNING *`,
        [judgeId, projectId]
      );

      assignments.push(result.rows[0]);

      await client.query(
        `INSERT INTO audit_logs
         (user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id,
          "JUDGE_ASSIGNED",
          "judge_assignment",
          result.rows[0].id,
          JSON.stringify({
            eventId,
            judgeId,
            projectId
          })
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Judge assignments created",
      judgeId,
      eventId,
      assignmentCount: assignments.length,
      assignments
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Assign judges error:", error);

    res.status(500).json({
      message: "Failed to assign judge"
    });
  } finally {
    client.release();
  }
};

const getAssignments = async (req, res) => {
  try {
    const { eventId } = req.query;

    const params = [];
    let eventFilter = "";

    if (eventId) {
      params.push(eventId);
      eventFilter = `WHERE t.event_id = $1`;
    }

    const result = await query(
      `SELECT
        ja.id,
        ja.judge_id,
        j.user_id,
        ju.name AS judge_name,
        ju.email AS judge_email,
        ja.project_id,
        p.title AS project_title,
        t.name AS team_name,
        t.event_id,
        ja.assigned_at,
        CASE
          WHEN jd.id IS NULL THEN 'pending'
          ELSE 'completed'
        END AS status
       FROM judge_assignments ja
       JOIN judges j ON j.id = ja.judge_id
       JOIN users ju ON ju.id = j.user_id
       JOIN projects p ON p.id = ja.project_id
       JOIN teams t ON t.id = p.team_id
       LEFT JOIN judgments jd
         ON jd.judge_id = ja.judge_id
         AND jd.project_id = ja.project_id
       ${eventFilter}
       ORDER BY t.event_id, ju.name, p.title`,
      params
    );

    res.json({
      assignments: result.rows
    });
  } catch (error) {
    console.error("Get assignments error:", error);

    res.status(500).json({
      message: "Failed to fetch assignments"
    });
  }
};

const getMyAssignments = async (req, res) => {
  try {
    const judgeResult = await query(
      "SELECT id FROM judges WHERE user_id = $1",
      [req.user.id]
    );

    if (judgeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Judge profile not found"
      });
    }

    const judgeId = judgeResult.rows[0].id;

    const result = await query(
      `SELECT
        ja.id,
        ja.project_id,
        p.title,
        p.tagline,
        p.description,
        p.repository_url,
        p.demo_url,
        t.name AS team_name,
        t.event_id,
        e.name AS event_name,
        ja.assigned_at,
        CASE
          WHEN jd.id IS NULL THEN 'pending'
          ELSE 'completed'
        END AS status
       FROM judge_assignments ja
       JOIN projects p ON p.id = ja.project_id
       JOIN teams t ON t.id = p.team_id
       JOIN events e ON e.id = t.event_id
       LEFT JOIN judgments jd
         ON jd.judge_id = ja.judge_id
         AND jd.project_id = ja.project_id
       WHERE ja.judge_id = $1
       ORDER BY e.end_date DESC, p.title`,
      [judgeId]
    );

    res.json({
      assignments: result.rows
    });
  } catch (error) {
    console.error("Get my assignments error:", error);

    res.status(500).json({
      message: "Failed to fetch your assignments"
    });
  }
};

const getProjectJudgingData = async (req, res) => {
  try {
    const { projectId } = req.params;

    const projectResult = await query(
      `SELECT
        p.id,
        p.title,
        p.tagline,
        p.description,
        p.repository_url,
        p.demo_url,
        t.name AS team_name,
        t.event_id
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       WHERE p.id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const assignmentResult = await query(
      `SELECT id
       FROM judge_assignments
       WHERE judge_id = (
         SELECT id FROM judges WHERE user_id = $1
       )
       AND project_id = $2`,
      [req.user.id, projectId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(403).json({
        message: "You are not assigned to this project"
      });
    }

    const rubricResult = await query(
      `SELECT
        r.id,
        r.name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', rc.id,
              'name', rc.name,
              'description', rc.description,
              'weight', rc.weight,
              'maxScore', rc.max_score
            )
            ORDER BY rc.id
          ) FILTER (WHERE rc.id IS NOT NULL),
          '[]'
        ) AS criteria
       FROM rubrics r
       JOIN projects p ON p.id = $1
       JOIN teams t ON t.id = p.team_id
       LEFT JOIN rubric_criteria rc ON rc.rubric_id = r.id
       WHERE r.event_id = t.event_id
       GROUP BY r.id
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [projectId]
    );

    const latestSubmissionResult = await query(
      `SELECT id, version, status, submitted_at, created_at
       FROM submissions
       WHERE project_id = $1
       ORDER BY version DESC
       LIMIT 1`,
      [projectId]
    );

    res.json({
      project: projectResult.rows[0],
      rubric: rubricResult.rows[0] || null,
      latestSubmission: latestSubmissionResult.rows[0] || null
    });
  } catch (error) {
    console.error("Get project judging data error:", error);

    res.status(500).json({
      message: "Failed to fetch judging data"
    });
  }
};

const submitJudgment = async (req, res) => {
  const client = await pool.connect();

  try {
    const { projectId, rubricId, scores } = req.body;

    if (!projectId || !rubricId || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({
        message: "Project ID, rubric ID and scores are required"
      });
    }

    const eventResult = await client.query(
      `SELECT e.id, e.name, e.end_date, e.status
       FROM events e
       JOIN teams t ON t.event_id = e.id
       JOIN projects p ON p.team_id = t.id
       WHERE p.id = $1`,
      [projectId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Project or event not found"
      });
    }

    const event = eventResult.rows[0];

    if (new Date(event.end_date) <= new Date()) {
      return res.status(400).json({
        message: "Judging is closed because the event has ended"
      });
    }

    if (event.status === "completed") {
      return res.status(400).json({
        message: "Judging is closed because the event is completed"
      });
    }

    const judgeResult = await client.query(
      "SELECT id FROM judges WHERE user_id = $1",
      [req.user.id]
    );

    if (judgeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Judge profile not found"
      });
    }

    const judgeId = judgeResult.rows[0].id;

    const assignmentResult = await client.query(
      `SELECT id
       FROM judge_assignments
       WHERE judge_id = $1
       AND project_id = $2`,
      [judgeId, projectId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(403).json({
        message: "You are not assigned to this project"
      });
    }

    const rubricResult = await client.query(
      `SELECT id
       FROM rubrics
       WHERE id = $1
       AND event_id = (
         SELECT t.event_id
         FROM projects p
         JOIN teams t ON t.id = p.team_id
         WHERE p.id = $2
       )`,
      [rubricId, projectId]
    );

    if (rubricResult.rows.length === 0) {
      return res.status(400).json({
        message: "Rubric does not belong to this event"
      });
    }

    const criteriaResult = await client.query(
      `SELECT id, weight, max_score
       FROM rubric_criteria
       WHERE rubric_id = $1
       ORDER BY id`,
      [rubricId]
    );

    if (criteriaResult.rows.length === 0) {
      return res.status(400).json({
        message: "Rubric has no criteria"
      });
    }

    const submittedCriteria = new Map();

    for (const score of scores) {
      const criterionId = String(score.criterionId);
      const rawScore = Number(score.rawScore);

      if (!Number.isFinite(rawScore)) {
        return res.status(400).json({
          message: "Invalid score value"
        });
      }

      submittedCriteria.set(criterionId, rawScore);
    }

    if (submittedCriteria.size !== criteriaResult.rows.length) {
      return res.status(400).json({
        message: "A score is required for every rubric criterion"
      });
    }

    for (const criterion of criteriaResult.rows) {
      const criterionId = String(criterion.id);
      const rawScore = submittedCriteria.get(criterionId);
      const maxScore = Number(criterion.max_score);

      if (
        rawScore === undefined ||
        rawScore < 0 ||
        rawScore > maxScore
      ) {
        return res.status(400).json({
          message: `Score for criterion ${criterionId} must be between 0 and ${maxScore}`
        });
      }
    }

    await client.query("BEGIN");

    const judgmentResult = await client.query(
      `INSERT INTO judgments
       (judge_id, project_id, rubric_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (judge_id, project_id, rubric_id)
       DO UPDATE SET submitted_at = CURRENT_TIMESTAMP
       RETURNING id, judge_id, project_id, rubric_id, submitted_at`,
      [judgeId, projectId, rubricId]
    );

    const judgment = judgmentResult.rows[0];

    await client.query(
      "DELETE FROM scores WHERE judgment_id = $1",
      [judgment.id]
    );

    const createdScores = [];
    let totalWeightedScore = 0;

    for (const criterion of criteriaResult.rows) {
      const rawScore = submittedCriteria.get(String(criterion.id));
      const maxScore = Number(criterion.max_score);
      const weight = Number(criterion.weight);
      const weightedScore = (rawScore / maxScore) * weight;

      totalWeightedScore += weightedScore;

      const scoreResult = await client.query(
        `INSERT INTO scores
         (judgment_id, criterion_id, raw_score, weighted_score)
         VALUES ($1, $2, $3, $4)
         RETURNING id, criterion_id, raw_score, weighted_score`,
        [
          judgment.id,
          criterion.id,
          rawScore,
          weightedScore.toFixed(3)
        ]
      );

      createdScores.push(scoreResult.rows[0]);
    }

    await client.query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "JUDGMENT_SUBMITTED",
        "judgment",
        judgment.id,
        JSON.stringify({
          projectId,
          rubricId,
          totalWeightedScore: Number(totalWeightedScore.toFixed(3))
        })
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Judgment submitted",
      judgment,
      scores: createdScores,
      totalScore: Number(totalWeightedScore.toFixed(3))
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Submit judgment error:", error);

    res.status(500).json({
      message: "Failed to submit judgment"
    });
  } finally {
    client.release();
  }
};
const getJudgeProgress = async (req, res) => {
  try {
    const judgeResult = await query(
      "SELECT id FROM judges WHERE user_id = $1",
      [req.user.id]
    );

    if (judgeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Judge profile not found"
      });
    }

    const judgeId = judgeResult.rows[0].id;

    const result = await query(
      `SELECT
        COUNT(*)::int AS total_assignments,
        COUNT(jd.id)::int AS completed_assignments,
        COUNT(*) FILTER (WHERE jd.id IS NULL)::int AS pending_assignments
       FROM judge_assignments ja
       LEFT JOIN judgments jd
         ON jd.judge_id = ja.judge_id
         AND jd.project_id = ja.project_id
       WHERE ja.judge_id = $1`,
      [judgeId]
    );

    const progress = result.rows[0];

    const total = Number(progress.total_assignments);
    const completed = Number(progress.completed_assignments);

    res.json({
      totalAssignments: total,
      completedAssignments: completed,
      pendingAssignments: Number(progress.pending_assignments),
      completionPercentage:
        total === 0 ? 0 : Number(((completed / total) * 100).toFixed(1))
    });
  } catch (error) {
    console.error("Judge progress error:", error);

    res.status(500).json({
      message: "Failed to fetch judge progress"
    });
  }
};

const getNormalizedResults = async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await calculateNormalization(eventId);

    res.json(result);
  } catch (error) {
    console.error("Normalization error:", error);

    res.status(500).json({
      message: "Failed to calculate normalized results"
    });
  }
};
const explainProjectScore = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await query(
      `SELECT
        j.id AS judgment_id,
        j.judge_id,
        u.name AS judge_name,
        r.name AS rubric_name,
        rc.id AS criterion_id,
        rc.name AS criterion_name,
        rc.weight,
        rc.max_score,
        s.raw_score,
        s.weighted_score,
        j.submitted_at
       FROM judgments j
       JOIN judges jg ON jg.id = j.judge_id
       JOIN users u ON u.id = jg.user_id
       JOIN rubrics r ON r.id = j.rubric_id
       JOIN scores s ON s.judgment_id = j.id
       JOIN rubric_criteria rc ON rc.id = s.criterion_id
       WHERE j.project_id = $1
       ORDER BY j.judge_id, rc.id`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No judging data found for this project"
      });
    }

    const judges = new Map();

    for (const row of result.rows) {
      if (!judges.has(row.judge_id)) {
        judges.set(row.judge_id, {
          judgeId: row.judge_id,
          judgeName: row.judge_name,
          rubricName: row.rubric_name,
          submittedAt: row.submitted_at,
          criteria: [],
          totalScore: 0
        });
      }

      const judge = judges.get(row.judge_id);

      judge.criteria.push({
        criterionId: row.criterion_id,
        criterionName: row.criterion_name,
        weight: Number(row.weight),
        maxScore: Number(row.max_score),
        rawScore: Number(row.raw_score),
        weightedScore: Number(row.weighted_score)
      });

      judge.totalScore += Number(row.weighted_score);
    }

    const judgeBreakdown = Array.from(judges.values()).map((judge) => ({
      ...judge,
      totalScore: Number(judge.totalScore.toFixed(3))
    }));

    const rawAverage =
      judgeBreakdown.reduce(
        (sum, judge) => sum + judge.totalScore,
        0
      ) / judgeBreakdown.length;

    res.json({
      projectId,
      judgeCount: judgeBreakdown.length,
      rawAverage: Number(rawAverage.toFixed(3)),
      judges: judgeBreakdown
    });
  } catch (error) {
    console.error("Explain score error:", error);

    res.status(500).json({
      message: "Failed to explain project score"
    });
  }
};
const exportResultsCsv = async (req, res) => {
  try {
    const { eventId } = req.params;

    const results = await calculateNormalization(eventId);
    const csv = generateResultsCsv(results);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="raptoros-results-${eventId}.csv"`
    );

    res.send(csv);
  } catch (error) {
    console.error("Export results CSV error:", error);

    res.status(500).json({
      message: "Failed to export judging results"
    });
  }
};
const simulateEventJudging = async (req, res) => {
  try {
    const { eventId } = req.params;
    const judgesPerProject = Math.min(
      Math.max(Number(req.body.judgesPerProject) || 2, 1),
      5
    );

    const eventResult = await query(
      `SELECT id, name
       FROM events
       WHERE id = $1`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const judgesResult = await query(
      `SELECT
        j.id,
        u.name
       FROM judges j
       JOIN users u ON u.id = j.user_id
       ORDER BY u.name`,
      []
    );

    const projectsResult = await query(
      `SELECT
        p.id,
        p.title,
        NULL AS team_judge_id
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       JOIN submissions s ON s.project_id = p.id
       WHERE t.event_id = $1
       AND s.status = 'submitted'
       GROUP BY p.id, p.title
       ORDER BY p.title`,
      [eventId]
    );

    const rubricResult = await query(
      `SELECT id
       FROM rubrics
       WHERE event_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [eventId]
    );

    if (rubricResult.rows.length === 0) {
      return res.status(400).json({
        message: "No rubric configured for this event"
      });
    }

    const criteriaResult = await query(
      `SELECT id, weight, max_score
       FROM rubric_criteria
       WHERE rubric_id = $1
       ORDER BY id`,
      [rubricResult.rows[0].id]
    );

    if (projectsResult.rows.length === 0) {
      return res.status(400).json({
        message: "No submitted projects available for simulation"
      });
    }

    if (judgesResult.rows.length < judgesPerProject) {
      return res.status(400).json({
        message: "Not enough judges for the requested simulation"
      });
    }

    const simulation = simulateJudging({
      projects: projectsResult.rows,
      judges: judgesResult.rows,
      judgesPerProject,
      criteria: criteriaResult.rows.map((criterion) => ({
        id: criterion.id,
        weight: Number(criterion.weight),
        maxScore: Number(criterion.max_score)
      }))
    });

    const projectResults = new Map();

    simulation.assignments.forEach((assignment) => {
      if (!projectResults.has(assignment.projectId)) {
        projectResults.set(assignment.projectId, {
          projectId: assignment.projectId,
          projectTitle: assignment.projectTitle,
          judges: [],
          averageScore: 0
        });
      }

      projectResults.get(assignment.projectId).judges.push({
        judgeId: assignment.judgeId,
        judgeName: assignment.judgeName,
        totalScore: assignment.totalScore
      });
    });

    const projects = Array.from(projectResults.values()).map(
      (project) => {
        const averageScore =
          project.judges.reduce(
            (sum, judge) => sum + judge.totalScore,
            0
          ) / project.judges.length;

        return {
          ...project,
          averageScore: Number(averageScore.toFixed(3))
        };
      }
    );

    projects.sort((a, b) => b.averageScore - a.averageScore);

    res.json({
      event: eventResult.rows[0],
      simulation: {
        judgesPerProject,
        projectCount: projects.length,
        assignmentCount: simulation.assignments.length,
        projects,
        judgeWorkload: simulation.judgeWorkload
      }
    });
  } catch (error) {
    console.error("Simulate judging error:", error);

    res.status(500).json({
      message: "Failed to simulate judging"
    });
  }
};

module.exports = {
  createJudge,
  getJudges,
  createRubric,
  getEventRubrics,
  assignJudges,
  getAssignments,
  getMyAssignments,
  getProjectJudgingData,
  submitJudgment,
  getJudgeProgress,
  getNormalizedResults,
  explainProjectScore,
  exportResultsCsv,
  simulateEventJudging
};