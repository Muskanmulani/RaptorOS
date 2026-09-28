const bcrypt = require("bcryptjs");
const { query } = require("../config/db");

const parseCsv = (csv) => {
  const lines = String(csv || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0]
    .split(",")
    .map((header) => header.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const values = line.split(",");

    return headers.reduce((row, header, index) => {
      row[header] = (values[index] || "").trim();
      return row;
    }, {});
  });
};

const importParticipants = async (eventId, csv) => {
  const rows = parseCsv(csv);

  let processedRows = 0;
  let errorCount = 0;
  const errors = [];
  const imported = [];

  for (const row of rows) {
    try {
      if (!row.name || !row.email) {
        throw new Error("Name and email are required");
      }

      const email = row.email.toLowerCase();

      const existingUser = await query(
        `SELECT id, name, email, role
         FROM users
         WHERE email = $1`,
        [email]
      );

      let user;

      if (existingUser.rows.length > 0) {
        user = existingUser.rows[0];
      } else {
        const passwordHash = await bcrypt.hash(
          "RaptorOS@123",
          10
        );

        const userResult = await query(
          `INSERT INTO users
           (name, email, password_hash, role)
           VALUES ($1, $2, $3, 'participant')
           RETURNING id, name, email, role`,
          [
            row.name,
            email,
            passwordHash
          ]
        );

        user = userResult.rows[0];
      }

      imported.push(user);
      processedRows += 1;
    } catch (error) {
      errorCount += 1;

      errors.push({
        row,
        message: error.message
      });
    }
  }

  return {
    totalRows: rows.length,
    processedRows,
    errorCount,
    imported,
    errors
  };
};

module.exports = {
  parseCsv,
  importParticipants
};