const crypto = require("crypto");
const { query } = require("../config/db");

const normalizeValue = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

const createProjectFingerprint = ({
  title,
  description,
  repositoryUrl
}) => {
  const normalized = [
    normalizeValue(title),
    normalizeValue(description),
    normalizeValue(repositoryUrl)
  ].join("|");

  return crypto
    .createHash("sha256")
    .update(normalized)
    .digest("hex");
};

const isDuplicateProject = async ({
  eventId,
  title,
  description,
  repositoryUrl,
  excludeProjectId = null
}) => {
  const fingerprint = createProjectFingerprint({
    title,
    description,
    repositoryUrl
  });

  const params = [eventId];

  let sql = `
    SELECT
      p.id,
      p.title,
      p.description,
      p.repository_url
    FROM projects p
    JOIN teams t ON t.id = p.team_id
    WHERE t.event_id = $1
  `;

  if (excludeProjectId) {
    params.push(excludeProjectId);
    sql += ` AND p.id <> $${params.length}`;
  }

  const result = await query(sql, params);

  for (const project of result.rows) {
    const existingFingerprint = createProjectFingerprint({
      title: project.title,
      description: project.description,
      repositoryUrl: project.repository_url
    });

    if (existingFingerprint === fingerprint) {
      return {
        duplicate: true,
        project: {
          id: project.id,
          title: project.title
        }
      };
    }
  }

  return {
    duplicate: false,
    project: null
  };
};

module.exports = {
  createProjectFingerprint,
  isDuplicateProject
};