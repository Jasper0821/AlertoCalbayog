const express = require("express");
const router = express.Router();
const { assignReportResponder, updateReportStatus } = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleware");

router.put("/:id/status", authMiddleware, updateReportStatus);
router.put("/:id/assign", authMiddleware, assignReportResponder);

module.exports = router;
