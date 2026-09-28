const { query } = require("../config/db");
const {
  issueJudgeRecord,
  verifyJudgeRecord
} = require("../services/judgeRecordService");

const issueRecord = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { judgeId, participationType = "judge" } = req.body;

    if (!judgeId) {
      return res.status(400).json({
        message: "Judge ID is required"
      });
    }

    const judgeResult = await query(
      `SELECT id
       FROM judges
       WHERE id = $1`,
      [judgeId]
    );

    if (judgeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Judge not found"
      });
    }

    const eventResult = await query(
      `SELECT id
       FROM events
       WHERE id = $1`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const record = await issueJudgeRecord({
      judgeId,
      eventId,
      participationType
    });

    res.status(201).json({
      message: "Judge participation record issued",
      record
    });
  } catch (error) {
    console.error("Issue judge record error:", error);

    res.status(500).json({
      message: "Failed to issue judge record"
    });
  }
};

const verifyRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    const verification = await verifyJudgeRecord(recordId);

    if (!verification.exists) {
      return res.status(404).json({
        message: "Judge record not found",
        valid: false
      });
    }

    res.json({
      recordId,
      valid: verification.valid,
      record: verification.record
    });
  } catch (error) {
    console.error("Verify judge record error:", error);

    res.status(500).json({
      message: "Failed to verify judge record"
    });
  }
};

module.exports = {
  issueRecord,
  verifyRecord
};