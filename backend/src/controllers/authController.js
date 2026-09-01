const User = require("../models/User");
const Otp = require("../models/Otp");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const TermsAcceptance = require("../models/TermsAcceptance");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOtpEmail, sendRegistrationOtpEmail } = require("../utils/mailer");
const { getSettingValue } = require("./settingsController");

const OTP_EXPIRY_MINUTES = 7;
const CURRENT_TERMS_VERSION = process.env.CURRENT_TERMS_VERSION || "1.0";
const CURRENT_PRIVACY_VERSION = process.env.CURRENT_PRIVACY_VERSION || "1.0";


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
    return res.status(500).json({ message: error.message || "Failed to send verification code. Please try again." });
  }
};

exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const rawCode = req.body.code || req.body.otpCode || req.body.verificationCode;
    const normalizedCode = normalizeOtpCode(rawCode);
    if (!normalizedEmail || normalizedCode?.length !== 6) {
      return res.status(400).json({ message: "Enter your Gmail address and the complete 6-digit code." });
    }
    const record = await Otp.findOne({ email: normalizedEmail, purpose: "registration", used: false }).sort({ expiresAt: -1 });
    if (!record) {
      return res.status(400).json({ message: "No active verification code found for this Gmail address. Please request a new code." });
    }
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "The verification code has expired. Please request a new code." });
    }
    if (String(record.code).trim() !== normalizedCode) {
      return res.status(400).json({ message: "Incorrect verification code. Please check the code sent to your email." });
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

    user.lastLogin = new Date();
    user.lastSeen = new Date();
    await user.save();

    res.json({
      message: "Login successful",
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        agency: user.agency,
        phoneNumber: user.phoneNumber || "",
        status: user.status,
        avatar: user.avatar || "",
        employeeId: user.employeeId,
        rank: user.rank,
        bio: user.bio,
        barangay: user.barangay || "",
        completeAddress: user.completeAddress || "",
        accountStatus: user.accountStatus || "active",
        residentVerificationStatus: user.residentVerificationStatus || "pending",
        authProvider: user.authProvider || "local",
        isEmailVerified: user.isEmailVerified || false,
        googleId: user.googleId || "",
        googleVerified: !!user.googleId,
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
    const email = req.body.email;
    const code = req.body.code || req.body.otpCode || req.body.verificationCode;
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
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(401).json({
        message: "Google Verification Failed: Missing Google ID token. Please authenticate via Google."
      });
    }

    let googleUser = null;
    try {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (verifyRes.ok) {
        const payload = await verifyRes.json();
        if (payload.email_verified === "true" || payload.email_verified === true) {
          googleUser = {
            sub: payload.sub,
            email: normalizeEmail(payload.email),
            fullName: payload.name || payload.email?.split("@")[0] || "Google User",
            avatar: payload.picture || "",
          };
        } else {
          return res.status(401).json({ message: "Google Verification Failed: Email address is not verified by Google." });
        }
      } else {
        console.warn("Google tokeninfo API error:", verifyRes.status);
        return res.status(401).json({ message: "Google Verification Failed: Invalid or expired Google ID token." });
      }
    } catch (tokenErr) {
      console.error("Failed to verify Google ID token with Google API:", tokenErr);
      return res.status(401).json({ message: "Google Verification Failed: Unable to contact Google authentication servers." });
    }

    if (!googleUser || !googleUser.sub || !googleUser.email) {
      return res.status(401).json({ message: "Invalid Google account credentials." });
    }

    const { sub, email: gEmail, fullName: gName, avatar: gAvatar } = googleUser;

    // Check database for existing resident by googleId (sub) or verified email
    let user = await User.findOne({ googleId: sub });
    if (!user) {
      user = await findUserByEmail(gEmail);
    }

    // Existing User Flow
    if (user) {
      if (user.accountStatus === "suspended" || user.accountStatus === "deactivated") {
        return res.status(403).json({ message: `Your account is currently ${user.accountStatus}. Please contact support.` });
      }
      if (user.role === "responder" && user.status === "pending") {
        return res.status(403).json({ message: "Your responder account is pending admin approval." });
      }
      if (user.role === "responder" && user.status === "declined") {
        return res.status(403).json({ message: "Your responder account registration request was declined." });
      }

      user.googleId = sub;
      user.googleVerified = true;
      user.isEmailVerified = true;
      if (!user.authProvider || user.authProvider === "local") {
        user.authProvider = "google";
      }
      if (gAvatar && !user.avatar) {
        user.avatar = gAvatar;
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
        details: `Successful Google sign-in for ${user.email} (sub: ${sub})`,
        source: getSource(req),
        userAgent: getUserAgent(req),
        ipAddress: getIp(req),
      });

      const termsRecord = await TermsAcceptance.findOne({
        userId: user._id,
        termsVersion: CURRENT_TERMS_VERSION,
      });

      return res.json({
        message: "Google sign-in successful",
        isNewResident: false,
        token: generateToken(user._id, user.role),
        termsAccepted: !!termsRecord,
        termsVersion: CURRENT_TERMS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
        user: {
          id: user._id,
          _id: user._id,
          resident_id: user._id.toString(),
          google_sub: user.googleId || sub,
          google_email: user.email,
          fullName: user.fullName,
          full_name: user.fullName,
          email: user.email,
          username: user.email,
          avatar: user.avatar,
          profile_picture: user.avatar,
          phoneNumber: user.phoneNumber || "",
          phone_number: user.phoneNumber || "",
          barangay: user.barangay || "",
          completeAddress: user.completeAddress || "",
          complete_address: user.completeAddress || "",
          googleVerified: true,
          google_verified: true,
          residentVerificationStatus: user.residentVerificationStatus || "pending",
          resident_verification_status: user.residentVerificationStatus || "pending",
          accountStatus: user.accountStatus || "active",
          account_status: user.accountStatus || "active",
          role: user.role,
          agency: user.agency,
          status: user.status,
        },
      });
    }

    // New User Flow: Generate short-lived registration token containing verified Google payload
    const googleRegistrationToken = jwt.sign(
      {
        purpose: "google-registration",
        googleSub: sub,
        email: gEmail,
        fullName: gName,
        avatar: gAvatar,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      message: "Google account authenticated. Please complete resident profile details.",
      isNewResident: true,
      requiresProfileCompletion: true,
      googleRegistrationToken,
      googleUser: {
        google_sub: sub,
        google_email: gEmail,
        full_name: gName,
        profile_picture: gAvatar,
      },
    });
  } catch (error) {
    console.error("googleLogin error:", error);
    res.status(500).json({ message: error.message || "Google Authentication failed" });
  }
};

exports.googleRegister = async (req, res) => {
  try {
    const { googleRegistrationToken, phoneNumber, barangay, completeAddress } = req.body;

    if (!googleRegistrationToken) {
      return res.status(400).json({ message: "Google authentication session expired or missing. Please sign in with Google again." });
    }

    let payload;
    try {
      payload = jwt.verify(googleRegistrationToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: "Registration session expired. Please sign in with Google again." });
    }

    if (payload.purpose !== "google-registration" || !payload.googleSub || !payload.email) {
      return res.status(400).json({ message: "Invalid registration token." });
    }

    const cleanPhone = (phoneNumber || "").trim();
    if (!cleanPhone || !/^09\d{9}$/.test(cleanPhone.replace(/[\s-]/g, ""))) {
      return res.status(400).json({ message: "Please provide a valid 11-digit mobile number starting with 09 (e.g. 09XXXXXXXXX)." });
    }

    const cleanBarangay = (barangay || "").trim();
    if (!cleanBarangay) {
      return res.status(400).json({ message: "Please select your Barangay." });
    }

    const cleanAddress = (completeAddress || "").trim();
    if (!cleanAddress) {
      return res.status(400).json({ message: "Please enter your complete address." });
    }

    // Check if googleId or email was already registered while user was on completion form
    let existingUser = await User.findOne({ googleId: payload.googleSub });
    if (!existingUser) {
      existingUser = await findUserByEmail(payload.email);
    }

    if (existingUser) {
      return res.status(400).json({ message: "An account associated with this Google account already exists." });
    }

    const formattedPhone = cleanPhone.replace(/[\s-]/g, "");

    const user = await User.create({
      fullName: payload.fullName || payload.email.split("@")[0],
      username: payload.email,
      email: payload.email,
      googleId: payload.googleSub,
      avatar: payload.avatar || "",
      phoneNumber: formattedPhone,
      barangay: cleanBarangay,
      completeAddress: cleanAddress,
      googleVerified: true,
      residentVerificationStatus: "pending",
      accountStatus: "active",
      role: "resident",
      agency: "NONE",
      status: "approved",
      isEmailVerified: true,
      authProvider: "google",
      lastLogin: new Date(),
      lastSeen: new Date(),
    });

    await AuditLog.create({
      category: "user_activity",
      action: "google_register_success",
      actorId: user._id,
      actorName: user.fullName,
      actorEmail: user.email,
      actorRole: user.role,
      details: `New resident registered via Google: ${user.fullName} (${user.email}) in Brgy. ${user.barangay}`,
      source: getSource(req),
      userAgent: getUserAgent(req),
      ipAddress: getIp(req),
    });

    await createSystemNotification({
      title: "New Google resident registration",
      message: `${user.fullName} completed registration as a resident in Brgy. ${user.barangay}.`,
      recipientRole: "admin",
      category: "user_event",
      type: "user_event",
      metadata: { userId: user._id.toString(), role: user.role, barangay: user.barangay },
    });

    return res.status(201).json({
      message: "Resident registration completed successfully",
      isNewResident: false,
      token: generateToken(user._id, user.role),
      termsAccepted: false,
      termsVersion: CURRENT_TERMS_VERSION,
      privacyVersion: CURRENT_PRIVACY_VERSION,
      user: {
        id: user._id,
        _id: user._id,
        resident_id: user._id.toString(),
        google_sub: user.googleId,
        google_email: user.email,
        fullName: user.fullName,
        full_name: user.fullName,
        email: user.email,
        username: user.email,
        avatar: user.avatar,
        profile_picture: user.avatar,
        phoneNumber: user.phoneNumber || "",
        phone_number: user.phoneNumber || "",
        barangay: user.barangay || "",
        completeAddress: user.completeAddress || "",
        complete_address: user.completeAddress || "",
        googleVerified: true,
        google_verified: true,
        residentVerificationStatus: "pending",
        resident_verification_status: "pending",
        accountStatus: "active",
        account_status: "active",
        role: user.role,
        agency: user.agency,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("googleRegister error:", error);
    res.status(500).json({ message: error.message || "Failed to complete Google registration" });
  }
};


exports.acceptTerms = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User account not found." });
    }

    const { termsVersion = CURRENT_TERMS_VERSION, privacyPolicyVersion = CURRENT_PRIVACY_VERSION } = req.body;

    let record = await TermsAcceptance.findOne({
      userId: user._id,
      termsVersion,
    });

    if (!record) {
      record = await TermsAcceptance.create({
        userId: user._id,
        googleId: user.googleId || "",
        termsAccepted: true,
        termsVersion,
        privacyPolicyAccepted: true,
        privacyPolicyVersion,
        acceptedAt: new Date(),
        ipAddress: getIp(req),
        userAgent: getUserAgent(req),
      });
    } else {
      record.termsAccepted = true;
      record.privacyPolicyAccepted = true;
      record.acceptedAt = new Date();
      record.ipAddress = getIp(req);
      record.userAgent = getUserAgent(req);
      await record.save();
    }

    res.json({
      message: "User agreement accepted successfully",
      termsAccepted: true,
      termsVersion,
      privacyPolicyVersion,
    });
  } catch (error) {
    console.error("acceptTerms error:", error);
    res.status(500).json({ message: "Failed to record user agreement acceptance" });
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

    // Check terms acceptance
    const termsRecord = await TermsAcceptance.findOne({
      userId: user._id,
      termsVersion: CURRENT_TERMS_VERSION,
    });

    res.json({
      valid: true,
      termsAccepted: !!termsRecord,
      termsVersion: CURRENT_TERMS_VERSION,
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        agency: user.agency,
        phoneNumber: user.phoneNumber || "",
        status: user.status,
        avatar: user.avatar || "",
        googleId: user.googleId || "",
        employeeId: user.employeeId,
        rank: user.rank,
        bio: user.bio,
        barangay: user.barangay || "",
        completeAddress: user.completeAddress || "",
        accountStatus: user.accountStatus || "active",
        residentVerificationStatus: user.residentVerificationStatus || "pending",
        authProvider: user.authProvider || "local",
        isEmailVerified: user.isEmailVerified || false,
        googleVerified: !!user.googleId,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired session token" });
  }
};

exports.facebookLogin = async (req, res) => {
  try {
    const { accessToken, email, name, facebookId, picture } = req.body;

    const targetEmail = normalizeEmail(email);
    const fbId = facebookId || accessToken?.replace(/[^a-z0-9]/gi, "");

    if (!targetEmail) {
      return res.status(400).json({ message: "Facebook email address is required to log in." });
    }

    let user = await User.findOne({ facebookId: fbId });
    if (!user) {
      user = await findUserByEmail(targetEmail);
    }

    if (user) {
      if (user.accountStatus === "suspended" || user.accountStatus === "deactivated") {
        return res.status(403).json({ message: `Your account is currently ${user.accountStatus}. Please contact support.` });
      }

      user.facebookId = fbId;
      user.isEmailVerified = true;
      if (!user.authProvider || user.authProvider === "local") {
        user.authProvider = "facebook";
      }
      if (picture && !user.avatar) {
        user.avatar = picture;
      }
      user.lastLogin = new Date();
      user.lastSeen = new Date();
      await user.save();

      await AuditLog.create({
        category: "user_activity",
        action: "facebook_login_success",
        actorId: user._id,
        actorName: user.fullName,
        actorEmail: user.email,
        actorRole: user.role,
        details: `Successful Facebook sign-in for ${user.email}`,
        source: getSource(req),
        userAgent: getUserAgent(req),
        ipAddress: getIp(req),
      });

      const termsRecord = await TermsAcceptance.findOne({
        userId: user._id,
        termsVersion: CURRENT_TERMS_VERSION,
      });

      return res.json({
        message: "Facebook sign-in successful",
        isNewResident: false,
        token: generateToken(user._id, user.role),
        termsAccepted: !!termsRecord,
        termsVersion: CURRENT_TERMS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
        user: {
          id: user._id,
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          agency: user.agency,
          phoneNumber: user.phoneNumber || "",
          status: user.status,
          avatar: user.avatar || "",
          barangay: user.barangay || "",
          completeAddress: user.completeAddress || "",
          accountStatus: user.accountStatus || "active",
          residentVerificationStatus: user.residentVerificationStatus || "pending",
          authProvider: user.authProvider || "facebook",
          isEmailVerified: true,
        },
      });
    }

    // New Facebook User: generate registration token
    const facebookRegistrationToken = jwt.sign(
      {
        purpose: "facebook-registration",
        facebookId: fbId,
        email: targetEmail,
        fullName: name || targetEmail.split("@")[0],
        avatar: picture || "",
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      message: "Facebook account authenticated. Please complete resident profile details.",
      isNewResident: true,
      requiresProfileCompletion: true,
      facebookRegistrationToken,
      facebookUser: {
        facebook_id: fbId,
        facebook_email: targetEmail,
        full_name: name || targetEmail.split("@")[0],
        profile_picture: picture || "",
      },
    });
  } catch (error) {
    console.error("facebookLogin error:", error);
    res.status(500).json({ message: error.message || "Facebook authentication failed" });
  }
};

exports.facebookRegister = async (req, res) => {
  try {
    const { facebookRegistrationToken, phoneNumber, barangay, completeAddress } = req.body;

    if (!facebookRegistrationToken) {
      return res.status(400).json({ message: "Facebook authentication session expired. Please try again." });
    }

    let payload;
    try {
      payload = jwt.verify(facebookRegistrationToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: "Registration session expired. Please sign in with Facebook again." });
    }

    if (payload.purpose !== "facebook-registration" || !payload.email) {
      return res.status(400).json({ message: "Invalid Facebook registration token." });
    }

    const cleanPhone = (phoneNumber || "").trim().replace(/[\s-]/g, "");
    if (!cleanPhone || !/^09\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ message: "Please provide a valid 11-digit mobile number starting with 09." });
    }

    const cleanBarangay = (barangay || "").trim();
    if (!cleanBarangay) {
      return res.status(400).json({ message: "Please select your Barangay." });
    }

    const cleanAddress = (completeAddress || "").trim();
    if (!cleanAddress) {
      return res.status(400).json({ message: "Please enter your complete address." });
    }

    let existingUser = await User.findOne({ facebookId: payload.facebookId });
    if (!existingUser) {
      existingUser = await findUserByEmail(payload.email);
    }

    if (existingUser) {
      return res.status(400).json({ message: "An account associated with this Facebook account already exists." });
    }

    const user = await User.create({
      fullName: payload.fullName,
      username: payload.email,
      email: payload.email,
      facebookId: payload.facebookId,
      avatar: payload.avatar || "",
      phoneNumber: cleanPhone,
      barangay: cleanBarangay,
      completeAddress: cleanAddress,
      residentVerificationStatus: "pending",
      accountStatus: "active",
      role: "resident",
      agency: "NONE",
      status: "approved",
      isEmailVerified: true,
      authProvider: "facebook",
      lastLogin: new Date(),
      lastSeen: new Date(),
    });

    await AuditLog.create({
      category: "user_activity",
      action: "facebook_register_success",
      actorId: user._id,
      actorName: user.fullName,
      actorEmail: user.email,
      actorRole: user.role,
      details: `New resident registered via Facebook: ${user.fullName} (${user.email}) in Brgy. ${user.barangay}`,
      source: getSource(req),
      userAgent: getUserAgent(req),
      ipAddress: getIp(req),
    });

    return res.status(201).json({
      message: "Resident registration completed successfully",
      isNewResident: false,
      token: generateToken(user._id, user.role),
      termsAccepted: false,
      termsVersion: CURRENT_TERMS_VERSION,
      privacyVersion: CURRENT_PRIVACY_VERSION,
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.email,
        avatar: user.avatar,
        phoneNumber: user.phoneNumber || "",
        barangay: user.barangay || "",
        completeAddress: user.completeAddress || "",
        accountStatus: user.accountStatus || "active",
        role: user.role,
        agency: user.agency,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("facebookRegister error:", error);
    res.status(500).json({ message: error.message || "Failed to complete Facebook registration." });
  }
};



