const express = require("express");

const {
  getGalleryWidget,
  getGalleryWidgetDataJson
} = require("../controllers/galleryWidgetController");

const router = express.Router();

router.get(
  "/:eventId",
  getGalleryWidget
);

router.get(
  "/:eventId/data",
  getGalleryWidgetDataJson
);

module.exports = router;