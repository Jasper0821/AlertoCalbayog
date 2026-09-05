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
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// Render terminates TLS at its edge, so the real client IP only exists in
// X-Forwarded-For. Without this the rate limiters would key every request in
// production to the same proxy address and throttle all residents as one client.
app.set("trust proxy", 1);

app.use(cors());

app.use(express.json({ limit: '30mb' }));

// Database connection health check middleware
app.use((req, res, next) => {
  if (req.path === "/" || req.path.startsWith("/health")) return next();
  // Signing an upload touches no collection. Letting it through while Mongo is
  // still connecting means a resident's photos upload during the ~20s cold start
  // instead of after it, so only the small report POST waits on the database.
  if (req.path.startsWith("/api/uploads/")) return next();
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
app.use("/api/uploads", uploadRoutes);

app.get("/", (req, res) => {
  res.send("AlertoCalbayog API is running");
});

// Cheap wake-up target for the mobile app. Deliberately skips the database guard
// above so a cold Render instance can answer while Mongo is still connecting.
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "connecting",
    mailer: Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASS),
    time: new Date().toISOString(),
  });
});

module.exports = app;
