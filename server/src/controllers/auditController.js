const { query } = require("../config/db");

const getAuditLogs = async (req, res) => {
  try {
    const { eventId, entityType, entityId, limit = 100 } = req.query;

    const params = [];
    const conditions = [];

    if (eventId) {
      params.push(eventId);
      conditions.push(`
        (
          al.entity_id = $${params.length}
          OR al.metadata->>'eventId' = $${params.length}
        )
      `);
    }

    if (entityType) {
      params.push(entityType);
      conditions.push(`al.entity_type = $${params.length}`);
    }

    if (entityId) {
      params.push(entityId);
      conditions.push(`al.entity_id = $${params.length}`);
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await query(
      `SELECT
        al.id,
        al.user_id,
        COALESCE(u.name, 'System') AS user_name,
        u.email AS user_email,
        al.action,
        al.entity_type,
        al.entity_id,
        al.metadata,
        al.created_at
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT ${safeLimit}`,
      params
    );

    res.json({
      logs: result.rows
    });
  } catch (error) {
    console.error("Get audit logs error:", error);

    res.status(500).json({
      message: "Failed to fetch audit logs"
    });
  }
};

const getEntityTimeline = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const result = await query(
      `SELECT
        al.id,
        al.user_id,
        COALESCE(u.name, 'System') AS user_name,
        al.action,
        al.entity_type,
        al.entity_id,
        al.metadata,
        al.created_at
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.entity_type = $1
       AND al.entity_id = $2
       ORDER BY al.created_at ASC`,
      [entityType, entityId]
    );

    res.json({
      entityType,
      entityId,
      timeline: result.rows
    });
  } catch (error) {
    console.error("Get entity timeline error:", error);

    res.status(500).json({
      message: "Failed to fetch entity timeline"
    });
  }
};

module.exports = {
  getAuditLogs,
  getEntityTimeline
};