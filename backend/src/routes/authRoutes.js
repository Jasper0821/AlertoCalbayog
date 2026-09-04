const express = require("express");
const router = express.Router();
const {
  register,
  requestRegistrationOtp,
  verifyRegistrationOtp,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  googleLogin,
  googleRegister,
  facebookLogin,
  facebookRegister,
  verifySession,
  acceptTerms,
} = require("../controllers/authController");
const { registerLimiter, loginLimiter, otpLimiter } = require("../middleware/rateLimiters");

router.post("/register", registerLimiter, register);
router.post("/request-registration-otp", otpLimiter, requestRegistrationOtp);
router.post("/verify-registration-otp", verifyRegistrationOtp);
router.post("/login", loginLimiter, login);
router.post("/google-login", loginLimiter, googleLogin);
router.post("/google-register", registerLimiter, googleRegister);
router.post("/facebook-login", facebookLogin);
router.post("/facebook-register", facebookRegister);
router.post("/accept-terms", acceptTerms);

router.get("/me", verifySession);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
