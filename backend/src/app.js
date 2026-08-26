const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const auditRoutes = require("./routes/auditRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const backupRoutes = require("./routes/backupRoutes");

const app = express();

app.use(cors());

app.use(express.json({ limit: '30mb' }));


app.use("/api/auth", authRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/backup", backupRoutes);

app.get("/", (req, res) => {
  res.send("AlertoCalbayog API is running");
});

module.exports = app;
