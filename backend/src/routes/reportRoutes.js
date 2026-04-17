const express = require("express");
const router = express.Router();
const { updateReportStatus } = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleware");

router.put("/:id/status", authMiddleware, updateReportStatus);

module.exports = router;