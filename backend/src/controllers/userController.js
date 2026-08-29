const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const { getSettingValue } = require("./settingsController");
const { sendResponderApprovalEmail } = require("../utils/mailer");

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
  return null;
};

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

const adminNotification = async ({ title, message, metadata = {}, type = "user_event" }) => {
  try {
    await Notification.create({
      recipientRole: "admin",
      title,
      message,
      category: "user_management",
      type,
      metadata,
    });
  } catch (error) {
    console.error("Failed to create admin notification:", error.message);
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    const EmergencyReport = require("../models/EmergencyReport");

    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        const reportCount = await EmergencyReport.countDocuments({ userId: u._id, isDeleted: { $ne: true } });
        const obj = u.toObject();
        obj.reportCount = reportCount;
        obj.previousReportCount = reportCount;
        return obj;
      })
    );

    res.json(usersWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { fullName, email, password, role, agency, phoneNumber, barangay, completeAddress } = req.body;
    const normalizedEmail = email?.toString().trim().toLowerCase();

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Enforce password complexity policy from system settings
    const complexityError = await checkPasswordComplexity(password);
    if (complexityError) {
      return res.status(400).json({ message: complexityError });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      username: email,
      email,
      password: hashedPassword,
      visiblePassword: password,
      role: role || "resident",
      agency: agency || "NONE",
      phoneNumber,
      barangay: barangay || "",
      completeAddress: completeAddress || "",
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    await AuditLog.create({
      category: "user_activity",
      action: "user_created",
      actorId: req.user.id,
      actorName: req.user.fullName || "Admin",
      actorEmail: req.user.email || "",
      actorRole: req.user.role || "admin",
      details: `Created user account ${safeUser.fullName} (${safeUser.role})`,
      source: getSource(req),
      userAgent: getUserAgent(req),
      ipAddress: req.ip || "",
    });

    await adminNotification({
      title: "New user added",
      message: `${safeUser.fullName} (${safeUser.role}) was created by ${req.user.fullName || "an admin"}.`,
      metadata: { userId: safeUser._id.toString(), role: safeUser.role, agency: safeUser.agency },
    });

    res.status(201).json({ message: "User created", user: safeUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      fullName, email, password, role, agency, phoneNumber, status,
      barangay, completeAddress, residentVerificationStatus, accountStatus, googleVerified
    } = req.body;
    const existingUser = await User.findById(id).select("role status");

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
      updates.email = normalizedEmail;
      updates.username = normalizedEmail;
    }
    if (role !== undefined) updates.role = role;
    if (agency !== undefined) updates.agency = agency;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (status !== undefined) updates.status = status;
    if (barangay !== undefined) updates.barangay = barangay;
    if (completeAddress !== undefined) updates.completeAddress = completeAddress;
    if (residentVerificationStatus !== undefined) updates.residentVerificationStatus = residentVerificationStatus;
    if (accountStatus !== undefined) updates.accountStatus = accountStatus;
    if (googleVerified !== undefined) updates.googleVerified = googleVerified;

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
      updates.visiblePassword = password;
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).select("-password");


    const auditAction = password ? "password_changed" : "user_updated";
    const auditDetails = password
      ? `Updated password for user account ${user.fullName} (${user.role})`
      : `Updated user account ${user.fullName} (${user.role})`;

    await AuditLog.create({
      category: "user_activity",
      action: auditAction,
      actorId: req.user.id,
      actorName: req.user.fullName || "Admin",
      actorEmail: req.user.email || "",
      actorRole: req.user.role || "admin",
      details: auditDetails,
      source: getSource(req),
      userAgent: getUserAgent(req),
      ipAddress: req.ip || "",
    });

    await adminNotification({
      title: "User updated",
      message: `${user.fullName} (${user.role}) was updated by ${req.user.fullName || "an admin"}.`,
      metadata: { userId: user._id.toString(), role: user.role, agency: user.agency },
      type: "user_event"
    });

    const approvedResponder =
      existingUser.role === "responder" &&
      existingUser.status === "pending" &&
      user.status === "approved";

    res.json({
      message: "User updated",
      user,
      ...(approvedResponder && {
        approvalEmailQueued: true,
        emailMessage: "Responder approved. The approval email is being sent.",
      }),
    });

    // Do not make the admin wait for Gmail SMTP before completing an approval.
    // A delivery failure is logged, while the approved account remains usable.
    if (approvedResponder) {
      setImmediate(() => {
        sendResponderApprovalEmail(user.email, user.fullName).catch((emailError) => {
          console.error(`Failed to send responder approval email to ${user.email}:`, emailError.message);
        });
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await AuditLog.create({
      category: "user_activity",
      action: "user_deleted",
      actorId: req.user.id,
      actorName: req.user.fullName || "Admin",
      actorEmail: req.user.email || "",
      actorRole: req.user.role || "admin",
      details: `Deleted user account ${user.fullName} (${user.role})`,
      source: getSource(req),
      userAgent: getUserAgent(req),
      ipAddress: req.ip || "",
    });

    await adminNotification({
      title: "User deleted",
      message: `${user.fullName} (${user.role}) was deleted by ${req.user.fullName || "an admin"}.`,
      metadata: { userId: user._id.toString(), role: user.role, agency: user.agency },
      type: "user_event"
    });

    res.json({ message: "User deleted", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const id = req.user.id;
    const { 
      fullName, email, password, phoneNumber, 
      employeeId, rank, bio, avatar,
      twoFactor, loginAlerts, sessionTimeout, ipRestriction,
      language, timezone, dateFormat, timeFormat,
      soundAlerts, loopAlarm, desktopPush, emailDigest, smsAlerts,
      agency
    } = req.body;

    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
      updates.email = normalizedEmail;
      updates.username = normalizedEmail;
    }
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (employeeId !== undefined) updates.employeeId = employeeId;
    if (rank !== undefined) updates.rank = rank;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (agency !== undefined && req.user.role === "admin") updates.agency = agency;
    
    // Preferences & Security
    if (twoFactor !== undefined) updates.twoFactor = twoFactor;
    if (loginAlerts !== undefined) updates.loginAlerts = loginAlerts;
    if (sessionTimeout !== undefined) updates.sessionTimeout = sessionTimeout;
    if (ipRestriction !== undefined) updates.ipRestriction = ipRestriction;
    if (language !== undefined) updates.language = language;
    if (timezone !== undefined) updates.timezone = timezone;
    if (dateFormat !== undefined) updates.dateFormat = dateFormat;
    if (timeFormat !== undefined) updates.timeFormat = timeFormat;
    if (soundAlerts !== undefined) updates.soundAlerts = soundAlerts;
    if (loopAlarm !== undefined) updates.loopAlarm = loopAlarm;
    if (desktopPush !== undefined) updates.desktopPush = desktopPush;
    if (emailDigest !== undefined) updates.emailDigest = emailDigest;
    if (smsAlerts !== undefined) updates.smsAlerts = smsAlerts;

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
      updates.visiblePassword = password;
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await AuditLog.create({
      category: "user_activity",
      action: "profile_updated",
      actorId: user._id,
      actorName: user.fullName || "User",
      actorEmail: user.email || "",
      actorRole: user.role || "resident",
      details: `User updated their profile/settings`,
      source: getSource(req),
      userAgent: getUserAgent(req),
      ipAddress: req.ip || "",
    });

    res.json({ message: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
