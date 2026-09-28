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

  const judgeScores = new Map();

  for (const row of result.rows) {
    if (!judgeScores.has(row.judge_id)) {
      judgeScores.set(row.judge_id, []);
    }

    judgeScores.get(row.judge_id).push(Number(row.weighted_score));
  }

  const judgeStats = new Map();

  for (const [judgeId, scores] of judgeScores.entries()) {
    const mean =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;

    const variance =
      scores.reduce(
        (sum, score) => sum + Math.pow(score - mean, 2),
        0
      ) / scores.length;

    const standardDeviation = Math.sqrt(variance);

    judgeStats.set(judgeId, {
      mean,
      standardDeviation
    });
  }

  const projectJudgments = new Map();

  for (const row of result.rows) {
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

    project.judges.get(row.judge_id).score += Number(row.weighted_score);
  }

  const projects = [];

  for (const project of projectJudgments.values()) {
    const normalizedJudges = [];

    for (const judge of project.judges.values()) {
      const stats = judgeStats.get(judge.judgeId);

      let normalizedScore = judge.score;

      if (stats && stats.standardDeviation > 0) {
        normalizedScore =
          50 +
          ((judge.score - stats.mean) / stats.standardDeviation) * 10;
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
    judgeStatistics: Array.from(judgeStats.entries()).map(
      ([judgeId, stats]) => ({
        judgeId,
        mean: Number(stats.mean.toFixed(3)),
        standardDeviation: Number(
          stats.standardDeviation.toFixed(3)
        )
      })
    ),
    projects
  };
};

module.exports = {
  calculateNormalization
};