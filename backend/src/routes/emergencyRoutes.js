const express = require("express");
const router = express.Router();
const {
  createEmergencyReport,
  getAllReports,
  getReportsByAgency
} = require("../controllers/emergencyController");
const { updateReportStatus } = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createEmergencyReport);
router.get("/", authMiddleware, getAllReports);
router.get("/agency/:agency", authMiddleware, getReportsByAgency);
router.put("/:id", authMiddleware, updateReportStatus);

module.exports = router;