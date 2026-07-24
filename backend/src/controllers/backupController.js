const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const EmergencyReport = require("../models/EmergencyReport");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const Tracking = require("../models/Tracking");

const BACKUPS_DIR = path.join(__dirname, "../../backups");

// Helper to ensure backups directory exists
const ensureBackupsDir = () => {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
};

// 1. Export Backup (Triggers a manual backup, saves to disk, and serves as download)
exports.exportBackup = async (req, res) => {
  try {
    ensureBackupsDir();

    const users = await User.find({}).lean();
    const reports = await EmergencyReport.find({}).lean();
    const auditlogs = await AuditLog.find({}).lean();
    const notifications = await Notification.find({}).lean();
    const messages = await Message.find({}).lean();
    const trackings = await Tracking.find({}).lean();

    const backupData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      collections: {
        users,
        reports,
        auditlogs,
        notifications,
        messages,
        trackings,
      },
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `alerto_backup_manual_${timestamp}.json`;
    const filePath = path.join(BACKUPS_DIR, filename);

    // Save to server local disk
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf-8");

    // Log the backup action in AuditTrail
    await AuditLog.create({
      category: "user_activity",
      action: "database_backup",
      actorId: req.user.id,
      actorName: req.user.fullName || "Admin",
      actorEmail: req.user.email || "",
      actorRole: "admin",
      details: `Database manual backup triggered and saved as ${filename}`,
      source: "web",
    });

    // Send down to browser
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/json");
    res.json(backupData);
  } catch (error) {
    res.status(500).json({ message: "Failed to create database backup", error: error.message });
  }
};

// 2. List Backup Files on the Server
exports.listBackups = async (req, res) => {
  try {
    ensureBackupsDir();
    const files = fs.readdirSync(BACKUPS_DIR);
    
    const backupsList = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const filePath = path.join(BACKUPS_DIR, file);
        const stats = fs.statSync(filePath);
        const type = file.includes("auto") ? "Automatic" : "Manual";
        return {
          filename: file,
          sizeBytes: stats.size,
          createdAt: stats.mtime.toISOString(),
          type,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(backupsList);
  } catch (error) {
    res.status(500).json({ message: "Failed to list backups on server", error: error.message });
  }
};

// 3. Download a specific backup file
exports.downloadBackupFile = async (req, res) => {
  try {
    const { filename } = req.params;
    // Prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ message: "Invalid filename" });
    }
    const filePath = path.join(BACKUPS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Backup file not found" });
    }
    res.download(filePath, filename);
  } catch (error) {
    res.status(500).json({ message: "Failed to download backup file", error: error.message });
  }
};

// 4. Delete a specific backup file
exports.deleteBackupFile = async (req, res) => {
  try {
    const { filename } = req.params;
    // Prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ message: "Invalid filename" });
    }
    const filePath = path.join(BACKUPS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Backup file not found" });
    }
    fs.unlinkSync(filePath);

    // Log the backup delete in audit log
    await AuditLog.create({
      category: "user_activity",
      action: "database_backup_delete",
      actorId: req.user.id,
      actorName: req.user.fullName || "Admin",
      actorEmail: req.user.email || "",
      actorRole: "admin",
      details: `Database backup file ${filename} deleted from server.`,
      source: "web",
    });

    res.json({ message: "Backup file deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete backup file", error: error.message });
  }
};

// Helper: Performs the restore logic on the collections
const executeDatabaseRestore = async (backupData, currentUserId) => {
  if (!backupData || backupData.version !== "1.0" || !backupData.collections) {
    throw new Error("Invalid backup file structure or incompatible version.");
  }

  // Get active admin to preserve credentials/session
  const currentAdmin = await User.findById(currentUserId);

  // Clear existing databases
  await User.deleteMany({});
  await EmergencyReport.deleteMany({});
  await AuditLog.deleteMany({});
  await Notification.deleteMany({});
  await Message.deleteMany({});
  await Tracking.deleteMany({});

  const usersToInsert = backupData.collections.users || [];
  
  // Ensure the restoring admin is not lost
  const adminExists = usersToInsert.some(u => u._id.toString() === currentUserId.toString());
  if (!adminExists && currentAdmin) {
    usersToInsert.push(currentAdmin.toObject());
  }

  // Restore users, keeping restoring admin's current authentication credentials intact
  if (usersToInsert.length > 0) {
    await User.insertMany(usersToInsert.map((u) => {
      if (u._id.toString() === currentUserId.toString() && currentAdmin) {
        return {
          ...u,
          password: currentAdmin.password,
          visiblePassword: currentAdmin.visiblePassword,
          role: "admin",
          status: "approved"
        };
      }
      return u;
    }));
  }

  // Restore reports, notifications, tracking, messages, logs
  if (backupData.collections.reports && backupData.collections.reports.length > 0) {
    await EmergencyReport.insertMany(backupData.collections.reports);
  }
  if (backupData.collections.messages && backupData.collections.messages.length > 0) {
    await Message.insertMany(backupData.collections.messages);
  }
  if (backupData.collections.notifications && backupData.collections.notifications.length > 0) {
    await Notification.insertMany(backupData.collections.notifications);
  }
  if (backupData.collections.trackings && backupData.collections.trackings.length > 0) {
    await Tracking.insertMany(backupData.collections.trackings);
  }
  if (backupData.collections.auditlogs && backupData.collections.auditlogs.length > 0) {
    await AuditLog.insertMany(backupData.collections.auditlogs);
  }

  // Log restore operation in Audit trail
  await AuditLog.create({
    category: "user_activity",
    action: "database_restore",
    actorId: currentUserId,
    actorName: currentAdmin ? currentAdmin.fullName : "Admin",
    actorEmail: currentAdmin ? currentAdmin.email : "",
    actorRole: "admin",
    details: `Database successfully restored from backup file.`,
    source: "web",
  });
};

// 5. Restore Database from uploaded JSON backup payload
exports.restoreFromUpload = async (req, res) => {
  try {
    const { backupData } = req.body;
    if (!backupData) {
      return res.status(400).json({ message: "No backup data provided" });
    }

    await executeDatabaseRestore(backupData, req.user.id);
    res.json({ message: "Database successfully restored from uploaded backup" });
  } catch (error) {
    res.status(500).json({ message: "Failed to restore database", error: error.message });
  }
};

// 6. Restore Database from a server-stored backup file
exports.restoreFromFile = async (req, res) => {
  try {
    const { filename } = req.params;
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ message: "Invalid filename" });
    }
    const filePath = path.join(BACKUPS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Backup file not found" });
    }

    const rawData = fs.readFileSync(filePath, "utf-8");
    const backupData = JSON.parse(rawData);

    await executeDatabaseRestore(backupData, req.user.id);
    res.json({ message: `Database successfully restored from server backup: ${filename}` });
  } catch (error) {
    res.status(500).json({ message: "Failed to restore database from file", error: error.message });
  }
};
