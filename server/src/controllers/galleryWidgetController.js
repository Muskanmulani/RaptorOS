const { query } = require("../config/db");
const {
  getGalleryWidgetData,
  generateGalleryWidget
} = require("../services/galleryWidgetService");

const getGalleryWidget = async (req, res) => {
  try {
    const { eventId } = req.params;

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

    const projects = await getGalleryWidgetData(eventId);

    const widget = generateGalleryWidget(
      eventId,
      projects
    );

    res.type("html").send(widget);
  } catch (error) {
    console.error("Gallery widget error:", error);

    res.status(500).json({
      message: "Failed to generate gallery widget"
    });
  }
};

const getGalleryWidgetDataJson = async (req, res) => {
  try {
    const { eventId } = req.params;

    const projects = await getGalleryWidgetData(eventId);

    res.json({
      eventId,
      projectCount: projects.length,
      projects
    });
  } catch (error) {
    console.error("Gallery widget data error:", error);

    res.status(500).json({
      message: "Failed to fetch gallery widget data"
    });
  }
};

module.exports = {
  getGalleryWidget,
  getGalleryWidgetDataJson
};