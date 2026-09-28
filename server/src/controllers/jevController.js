const { query } = require("../config/db");
const {
  indexProjectEvidence,
  retrieveEvidence
} = require("../services/ragService");
const {
  analyzeCriterion,
  analyzeProject
} = require("../services/jevService");

const getProjectContext = async (projectId) => {
  const result = await query(
    `SELECT
      p.id,
      p.title,
      p.description,
      s.content AS submission_content
     FROM projects p
     LEFT JOIN LATERAL (
       SELECT content
       FROM submissions
       WHERE project_id = p.id
       AND status = 'submitted'
       ORDER BY version DESC
       LIMIT 1
     ) s ON true
     WHERE p.id = $1`,
    [projectId]
  );

  return result.rows[0] || null;
};

const indexProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await getProjectContext(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const result = indexProjectEvidence({
      projectId: project.id,
      projectTitle: project.title,
      description: project.description,
      readme: project.submission_content
    });

    res.json({
      message: "Project evidence indexed",
      project: {
        id: project.id,
        title: project.title
      },
      ...result
    });
  } catch (error) {
    console.error("Index project evidence error:", error);

    res.status(500).json({
      message: "Failed to index project evidence"
    });
  }
};

const searchProjectEvidence = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { query: searchQuery, limit } = req.query;

    if (!searchQuery || !searchQuery.trim()) {
      return res.status(400).json({
        message: "Search query is required"
      });
    }

    const project = await getProjectContext(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const evidence = retrieveEvidence({
      projectId,
      query: searchQuery,
      limit: Math.min(Math.max(Number(limit) || 5, 1), 10)
    });

    res.json({
      project: {
        id: project.id,
        title: project.title
      },
      query: searchQuery,
      evidence
    });
  } catch (error) {
    console.error("Search project evidence error:", error);

    res.status(500).json({
      message: "Failed to search project evidence"
    });
  }
};

const analyzeProjectWithJev = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await getProjectContext(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const rubricResult = await query(
      `SELECT
        rc.id,
        rc.name,
        rc.description,
        rc.weight,
        rc.max_score
       FROM rubric_criteria rc
       JOIN rubrics r ON r.id = rc.rubric_id
       JOIN teams t ON t.event_id = r.event_id
       JOIN projects p ON p.team_id = t.id
       WHERE p.id = $1
       AND r.id = (
         SELECT id
         FROM rubrics
         WHERE event_id = t.event_id
         ORDER BY created_at DESC
         LIMIT 1
       )
       ORDER BY rc.id`,
      [projectId]
    );

    if (rubricResult.rows.length === 0) {
      return res.status(400).json({
        message: "No rubric criteria found for this project"
      });
    }

    indexProjectEvidence({
      projectId: project.id,
      projectTitle: project.title,
      description: project.description,
      readme: project.submission_content
    });

    const criteria = rubricResult.rows.map((criterion) => ({
      id: criterion.id,
      name: criterion.name,
      description: criterion.description,
      weight: Number(criterion.weight),
      maxScore: Number(criterion.max_score)
    }));

    const scoreResult = await query(
      `SELECT
        s.criterion_id,
        s.raw_score,
        s.weighted_score
       FROM scores s
       JOIN judgments j ON j.id = s.judgment_id
       JOIN rubrics r ON r.id = j.rubric_id
       JOIN teams t ON t.event_id = r.event_id
       JOIN projects p ON p.team_id = t.id
       WHERE p.id = $1
       ORDER BY s.criterion_id`,
      [projectId]
    );

    const existingScores = scoreResult.rows.map((score) => ({
      criterionId: score.criterion_id,
      rawScore: Number(score.raw_score),
      weightedScore: Number(score.weighted_score)
    }));

    const analysis = analyzeProject({
      projectId: project.id,
      project: {
        title: project.title
      },
      criteria,
      existingScores
    });

    res.json({
      project: {
        id: project.id,
        title: project.title
      },
      humanDecisionRequired: true,
      analysis
    });
  } catch (error) {
    console.error("Jev analysis error:", error);

    res.status(500).json({
      message: "Failed to analyze project"
    });
  }
};

const analyzeProjectCriterion = async (req, res) => {
  try {
    const { projectId, criterionId } = req.params;

    const project = await getProjectContext(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const criterionResult = await query(
      `SELECT
        rc.id,
        rc.name,
        rc.description,
        rc.weight,
        rc.max_score
       FROM rubric_criteria rc
       JOIN rubrics r ON r.id = rc.rubric_id
       JOIN teams t ON t.event_id = r.event_id
       JOIN projects p ON p.team_id = t.id
       WHERE rc.id = $1
       AND p.id = $2`,
      [criterionId, projectId]
    );

    if (criterionResult.rows.length === 0) {
      return res.status(404).json({
        message: "Criterion not found"
      });
    }

    indexProjectEvidence({
      projectId: project.id,
      projectTitle: project.title,
      description: project.description,
      readme: project.submission_content
    });

    const scoreResult = await query(
      `SELECT
        s.raw_score,
        s.weighted_score
       FROM scores s
       JOIN judgments j ON j.id = s.judgment_id
       WHERE j.project_id = $1
       AND s.criterion_id = $2
       ORDER BY j.submitted_at DESC
       LIMIT 1`,
      [projectId, criterionId]
    );

    const row = criterionResult.rows[0];

    const existingScore = scoreResult.rows[0]
      ? {
          criterionId: row.id,
          rawScore: Number(scoreResult.rows[0].raw_score),
          weightedScore: Number(
            scoreResult.rows[0].weighted_score
          )
        }
      : null;

    const analysis = analyzeCriterion({
      projectId,
      project: {
        title: project.title
      },
      criterion: {
        id: row.id,
        name: row.name,
        description: row.description,
        weight: Number(row.weight),
        maxScore: Number(row.max_score)
      },
      existingScore
    });

    res.json({
      analysis
    });
  } catch (error) {
    console.error("Jev criterion analysis error:", error);

    res.status(500).json({
      message: "Failed to analyze criterion"
    });
  }
};

module.exports = {
  indexProject,
  searchProjectEvidence,
  analyzeProjectWithJev,
  analyzeProjectCriterion
};