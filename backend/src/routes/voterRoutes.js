const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { voterVerifyLimiter, voterVerifyIpLimiter } = require("../middleware/rateLimiters");
const {
  getRequirements,
  importVoters,
  getStatus,
  resolveDispute,
  deleteVoters,
  verifyMe,
} = require("../controllers/voterController");

router.get("/requirements", getRequirements);
router.post("/verify", voterVerifyIpLimiter, authMiddleware, voterVerifyLimiter, verifyMe);

router.get("/status", authMiddleware, roleMiddleware("admin"), getStatus);
router.post("/import", authMiddleware, roleMiddleware("admin"), importVoters);
router.post("/disputes/:id/resolve", authMiddleware, roleMiddleware("admin"), resolveDispute);
router.delete("/", authMiddleware, roleMiddleware("admin"), deleteVoters);

module.exports = router;
