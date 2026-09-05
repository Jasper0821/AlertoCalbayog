const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { signUpload, isConfigured } = require("../utils/cloudinary");
const { otpLimiter } = require("../middleware/rateLimiters");

/**
 * Hands an authenticated client the short-lived signature it needs to upload one
 * image directly to Cloudinary. Rate limited because each call authorises an
 * upload against our account.
 *
 * Responds 503 (not 500) when Cloudinary is unconfigured, so clients can cleanly
 * fall back to inline base64 rather than failing the report.
 */
router.get("/signature", protect, otpLimiter, (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      message: "Image hosting is not configured on the server.",
      configured: false,
    });
  }

  const kind = req.query.kind === "resolution" ? "resolution" : "proof";
  const credentials = signUpload(kind);

  if (!credentials) {
    return res.status(503).json({
      message: "Unable to sign the upload request.",
      configured: false,
    });
  }

  res.json({ configured: true, ...credentials });
});

module.exports = router;
