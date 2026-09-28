const { query } = require("../config/db");

const getAssignmentConflicts = async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await query(
      `SELECT
        ja.id AS assignment_id,
        ja.judge_id,
        ju.name AS judge_name,
        ju.email AS judge_email,
        ja.project_id,
        p.title AS project_title,
        t.id AS team_id,
        t.name AS team_name,
        CASE
          WHEN tm.user_id IS NOT NULL
            THEN 'JUDGE_IS_TEAM_MEMBER'
          WHEN duplicate_assignments.count > 1
            THEN 'DUPLICATE_ASSIGNMENT'
          WHEN j.id IS NULL
            THEN 'INVALID_JUDGE'
          WHEN p.id IS NULL
            THEN 'INVALID_PROJECT'
          ELSE 'NONE'
        END AS conflict_type
       FROM judge_assignments ja
       LEFT JOIN judges j
         ON j.id = ja.judge_id
       LEFT JOIN users ju
         ON ju.id = j.user_id
       LEFT JOIN projects p
         ON p.id = ja.project_id
       LEFT JOIN teams t
         ON t.id = p.team_id
       LEFT JOIN team_members tm
         ON tm.team_id = t.id
        AND tm.user_id = j.user_id
       LEFT JOIN (
         SELECT
           judge_id,
           project_id,
           COUNT(*) AS count
         FROM judge_assignments
         GROUP BY judge_id, project_id
       ) duplicate_assignments
         ON duplicate_assignments.judge_id = ja.judge_id
        AND duplicate_assignments.project_id = ja.project_id
       WHERE t.event_id = $1
       AND (
         tm.user_id IS NOT NULL
         OR duplicate_assignments.count > 1
         OR j.id IS NULL
         OR p.id IS NULL
       )
       ORDER BY ja.assigned_at DESC`,
      [eventId]
    );

    res.json({
      eventId,
      conflictCount: result.rows.length,
      conflicts: result.rows
    });
  } catch (error) {
    console.error("Assignment conflicts error:", error);

    res.status(500).json({
      message: "Failed to detect assignment conflicts"
    });
  }
};

const getJudgeConflicts = async (req, res) => {
  try {
    const { judgeId } = req.params;

    const result = await query(
      `SELECT
        ja.id AS assignment_id,
        ja.project_id,
        p.title AS project_title,
        t.name AS team_name,
        CASE
          WHEN tm.user_id IS NOT NULL
            THEN 'JUDGE_IS_TEAM_MEMBER'
          ELSE 'NONE'
        END AS conflict_type
       FROM judge_assignments ja
       JOIN projects p
         ON p.id = ja.project_id
       JOIN teams t
         ON t.id = p.team_id
       LEFT JOIN judges j
         ON j.id = ja.judge_id
       LEFT JOIN team_members tm
         ON tm.team_id = t.id
        AND tm.user_id = j.user_id
       WHERE ja.judge_id = $1
       AND tm.user_id IS NOT NULL
       ORDER BY ja.assigned_at DESC`,
      [judgeId]
    );

    res.json({
      judgeId,
      conflictCount: result.rows.length,
      conflicts: result.rows
    });
  } catch (error) {
    console.error("Judge conflicts error:", error);

    res.status(500).json({
      message: "Failed to detect judge conflicts"
    });
  }
};

const getDuplicateProjects = async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await query(
      `SELECT
        p.id,
        p.title,
        p.description,
        p.repository_url,
        t.id AS team_id,
        t.name AS team_name
       FROM projects p
       JOIN teams t
         ON t.id = p.team_id
       WHERE t.event_id = $1
       ORDER BY p.created_at ASC`,
      [eventId]
    );

    const normalizeValue = (value) => {
      return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
    };

    const fingerprints = new Map();
    const duplicates = [];

    for (const project of result.rows) {
      const fingerprint = [
        normalizeValue(project.title),
        normalizeValue(project.description),
        normalizeValue(project.repository_url)
      ].join("|");

      if (fingerprints.has(fingerprint)) {
        duplicates.push({
          project: {
            id: project.id,
            title: project.title,
            teamId: project.team_id,
            teamName: project.team_name
          },
          duplicateOf: fingerprints.get(fingerprint)
        });
      } else {
        fingerprints.set(fingerprint, {
          id: project.id,
          title: project.title,
          teamId: project.team_id,
          teamName: project.team_name
        });
      }
    }

    res.json({
      eventId,
      duplicateCount: duplicates.length,
      duplicates
    });
  } catch (error) {
    console.error("Duplicate projects error:", error);

    res.status(500).json({
      message: "Failed to detect duplicate projects"
    });
  }
};

module.exports = {
  getAssignmentConflicts,
  getJudgeConflicts,
  getDuplicateProjects
};