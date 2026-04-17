const express = require("express");
const router = express.Router();
const {
  createEmergencyReport,
  getAllReports
} = require("../controllers/emergencyController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createEmergencyReport);
router.get("/", authMiddleware, getAllReports);

module.exports = router;