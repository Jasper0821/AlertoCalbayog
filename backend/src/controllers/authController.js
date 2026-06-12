const User = require("../models/User");
const Otp = require("../models/Otp");
const AuditLog = require("../models/AuditLog");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/mailer");

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    ""
  );
}

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

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

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      await AuditLog.create({
        category: "user_activity",
        action: "login_failed",
        actorEmail: email,
        actorName: "Unknown",
        details: "Login attempt with unregistered email.",
        ipAddress: getIp(req),
      });
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await AuditLog.create({
        category: "user_activity",
        action: "login_failed",
        actorId: user._id,
        actorName: user.fullName,
        actorEmail: user.email,
        actorRole: user.role,
        details: "Login attempt with incorrect password.",
        ipAddress: getIp(req),
      });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    await AuditLog.create({
      category: "user_activity",
      action: "login_success",
      actorId: user._id,
      actorName: user.fullName,
      actorEmail: user.email,
      actorRole: user.role,
      details: `Successful login for ${user.role} account.`,
      ipAddress: getIp(req),
    });

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

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(200).json({ message: "If that email exists, an OTP has been sent." });
    }

    await Otp.deleteMany({ email: email.toLowerCase().trim() });

    const code = String(Math.floor(100000 + Math.random() * 900000));

    await Otp.create({
      email: email.toLowerCase().trim(),
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await sendOtpEmail(email, code);

    await AuditLog.create({
      category: "password_security",
      action: "otp_sent",
      actorId: user._id,
      actorName: user.fullName,
      actorEmail: user.email,
      actorRole: user.role,
      otpCode: code,
      details: `OTP sent to ${email} for password reset. Expires in 5 minutes.`,
      ipAddress: getIp(req),
    });

    res.status(200).json({ message: "OTP sent to your email address." });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

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
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      await AuditLog.create({
        category: "password_security",
        action: "otp_failed",
        actorId: user?._id || null,
        actorName: user?.fullName || "Unknown",
        actorEmail: email,
        actorRole: user?.role || "",
        details: "OTP verification failed — invalid or already used code.",
        ipAddress: getIp(req),
      });
      return res.status(400).json({ message: "Invalid OTP code. Please check your email." });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    record.used = true;
    await record.save();

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    await AuditLog.create({
      category: "password_security",
      action: "otp_verified",
      actorId: user?._id || null,
      actorName: user?.fullName || "Unknown",
      actorEmail: email,
      actorRole: user?.role || "",
      otpCode: code,
      otpVerifiedAt: new Date(),
      details: `OTP code verified successfully for ${email}.`,
      ipAddress: getIp(req),
    });

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

    await AuditLog.create({
      category: "password_security",
      action: "password_reset",
      actorId: user._id,
      actorName: user.fullName,
      actorEmail: user.email,
      actorRole: user.role,
      details: `Password was successfully reset for account ${user.email}.`,
      ipAddress: getIp(req),
    });

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: error.message });
  }
};