const crypto = require("crypto");
const { query } = require("../config/db");

const createCertificateCode = () => {
  return `RAPTOR-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
};

const issueCertificate = async ({
  eventId,
  userId,
  certificateType,
  metadata = {}
}) => {
  const certificateCode = createCertificateCode();

  const result = await query(
    `INSERT INTO certificates
     (event_id, user_id, certificate_type, certificate_code, metadata)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (event_id, user_id, certificate_type)
     DO UPDATE SET
       metadata = EXCLUDED.metadata,
       issued_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [
      eventId,
      userId,
      certificateType,
      certificateCode,
      JSON.stringify(metadata)
    ]
  );

  return result.rows[0];
};

const getCertificate = async (certificateCode) => {
  const result = await query(
    `SELECT
      c.id,
      c.event_id,
      c.user_id,
      c.certificate_type,
      c.certificate_code,
      c.issued_at,
      c.metadata,
      u.name AS user_name,
      u.email AS user_email,
      e.name AS event_name
     FROM certificates c
     JOIN users u ON u.id = c.user_id
     JOIN events e ON e.id = c.event_id
     WHERE c.certificate_code = $1`,
    [certificateCode]
  );

  return result.rows[0] || null;
};

module.exports = {
  createCertificateCode,
  issueCertificate,
  getCertificate
};