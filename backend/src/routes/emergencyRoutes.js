const express = require("express");
const router = express.Router();
const {
  createEmergencyReport,
  getAllReports,
  getReportsByAgency
} = require("../controllers/emergencyController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createEmergencyReport);
router.get("/", authMiddleware, getAllReports);
router.get("/agency/:agency", authMiddleware, getReportsByAgency);

module.exports = router;