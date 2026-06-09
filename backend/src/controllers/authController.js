const User = require("../models/User");
const Otp = require("../models/Otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/mailer");

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ─── Register ───────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  console.log("Registration request received:", req.body);
  try {
    const { fullName, email, password, role, agency, phoneNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      username: email,
      email,
      password: hashedPassword,
      role: role || "resident",
      agency: agency || "NONE",
      phoneNumber,
    });

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        agency: user.agency,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Login ──────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        agency: user.agency,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Forgot Password — generate & email OTP ─────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return 200 to avoid leaking whether the email exists
      return res.status(200).json({ message: "If that email exists, an OTP has been sent." });
    }

    // Delete any previous unused OTPs for this email
    await Otp.deleteMany({ email: email.toLowerCase().trim() });

    // Generate a random 6-digit numeric code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Persist to database — expires in 10 minutes
    await Otp.create({
      email: email.toLowerCase().trim(),
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send the code via Gmail
    await sendOtpEmail(email, code);

    res.status(200).json({ message: "OTP sent to your email address." });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

// ─── Verify OTP ─────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email and OTP code are required" });
    }

    const record = await Otp.findOne({
      email: email.toLowerCase().trim(),
      code,
      used: false,
    });

    if (!record) {
      return res.status(400).json({ message: "Invalid OTP code. Please check your email." });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Mark as used — prevents replay attacks
    record.used = true;
    await record.save();

    // Issue a short-lived (5 min) reset token
    const resetToken = jwt.sign(
      { email: email.toLowerCase().trim(), purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    res.status(200).json({ message: "OTP verified successfully.", resetToken });
  } catch (error) {
    console.error("verifyOtp error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Reset Password ──────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: "Reset token and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: "Reset session expired. Please start over." });
    }

    if (decoded.purpose !== "password-reset") {
      return res.status(400).json({ message: "Invalid reset token." });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: error.message });
  }
};