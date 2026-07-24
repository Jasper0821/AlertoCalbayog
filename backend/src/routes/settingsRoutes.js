const express = require("express");
const router = express.Router();
const { getSettings, updateSettings } = require("../controllers/settingsController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Admin only settings management
router.get("/", authMiddleware, roleMiddleware("admin"), getSettings);
router.post("/", authMiddleware, roleMiddleware("admin"), updateSettings);

module.exports = router;
