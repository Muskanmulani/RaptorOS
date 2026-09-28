const crypto = require("crypto");
const { query } = require("../config/db");

const createWebhookSecret = () => {
  return crypto.randomBytes(32).toString("hex");
};

const createSignature = (payload, secret) => {
  return crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
};

const createWebhook = async ({
  eventId,
  url
}) => {
  const secret = createWebhookSecret();

  const result = await query(
    `INSERT INTO webhook_endpoints
     (event_id, url, secret)
     VALUES ($1, $2, $3)
     RETURNING id, event_id, url, active, created_at`,
    [eventId, url, secret]
  );

  return {
    ...result.rows[0],
    secret
  };
};

const getEventWebhooks = async (eventId) => {
  const result = await query(
    `SELECT
      id,
      event_id,
      url,
      active,
      created_at
     FROM webhook_endpoints
     WHERE event_id = $1
     ORDER BY created_at DESC`,
    [eventId]
  );

  return result.rows;
};

const recordWebhookDelivery = async ({
  webhookId,
  eventName,
  payload,
  status = "pending",
  responseCode = null
}) => {
  const result = await query(
    `INSERT INTO webhook_deliveries
     (webhook_id, event_name, payload, status, response_code, delivered_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      webhookId,
      eventName,
      JSON.stringify(payload),
      status,
      responseCode,
      status === "success" ? new Date() : null
    ]
  );

  return result.rows[0];
};

module.exports = {
  createWebhookSecret,
  createSignature,
  createWebhook,
  getEventWebhooks,
  recordWebhookDelivery
};