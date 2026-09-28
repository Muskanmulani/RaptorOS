const { query } = require("../config/db");
const {
  issueCertificate,
  getCertificate
} = require("../services/certificateService");

const issueCertificateForUser = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      userId,
      certificateType = "participation",
      metadata = {}
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required"
      });
    }

    const eventResult = await query(
      `SELECT id, name
       FROM events
       WHERE id = $1`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const userResult = await query(
      `SELECT id, name, email
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const certificate = await issueCertificate({
      eventId,
      userId,
      certificateType,
      metadata
    });

    res.status(201).json({
      message: "Certificate issued",
      certificate
    });
  } catch (error) {
    console.error("Issue certificate error:", error);

    res.status(500).json({
      message: "Failed to issue certificate"
    });
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const { certificateCode } = req.params;

    const certificate = await getCertificate(certificateCode);

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate not found",
        valid: false
      });
    }

    res.json({
      valid: true,
      certificate
    });
  } catch (error) {
    console.error("Verify certificate error:", error);

    res.status(500).json({
      message: "Failed to verify certificate"
    });
  }
};

module.exports = {
  issueCertificateForUser,
  verifyCertificate
};