const { query } = require("../config/db");

const calculateNormalization = async (eventId) => {
  const result = await query(
    `SELECT
      j.id AS judgment_id,
      j.judge_id,
      ju.name AS judge_name,
      j.project_id,
      p.title AS project_title,
      s.weighted_score
     FROM judgments j
     JOIN judges jg ON jg.id = j.judge_id
     JOIN users ju ON ju.id = jg.user_id
     JOIN projects p ON p.id = j.project_id
     JOIN teams t ON t.id = p.team_id
     JOIN scores s ON s.judgment_id = j.id
     WHERE t.event_id = $1
     ORDER BY j.project_id, j.judge_id`,
    [eventId]
  );

  const judgeProjectScores = new Map();
  const projectJudgments = new Map();

  for (const row of result.rows) {
    const weightedScore = Number(row.weighted_score);

    if (!judgeProjectScores.has(row.judge_id)) {
      judgeProjectScores.set(row.judge_id, new Map());
    }

    const judgeProjects = judgeProjectScores.get(row.judge_id);

    if (!judgeProjects.has(row.project_id)) {
      judgeProjects.set(row.project_id, 0);
    }

    judgeProjects.set(
      row.project_id,
      judgeProjects.get(row.project_id) + weightedScore
    );

    if (!projectJudgments.has(row.project_id)) {
      projectJudgments.set(row.project_id, {
        projectId: row.project_id,
        projectTitle: row.project_title,
        judges: new Map()
      });
    }

    const project = projectJudgments.get(row.project_id);

    if (!project.judges.has(row.judge_id)) {
      project.judges.set(row.judge_id, {
        judgeId: row.judge_id,
        judgeName: row.judge_name,
        score: 0
      });
    }

    project.judges.get(row.judge_id).score += weightedScore;
  }

  const judgeStats = new Map();

  for (const [judgeId, projectScores] of judgeProjectScores.entries()) {
    const scores = Array.from(projectScores.values());

    const mean =
      scores.length === 0
        ? 0
        : scores.reduce((sum, score) => sum + score, 0) /
          scores.length;

    const variance =
      scores.length === 0
        ? 0
        : scores.reduce(
            (sum, score) => sum + Math.pow(score - mean, 2),
            0
          ) / scores.length;

    const standardDeviation = Math.sqrt(variance);

    judgeStats.set(judgeId, {
      mean,
      standardDeviation,
      projectsJudged: scores.length
    });
  }

  const projects = [];

  for (const project of projectJudgments.values()) {
    const normalizedJudges = [];

    for (const judge of project.judges.values()) {
      const stats = judgeStats.get(judge.judgeId);

      let normalizedScore = 50;

      if (stats && stats.standardDeviation > 0) {
        normalizedScore =
          50 +
          ((judge.score - stats.mean) /
            stats.standardDeviation) *
            10;
      }

      normalizedScore = Math.max(
        0,
        Math.min(100, normalizedScore)
      );

      normalizedJudges.push({
        judgeId: judge.judgeId,
        judgeName: judge.judgeName,
        rawScore: Number(judge.score.toFixed(3)),
        normalizedScore: Number(normalizedScore.toFixed(3))
      });
    }

    const rawAverage =
      normalizedJudges.length === 0
        ? 0
        : normalizedJudges.reduce(
            (sum, judge) => sum + judge.rawScore,
            0
          ) / normalizedJudges.length;

    const normalizedAverage =
      normalizedJudges.length === 0
        ? 0
        : normalizedJudges.reduce(
            (sum, judge) => sum + judge.normalizedScore,
            0
          ) / normalizedJudges.length;

    projects.push({
      projectId: project.projectId,
      projectTitle: project.projectTitle,
      rawAverage: Number(rawAverage.toFixed(3)),
      normalizedAverage: Number(normalizedAverage.toFixed(3)),
      judgeCount: normalizedJudges.length,
      judges: normalizedJudges
    });
  }

  projects.sort(
    (a, b) => b.normalizedAverage - a.normalizedAverage
  );

  return {
    eventId,
    method: "Judge Z-Score Normalization",
    formula: "50 + ((judgeProjectScore - judgeMean) / judgeStandardDeviation) * 10",
    judgeStatistics: Array.from(judgeStats.entries()).map(
      ([judgeId, stats]) => ({
        judgeId,
        mean: Number(stats.mean.toFixed(3)),
        standardDeviation: Number(
          stats.standardDeviation.toFixed(3)
        ),
        projectsJudged: stats.projectsJudged
      })
    ),
    projects
  };
};

module.exports = {
  calculateNormalization
};