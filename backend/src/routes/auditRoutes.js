const express = require("express");
const router = express.Router();
const { createLog, getLogs } = require("../controllers/auditController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Admin only — fetch all audit logs
router.get("/", authMiddleware, roleMiddleware("admin"), getLogs);

// Authenticated — create a log entry (from frontend)
router.post("/", authMiddleware, createLog);

module.exports = router;
