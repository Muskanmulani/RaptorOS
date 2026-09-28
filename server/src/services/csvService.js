const escapeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

const generateResultsCsv = (results) => {
  const headers = [
    "Rank",
    "Project",
    "Raw Average",
    "Normalized Average",
    "Judge Count",
    "Judge Scores"
  ];

  const rows = results.projects.map((project, index) => {
    const judgeScores = project.judges
      .map(
        (judge) =>
          `${judge.judgeName}: ${judge.rawScore} -> ${judge.normalizedScore}`
      )
      .join(" | ");

    return [
      index + 1,
      project.projectTitle,
      project.rawAverage,
      project.normalizedAverage,
      project.judgeCount,
      judgeScores
    ];
  });

  return [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      row.map(escapeCsvValue).join(",")
    )
  ].join("\n");
};

module.exports = {
  generateResultsCsv
};