const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { voterIdLimiter } = require("../middleware/rateLimiters");
const {
  getRequirements,
  getUploadSignature,
  submit,
  withdraw,
  listRequests,
  approve,
  reject,
} = require("../controllers/voterIdController");

const resident = [authMiddleware, roleMiddleware("resident"), voterIdLimiter];
const admin = [authMiddleware, roleMiddleware("admin")];

router.get("/requirements", getRequirements);
router.get("/upload-signature", ...resident, getUploadSignature);
router.post("/", ...resident, submit);
router.delete("/me", ...resident, withdraw);

router.get("/requests", ...admin, listRequests);
router.post("/requests/:userId/approve", ...admin, approve);
router.post("/requests/:userId/reject", ...admin, reject);

module.exports = router;
