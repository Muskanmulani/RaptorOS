const { query } = require("../config/db");

const getGalleryWidgetData = async (eventId) => {
  const result = await query(
    `SELECT
      p.id,
      p.title,
      p.tagline,
      p.description,
      p.repository_url,
      p.demo_url,
      t.name AS team_name
     FROM projects p
     JOIN teams t ON t.id = p.team_id
     JOIN events e ON e.id = t.event_id
     WHERE e.id = $1
     AND EXISTS (
       SELECT 1
       FROM submissions s
       WHERE s.project_id = p.id
       AND s.status = 'submitted'
     )
     ORDER BY p.title`,
    [eventId]
  );

  return result.rows;
};

const generateGalleryWidget = (eventId, projects) => {
  const projectCards = projects
    .map(
      (project) => `
        <article class="raptor-card">
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.tagline || project.description || "")}</p>
          <small>${escapeHtml(project.team_name)}</small>
          ${
            project.demo_url
              ? `<a href="${escapeHtml(project.demo_url)}" target="_blank" rel="noopener noreferrer">Demo</a>`
              : ""
          }
        </article>
      `
    )
    .join("");

  return `
<div class="raptor-gallery">
  <style>
    .raptor-gallery {
      font-family: Arial, sans-serif;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      padding: 20px;
      background: #11100e;
      color: #f4efe6;
    }
    .raptor-card {
      border: 1px solid #3a332c;
      padding: 18px;
      background: #191613;
    }
    .raptor-card h3 {
      margin: 0 0 8px;
    }
    .raptor-card p {
      color: #aaa39a;
    }
    .raptor-card small {
      display: block;
      color: #f97316;
      margin-bottom: 12px;
    }
    .raptor-card a {
      color: #f97316;
      text-decoration: none;
    }
  </style>
  ${projectCards || "<p>No submitted projects available.</p>"}
</div>
`;
};

const escapeHtml = (value) => {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

module.exports = {
  getGalleryWidgetData,
  generateGalleryWidget
};