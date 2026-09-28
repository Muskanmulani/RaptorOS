const crypto = require("crypto");
const { query } = require("../config/db");

const createRecordPayload = ({
  judgeId,
  eventId,
  participationType
}) => {
  return JSON.stringify({
    judgeId,
    eventId,
    participationType
  });
};

const createRecordSignature = (payload) => {
  return crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(payload)
    .digest("hex");
};

const issueJudgeRecord = async ({
  judgeId,
  eventId,
  participationType = "judge"
}) => {
  const payload = createRecordPayload({
    judgeId,
    eventId,
    participationType
  });

  const recordHash = crypto
    .createHash("sha256")
    .update(payload)
    .digest("hex");

  const signature = createRecordSignature(payload);

  const result = await query(
    `INSERT INTO judge_records
     (judge_id, event_id, participation_type, record_hash, signature)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (judge_id, event_id)
     DO UPDATE SET
       participation_type = EXCLUDED.participation_type,
       record_hash = EXCLUDED.record_hash,
       signature = EXCLUDED.signature,
       issued_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [
      judgeId,
      eventId,
      participationType,
      recordHash,
      signature
    ]
  );

  return result.rows[0];
};

const verifyJudgeRecord = async (recordId) => {
  const result = await query(
    `SELECT
      id,
      judge_id,
      event_id,
      participation_type,
      issued_at,
      record_hash,
      signature
     FROM judge_records
     WHERE id = $1`,
    [recordId]
  );

  if (result.rows.length === 0) {
    return {
      exists: false,
      valid: false
    };
  }

  const record = result.rows[0];

  const payload = createRecordPayload({
    judgeId: record.judge_id,
    eventId: record.event_id,
    participationType: record.participation_type
  });

  const expectedHash = crypto
    .createHash("sha256")
    .update(payload)
    .digest("hex");

  const expectedSignature = createRecordSignature(payload);

  return {
    exists: true,
    valid:
      record.record_hash === expectedHash &&
      record.signature === expectedSignature,
    record: {
      id: record.id,
      judgeId: record.judge_id,
      eventId: record.event_id,
      participationType: record.participation_type,
      issuedAt: record.issued_at
    }
  };
};

module.exports = {
  issueJudgeRecord,
  verifyJudgeRecord
};