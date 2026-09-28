const { retrieveEvidence } = require("./ragService");

const analyzeCriterion = ({
  projectId,
  criterion,
  project,
  existingScore
}) => {
  const evidence = retrieveEvidence({
    projectId,
    query: `${criterion.name} ${criterion.description || ""}`,
    limit: 5
  });

  const hasEvidence = evidence.length > 0;

  const strongestEvidence = evidence[0] || null;

  const observation = hasEvidence
    ? `Evidence related to ${criterion.name} was retrieved from the project submission.`
    : `No relevant indexed evidence was found for ${criterion.name}.`;

  let potentialConcern;

  if (!hasEvidence) {
    potentialConcern =
      "The submission does not currently provide enough indexed evidence for this criterion.";
  } else if (strongestEvidence.similarity < 0.2) {
    potentialConcern =
      "The retrieved evidence has low relevance and should be manually verified.";
  } else {
    potentialConcern =
      "The judge should verify that the retrieved evidence directly supports the claimed criterion.";
  }

  let scoreContext = null;

  if (existingScore) {
    const percentage =
      (Number(existingScore.rawScore) /
        Number(criterion.maxScore)) *
      100;

    scoreContext = {
      rawScore: Number(existingScore.rawScore),
      maxScore: Number(criterion.maxScore),
      percentage: Number(percentage.toFixed(2)),
      interpretation:
        percentage >= 80
          ? "The submitted score is relatively high for this criterion."
          : percentage >= 50
            ? "The submitted score is in the middle range for this criterion."
            : "The submitted score is relatively low for this criterion."
    };
  }

  return {
    projectId,
    projectTitle: project.title,
    criterion: {
      id: criterion.id,
      name: criterion.name,
      weight: criterion.weight,
      maxScore: criterion.maxScore
    },
    evidence: evidence.map((item) => ({
      source: item.source,
      text: item.text,
      relevance: item.similarity
    })),
    strongestEvidence: strongestEvidence
      ? {
          source: strongestEvidence.source,
          text: strongestEvidence.text,
          relevance: strongestEvidence.similarity
        }
      : null,
    observation,
    potentialConcern,
    scoreContext,
    humanDecisionRequired: true
  };
};

const analyzeProject = ({
  projectId,
  project,
  criteria,
  existingScores = []
}) => {
  return criteria.map((criterion) => {
    const existingScore = existingScores.find(
      (score) =>
        String(score.criterionId) === String(criterion.id)
    );

    return analyzeCriterion({
      projectId,
      project,
      criterion,
      existingScore
    });
  });
};

module.exports = {
  analyzeCriterion,
  analyzeProject
};