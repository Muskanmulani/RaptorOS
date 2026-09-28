const { query } = require("../config/db");
const { importParticipants } = require("../services/importService");

const importParticipantsController = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { csv } = req.body;

    if (!csv || !csv.trim()) {
      return res.status(400).json({
        message: "CSV content is required"
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

    const importJobResult = await query(
      `INSERT INTO import_jobs
       (event_id, entity_type, status)
       VALUES ($1, 'participants', 'processing')
       RETURNING *`,
      [eventId]
    );

    const importJob = importJobResult.rows[0];

    const result = await importParticipants(
      eventId,
      csv
    );

    await query(
      `UPDATE import_jobs
       SET
         status = 'completed',
         total_rows = $1,
         processed_rows = $2,
         error_count = $3,
         completed_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [
        result.totalRows,
        result.processedRows,
        result.errorCount,
        importJob.id
      ]
    );

    res.status(201).json({
      message: "Participant import completed",
      job: {
        id: importJob.id,
        eventId,
        entityType: "participants",
        status: "completed",
        totalRows: result.totalRows,
        processedRows: result.processedRows,
        errorCount: result.errorCount
      },
      imported: result.imported,
      errors: result.errors
    });
  } catch (error) {
    console.error("Participant import error:", error);

    res.status(500).json({
      message: "Failed to import participants"
    });
  }
};

const getImportJobs = async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await query(
      `SELECT
        id,
        event_id,
        entity_type,
        status,
        total_rows,
        processed_rows,
        error_count,
        created_at,
        completed_at
       FROM import_jobs
       WHERE event_id = $1
       ORDER BY created_at DESC`,
      [eventId]
    );

    res.json({
      eventId,
      jobs: result.rows
    });
  } catch (error) {
    console.error("Get import jobs error:", error);

    res.status(500).json({
      message: "Failed to fetch import jobs"
    });
  }
};

module.exports = {
  importParticipantsController,
  getImportJobs
};