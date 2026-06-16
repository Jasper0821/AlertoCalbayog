const User = require("../models/User");
const Otp = require("../models/Otp");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/mailer");

const createSystemNotification = async ({ userId = null, recipientRole = "admin", title, message, category = "system", type = "system_event", reportId = null, metadata = {} }) => {
  return Notification.create({
    userId,
    recipientRole,
    title,
    message,
    category,
    type,
    reportId,
    metadata,
  });
};

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    ""
  );
}

function getSource(req) {
  const appSource = req.headers["x-app-source"] || req.headers["x-source"];
  if (appSource) return appSource;
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  if (ua.includes("android") || ua.includes("iphone") || ua.includes("ipad") || ua.includes("mobile") || ua.includes("expo")) return "mobile";
  if (ua.includes("postman") || ua.includes("insomnia")) return "api-client";
  return "web";
}

function getUserAgent(req) {
  return req.headers["user-agent"] || "";
}

const normalizeEmail = (email) => email?.toString().trim().toLowerCase();
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const findUserByEmail = async (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return User.findOne({
    email: { $regex: `^${escapeRegExp(normalized)}$`, $options: "i" },
  });
};

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

exports.register = async (req, res) => {
  console.log("Registration request received:", req.body);
  try {
    const { fullName, email, password, role, agency, phoneNumber } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      username: normalizedEmail,
      email: normalizedEmail,
      password: hashedPassword,
      visiblePassword: password,
      role: role || "resident",
      agency: agency || "NONE",
      phoneNumber,
    });

    await AuditLog.create({
      category: "user_activity",
      action: "register",
      actorId: user._id,
      actorName: user.fullName,
      actorEmail: user.email,
      actorRole: user.role,
      details: `User account registered: ${user.fullName} (${user.role})`,
      source: getSource(req),
      userAgent: getUserAgent(req),
      ipAddress: getIp(req),
    });

    await createSystemNotification({
      title: "New user registration",
      message: `${user.fullName} has registered as a ${user.role}.`,
      recipientRole: "admin",
      category: "user_event",
      type: "user_event",
      metadata: { userId: user._id.toString(), role: user.role, agency: user.agency },
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
    const normalizedEmail = normalizeEmail(email);

    const user = await findUserByEmail(normalizedEmail);
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
      source: getSource(req),
      userAgent: getUserAgent(req),
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

    const normalizedEmail = normalizeEmail(email);
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      await AuditLog.create({
        category: "password_security",
        action: "otp_requested",
        actorName: "Unknown",
        actorEmail: normalizedEmail,
        details: "Password reset OTP requested for an unrecognized email address.",
        source: getSource(req),
        userAgent: getUserAgent(req),
        ipAddress: getIp(req),
      });
      return res.status(404).json({ message: "No account found for that email address." });
    }

    const recipientEmail = normalizeEmail(user.email);

    await Otp.deleteMany({ email: recipientEmail });

    const code = String(Math.floor(100000 + Math.random() * 900000));

    await Otp.create({
      email: recipientEmail,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await sendOtpEmail(recipientEmail, code);

    await AuditLog.create({
      category: "password_security",
      action: "otp_sent",
      actorId: user._id,
      actorName: user.fullName,
      actorEmail: recipientEmail,
      actorRole: user.role,
      otpCode: code,
      details: `OTP sent to ${recipientEmail} for password reset. Expires in 5 minutes.`,
      source: getSource(req),
      userAgent: getUserAgent(req),
      ipAddress: getIp(req),
    });

    await createSystemNotification({
      recipientRole: "admin",
      title: "Password reset requested",
      message: `OTP code sent to ${recipientEmail} for password reset.`,
      category: "password_security",
      type: "system_event",
      metadata: { email: recipientEmail, action: "otp_sent" },
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

    const normalizedEmail = email.toLowerCase().trim();
    const record = await Otp.findOne({
      email: normalizedEmail,
      code,
      used: false,
    });

    if (!record) {
      const user = await findUserByEmail(normalizedEmail);
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

    const user = await findUserByEmail(normalizedEmail);

    await AuditLog.create({
      category: "password_security",
      action: "otp_verified",
      actorId: user?._id || null,
      actorName: user?.fullName || "Unknown",
      actorEmail: normalizedEmail,
      actorRole: user?.role || "",
      otpCode: code,
      otpVerifiedAt: new Date(),
      details: `OTP code verified successfully for ${normalizedEmail}.`,
      source: getSource(req),
      userAgent: getUserAgent(req),
      ipAddress: getIp(req),
    });

    await createSystemNotification({
      recipientRole: "admin",
      title: "OTP verification completed",
      message: `OTP verification successful for ${email}.`,
      category: "password_security",
      type: "system_event",
      metadata: { email: email.toLowerCase().trim(), action: "otp_verified" },
    });

    const resetToken = jwt.sign(
      { email: normalizedEmail, purpose: "password-reset" },
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

    const user = await findUserByEmail(decoded.email);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.visiblePassword = newPassword;
    await user.save();

    await AuditLog.create({
      category: "password_security",
      action: "password_reset",
      actorId: user._id,
      actorName: user.fullName,
      actorEmail: user.email,
      actorRole: user.role,
      details: `Password was successfully reset for account ${user.email}.`,
      source: getSource(req),
      userAgent: getUserAgent(req),
      ipAddress: getIp(req),
    });

    await createSystemNotification({
      recipientRole: "admin",
      title: "Password reset completed",
      message: `Password reset completed for account ${user.email}.`,
      category: "password_security",
      type: "system_event",
      metadata: { email: user.email, action: "password_reset" },
    });

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: error.message });
  }
};