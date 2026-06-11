const EmergencyReport = require("../models/EmergencyReport");
const { normalizeReportStatus } = require("./reportStatus");

async function backfillReportStatuses() {
  const legacyStatuses = [
    "verified",
    "acknowledged",
    "verified / acknowledged",
    "active",
    "ongoing",
    "dispatching",
    "en_route",
    "en route",
    "responded",
    "closed",
    "cancelled"
  ];

  const reports = await EmergencyReport.find({ status: { $in: legacyStatuses } }).select("status actionLog");
  if (reports.length === 0) return;

  await Promise.all(reports.map(async (report) => {
    const fromStatus = report.status;
    const toStatus = normalizeReportStatus(fromStatus);
    report.status = toStatus;
    report.actionLog.push({
      actorName: "System",
      actorRole: "system",
      action: "status_migration",
      fromStatus,
      toStatus,
      message: `Migrated legacy status to ${toStatus}`
    });
    await report.save();
  }));

  console.log(`Backfilled ${reports.length} legacy incident report status value(s).`);
}

module.exports = backfillReportStatuses;
