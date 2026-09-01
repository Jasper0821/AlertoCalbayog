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

router.post("/register", register);
router.post("/request-registration-otp", requestRegistrationOtp);
router.post("/verify-registration-otp", verifyRegistrationOtp);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/google-register", googleRegister);
router.post("/facebook-login", facebookLogin);
router.post("/facebook-register", facebookRegister);
router.post("/accept-terms", acceptTerms);

router.get("/me", verifySession);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
