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

      // Record the attempt BEFORE doing the work.
      //
      // This timestamp used to be written only after a successful backup. When the
      // backup killed the process (see the memory note below), the attempt was never
      // recorded, so the next boot found no lastBackupTime, decided a backup was due,
      // and died again — an unrecoverable crash loop that took the whole API down.
      // Recording first means a failure costs one interval, not the entire service.
      lastRuns.lastAutoBackup[interval] = now.toISOString();
      await SystemSettings.findOneAndUpdate(
        { key: "lastScheduleRuns" },
        { value: lastRuns },
        { upsert: true, returnDocument: "after" }
      );

      // Photos are excluded deliberately. proofPhotos/resolutionEvidence are base64
      // data URIs of several MB each, and loading every one into a 512MB container
      // exhausted the heap. Going forward they live in Cloudinary and the documents
      // carry only URLs, so nothing meaningful is lost from the backup.
      const users = await User.find({}).select("-avatar").lean();
      const reports = await EmergencyReport.find({})
        .select("-proofPhotos -resolutionEvidence")
        .lean();
      const auditlogs = await AuditLog.find({}).lean();
      const notifications = await Notification.find({})
        .select("-metadata.proofPhotos -metadata.resolutionEvidence")
        .lean();
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

      // Not pretty-printed: the indentation roughly doubled the size of the string
      // held in memory alongside the already-large source objects.
      fs.writeFileSync(filePath, JSON.stringify(backupData), "utf-8");

      // Log backup completion in audit trail
      await AuditLog.create({
        category: "user_activity",
        action: "auto_backup_complete",
        actorName: "System Scheduler",
        details: `Automated database backup (${interval}) completed successfully. Filename: ${filename}`,
        source: "system",
      });

      // (The lastAutoBackup timestamp was already recorded before the work started.)
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
        { upsert: true, returnDocument: "after" }
      );
    }

  } catch (error) {
    console.error("[Scheduler] Error in scheduler worker:", error.message);
  }
};

// Initialize and start scheduler (checks hourly)
const startScheduler = () => {
  // Escape hatch. If the scheduler ever takes the service down again, set
  // DISABLE_SCHEDULER=true in the host's environment to boot without it.
  if (String(process.env.DISABLE_SCHEDULER).toLowerCase() === "true") {
    console.log("⏰ Scheduler disabled via DISABLE_SCHEDULER.");
    return;
  }

  console.log("⏰ Data Management & Backup Scheduler Initialized.");

  // Deliberately NOT run immediately. Backups are memory-heavy, and running one
  // during boot meant the process could die before it ever served a request —
  // so the API never came up at all. Delaying lets the server become healthy
  // first, so a failure degrades the backup rather than the whole service.
  const STARTUP_DELAY = 2 * 60 * 1000;
  setTimeout(runSchedulerCheck, STARTUP_DELAY);

  const ONE_HOUR = 60 * 60 * 1000;
  setInterval(runSchedulerCheck, ONE_HOUR);
};

module.exports = {
  startScheduler,
};
