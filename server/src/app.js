
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const eventRoutes = require("./routes/eventRoutes");
const teamRoutes = require("./routes/teamRoutes");
const projectRoutes = require("./routes/projectRoutes");
const judgingRoutes = require("./routes/judgingRoutes");
const auditRoutes = require("./routes/auditRoutes");
const votingRoutes = require("./routes/votingRoutes");
const conflictRoutes = require("./routes/conflictRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const healthRoutes = require("./routes/healthRoutes");
const jevRoutes = require("./routes/jevRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const judgeRecordRoutes = require("./routes/judgeRecordRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const importRoutes = require("./routes/importRoutes");
const galleryWidgetRoutes = require("./routes/galleryWidgetRoutes");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/judging", judgingRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/voting", votingRoutes);
app.use("/api/conflicts", conflictRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/jev", jevRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/judge-records", judgeRecordRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/import", importRoutes);
app.use("/api/gallery-widget", galleryWidgetRoutes);
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "RaptorOS API",
    statusCode: 200
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  res.status(500).json({
    message: "Internal server error"
  });
});

module.exports = app;
