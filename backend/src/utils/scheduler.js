const fs = require("fs");
const path = require("path");
const SystemSettings = require("../models/SystemSettings");
const User = require("../models/User");
const EmergencyReport = require("../models/EmergencyReport");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const Tracking = require("../models/Tracking");

const BACKUPS_DIR = path.join(__dirname, "../../backups");

const ensureBackupsDir = () => {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
};

// Main schedule worker
const runSchedulerCheck = async () => {
  try {
    ensureBackupsDir();

    // 1. Fetch settings
    const backupConfigSetting = await SystemSettings.findOne({ key: "backupConfig" });
    const backupConfig = backupConfigSetting?.value || { interval: "weekly", retention: "12" };

    const lastScheduleSetting = await SystemSettings.findOne({ key: "lastScheduleRuns" });
    const lastRuns = lastScheduleSetting?.value || { lastAutoBackup: {}, lastPurge: null };

    const now = new Date();

    // 2. Automated Backups
    let backupDue = false;
    const interval = backupConfig.interval; // "daily", "weekly", "monthly", "disabled"

    if (interval !== "disabled") {
      const lastBackupTimeStr = lastRuns.lastAutoBackup[interval];
      const lastBackupTime = lastBackupTimeStr ? new Date(lastBackupTimeStr) : null;

      if (!lastBackupTime) {
        backupDue = true;
      } else {
        const diffMs = now - lastBackupTime;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (interval === "daily" && diffHours >= 24) backupDue = true;
        if (interval === "weekly" && diffHours >= 24 * 7) backupDue = true;
        if (interval === "monthly" && diffHours >= 24 * 30) backupDue = true;
      }
    }

    if (backupDue) {
      console.log(`[Scheduler] Starting automated backup (Interval: ${interval})...`);
      const users = await User.find({}).lean();
      const reports = await EmergencyReport.find({}).lean();
      const auditlogs = await AuditLog.find({}).lean();
      const notifications = await Notification.find({}).lean();
      const messages = await Message.find({}).lean();
      const trackings = await Tracking.find({}).lean();

      const backupData = {
        version: "1.0",
        exportedAt: now.toISOString(),
        collections: {
          users,
          reports,
          auditlogs,
          notifications,
          messages,
          trackings,
        },
      };

      const dateStr = now.toISOString().split("T")[0];
      const filename = `alerto_backup_auto_${interval}_${dateStr}.json`;
      const filePath = path.join(BACKUPS_DIR, filename);

      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf-8");

      // Log backup completion in audit trail
      await AuditLog.create({
        category: "user_activity",
        action: "auto_backup_complete",
        actorName: "System Scheduler",
        details: `Automated database backup (${interval}) completed successfully. Filename: ${filename}`,
        source: "system",
      });

      // Update last runs state
      lastRuns.lastAutoBackup[interval] = now.toISOString();
      await SystemSettings.findOneAndUpdate(
        { key: "lastScheduleRuns" },
        { value: lastRuns },
        { upsert: true, new: true }
      );
      console.log(`[Scheduler] Automated backup saved as ${filename}.`);
    }

    // 3. Automated Purge / Incident Retention Policy
    let purgeDue = false;
    const lastPurgeTimeStr = lastRuns.lastPurge;
    const lastPurgeTime = lastPurgeTimeStr ? new Date(lastPurgeTimeStr) : null;

    if (!lastPurgeTime) {
      purgeDue = true;
    } else {
      const diffMs = now - lastPurgeTime;
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours >= 24) {
        // Run purge check once every 24 hours
        purgeDue = true;
      }
    }

    const retention = backupConfig.retention; // "6", "12", "24", "forever"
    if (purgeDue && retention !== "forever") {
      console.log(`[Scheduler] Running automated purge (Retention limit: ${retention} months)...`);
      
      const monthsLimit = parseInt(retention);
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsLimit);

      // Count reports to delete
      const oldReportsCount = await EmergencyReport.countDocuments({
        createdAt: { $lt: cutoffDate },
      });

      if (oldReportsCount > 0) {
        // Delete reports
        await EmergencyReport.deleteMany({ createdAt: { $lt: cutoffDate } });

        // Add System Audit Trail entry
        await AuditLog.create({
          category: "user_activity",
          action: "auto_purge_complete",
          actorName: "System Scheduler",
          details: `Incident retention policy automatically purged ${oldReportsCount} incidents older than ${retention} months (older than ${cutoffDate.toISOString().split("T")[0]}).`,
          source: "system",
        });
        console.log(`[Scheduler] Purged ${oldReportsCount} old incidents.`);
      } else {
        console.log(`[Scheduler] No old incidents found to purge.`);
      }

      // Update last runs state
      lastRuns.lastPurge = now.toISOString();
      await SystemSettings.findOneAndUpdate(
        { key: "lastScheduleRuns" },
        { value: lastRuns },
        { upsert: true, new: true }
      );
    }

  } catch (error) {
    console.error("[Scheduler] Error in scheduler worker:", error.message);
  }
};

// Initialize and start scheduler (checks hourly)
const startScheduler = () => {
  console.log("⏰ Data Management & Backup Scheduler Initialized.");
  // Run immediate check on startup
  runSchedulerCheck();
  // Check every hour
  const ONE_HOUR = 60 * 60 * 1000;
  setInterval(runSchedulerCheck, ONE_HOUR);
};

module.exports = {
  startScheduler,
};
