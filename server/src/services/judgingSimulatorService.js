const simulateJudging = ({
  projects,
  judges,
  judgesPerProject = 2,
  criteria
}) => {
  const assignments = [];
  const judgeWorkload = new Map();

  judges.forEach((judge) => {
    judgeWorkload.set(judge.id, 0);
  });

  const shuffledJudges = [...judges].sort(() => Math.random() - 0.5);

  projects.forEach((project) => {
    const eligibleJudges = shuffledJudges
      .filter((judge) => judge.id !== project.teamJudgeId)
      .sort(
        (a, b) =>
          judgeWorkload.get(a.id) - judgeWorkload.get(b.id)
      );

    const selectedJudges = eligibleJudges.slice(
      0,
      Math.min(judgesPerProject, eligibleJudges.length)
    );

    selectedJudges.forEach((judge) => {
      judgeWorkload.set(
        judge.id,
        judgeWorkload.get(judge.id) + 1
      );

      const scores = criteria.map((criterion) => {
        const rawScore = Number(
          (Math.random() * criterion.maxScore).toFixed(2)
        );

        const weightedScore =
          (rawScore / criterion.maxScore) * criterion.weight;

        return {
          criterionId: criterion.id,
          rawScore,
          weightedScore: Number(weightedScore.toFixed(3))
        };
      });

      const totalScore = scores.reduce(
        (sum, score) => sum + score.weightedScore,
        0
      );

      assignments.push({
        projectId: project.id,
        projectTitle: project.title,
        judgeId: judge.id,
        judgeName: judge.name,
        scores,
        totalScore: Number(totalScore.toFixed(3))
      });
    });
  });

  return {
    assignments,
    judgeWorkload: Array.from(judgeWorkload.entries()).map(
      ([judgeId, workload]) => ({
        judgeId,
        workload
      })
    )
  };
};

module.exports = {
  simulateJudging
};