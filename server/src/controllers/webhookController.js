const { query } = require("../config/db");
const {
  createWebhook,
  getEventWebhooks,
  recordWebhookDelivery
} = require("../services/webhookService");

const createEventWebhook = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { url } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({
        message: "Webhook URL is required"
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

    const webhook = await createWebhook({
      eventId,
      url: url.trim()
    });

    res.status(201).json({
      message: "Webhook created",
      webhook
    });
  } catch (error) {
    console.error("Create webhook error:", error);

    res.status(500).json({
      message: "Failed to create webhook"
    });
  }
};

const getWebhooks = async (req, res) => {
  try {
    const { eventId } = req.params;

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

    const webhooks = await getEventWebhooks(eventId);

    res.json({
      eventId,
      webhooks
    });
  } catch (error) {
    console.error("Get webhooks error:", error);

    res.status(500).json({
      message: "Failed to fetch webhooks"
    });
  }
};

const getWebhookDeliveries = async (req, res) => {
  try {
    const { webhookId } = req.params;

    const result = await query(
      `SELECT
        id,
        webhook_id,
        event_name,
        payload,
        status,
        response_code,
        delivered_at,
        created_at
       FROM webhook_deliveries
       WHERE webhook_id = $1
       ORDER BY created_at DESC`,
      [webhookId]
    );

    res.json({
      webhookId,
      deliveries: result.rows
    });
  } catch (error) {
    console.error("Get webhook deliveries error:", error);

    res.status(500).json({
      message: "Failed to fetch webhook deliveries"
    });
  }
};

const recordTestDelivery = async (req, res) => {
  try {
    const { webhookId } = req.params;
    const { eventName = "TEST_EVENT", payload = {} } = req.body;

    const webhookResult = await query(
      `SELECT id, event_id, url
       FROM webhook_endpoints
       WHERE id = $1`,
      [webhookId]
    );

    if (webhookResult.rows.length === 0) {
      return res.status(404).json({
        message: "Webhook not found"
      });
    }

    const delivery = await recordWebhookDelivery({
      webhookId,
      eventName,
      payload,
      status: "pending"
    });

    res.status(201).json({
      message: "Webhook delivery recorded",
      delivery
    });
  } catch (error) {
    console.error("Record webhook delivery error:", error);

    res.status(500).json({
      message: "Failed to record webhook delivery"
    });
  }
};

module.exports = {
  createEventWebhook,
  getWebhooks,
  getWebhookDeliveries,
  recordTestDelivery
};