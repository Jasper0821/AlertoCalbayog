const express = require("express");
const router = express.Router();
const { updateTracking } = require("../controllers/trackingController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/update", authMiddleware, updateTracking);

module.exports = router;
