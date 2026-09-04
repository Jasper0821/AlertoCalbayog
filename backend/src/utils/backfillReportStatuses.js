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

  const mapAgencies = require("./agencyMapper");
  const unmappedReports = await EmergencyReport.find({
    $or: [
      { notifiedAgencies: { $exists: false } },
      { notifiedAgencies: { $size: 0 } },
      { notifiedAgencies: null }
    ]
  });

  if (unmappedReports.length > 0) {
    await Promise.all(unmappedReports.map(async (report) => {
      report.notifiedAgencies = mapAgencies(report.emergencyType || "others") || ["CDRRMO"];
      await report.save();
    }));
    console.log(`Backfilled notifiedAgencies for ${unmappedReports.length} report(s).`);
  }
}

module.exports = backfillReportStatuses;
