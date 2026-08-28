const User = require("../models/User");
const Otp = require("../models/Otp");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOtpEmail, sendRegistrationOtpEmail } = require("../utils/mailer");
const { getSettingValue } = require("./settingsController");

const OTP_EXPIRY_MINUTES = 7;

// Validates password complexity based on the stored securityConfig setting
const checkPasswordComplexity = async (password) => {
  const securityConfig = await getSettingValue("securityConfig");
  if (securityConfig && securityConfig.complexPassword) {
    if (!password || password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number.";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return "Password must contain at least one special character.";
    }
  }
  return null; // null means password passes
};

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
const normalizeOtpCode = (code) => code?.toString().replace(/\D/g, "").slice(0, 6);
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

    if (!normalizedEmail || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please use a valid Gmail address." });
    }

    const registrationToken = req.body.registrationToken;
    if (!registrationToken) {
      return res.status(400).json({ message: "Please verify your Gmail address before registering." });
    }

    let registration;
    try {
      registration = jwt.verify(registrationToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: "Your Gmail verification has expired. Please request a new code." });
    }
    if (registration.purpose !== "registration" || registration.email !== normalizedEmail) {
      return res.status(400).json({ message: "This Gmail verification does not match the email address entered." });
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Enforce password complexity policy from system settings
    const complexityError = await checkPasswordComplexity(password);
    if (complexityError) {
      return res.status(400).json({ message: complexityError });
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
      status: role === "responder" ? "pending" : "approved",
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

    // Responders need admin approval before they can log in
    if (user.role === "responder") {
      return res.status(201).json({
        message: "Registration submitted. Your account is pending admin approval.",
        pendingApproval: true,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          agency: user.agency,
          status: user.status,
        },
      });
    }

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        agency: user.agency,
        phoneNumber: user.phoneNumber,
        status: user.status,
        avatar: user.avatar,
        employeeId: user.employeeId,
        rank: user.rank,
        bio: user.bio,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.requestRegistrationOtp = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    if (!normalizedEmail || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid Gmail address." });
    }
    if (await findUserByEmail(normalizedEmail)) {
      return res.status(400).json({ message: "An account already exists for this Gmail address." });
    }

    await Otp.deleteMany({ email: normalizedEmail, purpose: "registration" });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await Otp.create({
      email: normalizedEmail,
      code,
      purpose: "registration",
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });
    await sendRegistrationOtpEmail(normalizedEmail, code, OTP_EXPIRY_MINUTES);
    return res.status(200).json({ message: "Verification code sent to your Gmail address." });
  } catch (error) {
    console.error("requestRegistrationOtp error:", error);
    return res.status(500).json({ message: error.message || "Unable to verify this Gmail address." });
  }
};

exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const normalizedCode = normalizeOtpCode(req.body.code);
    if (!normalizedEmail || normalizedCode?.length !== 6) {
      return res.status(400).json({ message: "Enter your Gmail address and the complete 6-digit code." });
    }
    const record = await Otp.findOne({ email: normalizedEmail, purpose: "registration", used: false }).sort({ expiresAt: -1 });
    if (!record || record.expiresAt < new Date() || record.code !== normalizedCode) {
      return res.status(400).json({ message: "The verification code is invalid or has expired. Please request a new code." });
    }
    record.used = true;
    await record.save();
    const registrationToken = jwt.sign({ email: normalizedEmail, purpose: "registration" }, process.env.JWT_SECRET, { expiresIn: "10m" });
    return res.status(200).json({ message: "Gmail address verified.", registrationToken });
  } catch (error) {
    console.error("verifyRegistrationOtp error:", error);
    return res.status(500).json({ message: "Unable to verify the Gmail code. Please try again." });
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

    if (user.role === "responder" && user.status === "pending") {
      await AuditLog.create({
        category: "user_activity",
        action: "login_failed",
        actorId: user._id,
        actorName: user.fullName,
        actorEmail: user.email,
        actorRole: user.role,
        details: "Login blocked: responder account pending approval.",
        ipAddress: getIp(req),
      });
      return res.status(403).json({ message: "Your responder account is pending admin approval." });
    }

    if (user.role === "responder" && user.status === "declined") {
      await AuditLog.create({
        category: "user_activity",
        action: "login_failed",
        actorId: user._id,
        actorName: user.fullName,
        actorEmail: user.email,
        actorRole: user.role,
        details: "Login blocked: responder account registration declined.",
        ipAddress: getIp(req),
      });
      return res.status(403).json({ message: "Your responder account registration request was declined." });
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
        username: user.username,
        email: user.email,
        role: user.role,
        agency: user.agency,
        phoneNumber: user.phoneNumber,
        status: user.status,
        avatar: user.avatar,
        employeeId: user.employeeId,
        rank: user.rank,
        bio: user.bio,
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
      purpose: "password-reset",
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    await sendOtpEmail(recipientEmail, code, OTP_EXPIRY_MINUTES);

    await AuditLog.create({
      category: "password_security",
      action: "otp_sent",
      actorId: user._id,
      actorName: user.fullName,
      actorEmail: recipientEmail,
      actorRole: user.role,
      otpCode: code,
      details: `OTP sent to ${recipientEmail} for password reset. Expires in ${OTP_EXPIRY_MINUTES} minutes.`,
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

    const normalizedEmail = normalizeEmail(email);
    const normalizedCode = normalizeOtpCode(code);

    if (normalizedCode.length !== 6) {
      return res.status(400).json({ message: "Please enter the complete 6-digit OTP code." });
    }

    // There is only one usable code per email. Looking it up first makes the
    // comparison resilient to input formatting and gives accurate expiry feedback.
    const record = await Otp.findOne({
      email: normalizedEmail,
      purpose: "password-reset",
      used: false,
    }).sort({ expiresAt: -1 });

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
      return res.status(400).json({ message: "No active OTP was found. Please request a new code." });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (record.code !== normalizedCode) {
      const user = await findUserByEmail(normalizedEmail);
      await AuditLog.create({
        category: "password_security",
        action: "otp_failed",
        actorId: user?._id || null,
        actorName: user?.fullName || "Unknown",
        actorEmail: normalizedEmail,
        actorRole: user?.role || "",
        details: "OTP verification failed — incorrect or superseded code.",
        ipAddress: getIp(req),
      });
      return res.status(400).json({ message: "That code is not the latest OTP. Please use the most recently requested code or request a new one." });
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
      otpCode: normalizedCode,
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

exports.googleLogin = async (req, res) => {
  try {
    const { idToken, googleId, email, fullName, avatar } = req.body;

    let googleUser = null;

    // 1. If idToken is provided, verify it directly with Google TokenInfo API for maximum security
    if (idToken) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          googleUser = {
            googleId: payload.sub,
            email: normalizeEmail(payload.email),
            fullName: payload.name || payload.email?.split("@")[0] || "Google User",
            avatar: payload.picture || "",
          };
        } else {
          console.warn("Google tokeninfo response not OK:", verifyRes.status);
        }
      } catch (tokenErr) {
        console.error("Failed to verify Google ID token with Google API:", tokenErr);
      }
    }

    // 2. Fallback to provided payload if idToken couldn't be verified directly
    if (!googleUser && googleId && email) {
      googleUser = {
        googleId,
        email: normalizeEmail(email),
        fullName: fullName || email.split("@")[0],
        avatar: avatar || "",
      };
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({ message: "Invalid Google credentials or unverified token." });
    }

    const { googleId: gId, email: gEmail, fullName: gName, avatar: gAvatar, password } = googleUser;

    // 3. Check if user exists by googleId
    let user = await User.findOne({ googleId: gId });

    // 4. Account Binding & Password Verification: If not found by googleId, check if user exists by email
    if (!user) {
      user = await findUserByEmail(gEmail);
      if (user) {
        // If the user has a password set and password is not provided yet, request password confirmation
        if (user.password && !password) {
          return res.status(200).json({
            requiresPassword: true,
            email: gEmail,
            message: "An existing account was found for this email. Please enter your password to bind your Google account.",
          });
        }

        // Verify provided password if account has password
        if (user.password && password) {
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password. Could not verify and bind Google account." });
          }
        }

        // Link Google ID to existing account & mark email as verified by Google
        user.googleId = gId;
        user.isEmailVerified = true;
        user.authProvider = "google";
        if (gAvatar && !user.avatar) {
          user.avatar = gAvatar;
        }
      }
    }

    // 5. If user still does not exist, create new user account automatically
    if (!user) {
      user = await User.create({
        fullName: gName,
        username: gEmail,
        email: gEmail,
        googleId: gId,
        avatar: gAvatar,
        role: "resident",
        status: "approved",
        isEmailVerified: true,
        authProvider: "google",
      });

      await createSystemNotification({
        title: "New Google user registration",
        message: `${user.fullName} registered using Google.`,
        recipientRole: "admin",
        category: "user_event",
        type: "user_event",
        metadata: { userId: user._id.toString(), role: user.role },
      });
    }

    // Check account status if responder
    if (user.role === "responder" && user.status === "pending") {
      return res.status(403).json({ message: "Your responder account is pending admin approval." });
    }
    if (user.role === "responder" && user.status === "declined") {
      return res.status(403).json({ message: "Your responder account registration request was declined." });
    }

    // Update login timestamps and verification status
    user.isEmailVerified = true;
    if (!user.authProvider || user.authProvider === "local") {
      user.authProvider = "google";
    }
    user.lastLogin = new Date();
    user.lastSeen = new Date();
    await user.save();

    await AuditLog.create({
      category: "user_activity",
      action: "google_login_success",
      actorId: user._id,
      actorName: user.fullName,
      actorEmail: user.email,
      actorRole: user.role,
      details: `Successful Google sign-in for ${user.email}`,
      source: getSource(req),
      userAgent: getUserAgent(req),
      ipAddress: getIp(req),
    });

    res.json({
      message: "Google sign-in successful",
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        agency: user.agency,
        phoneNumber: user.phoneNumber,
        status: user.status,
        avatar: user.avatar,
        googleId: user.googleId,
        employeeId: user.employeeId,
        rank: user.rank,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error("googleLogin error:", error);
    res.status(500).json({ message: error.message || "Google Authentication failed" });
  }
};

exports.verifySession = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User account no longer exists." });
    }

    if (user.role === "responder" && user.status !== "approved") {
      return res.status(403).json({ message: "Your responder account status is not approved." });
    }

    user.lastSeen = new Date();
    await user.save();

    res.json({
      valid: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        agency: user.agency,
        phoneNumber: user.phoneNumber,
        status: user.status,
        avatar: user.avatar,
        googleId: user.googleId,
        employeeId: user.employeeId,
        rank: user.rank,
        bio: user.bio,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired session token" });
  }
};

