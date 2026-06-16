const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");

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
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { fullName, email, password, role, agency, phoneNumber } = req.body;
    const normalizedEmail = email?.toString().trim().toLowerCase();

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
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
      phoneNumber
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
    const { fullName, email, password, role, agency, phoneNumber } = req.body;

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

    res.json({ message: "User updated", user });
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
