const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

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

// Database connection health check middleware
app.use((req, res, next) => {
  if (req.path === "/" || req.path.startsWith("/health")) return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "Database connection is currently unavailable. Please check your internet connection or MongoDB Atlas network access and try again."
    });
  }
  next();
});

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
