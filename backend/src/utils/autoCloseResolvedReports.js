const EmergencyReport = require("../models/EmergencyReport");
const Notification = require("../models/Notification");
const { statusTitle, statusMessage } = require("./reportStatusCopy");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const getRetentionDays = () => {
  const configuredDays = Number.parseInt(process.env.RESOLVED_AUTO_CLOSE_DAYS, 10);
  return configuredDays === 7 || configuredDays === 14 ? configuredDays : 14;
};

async function closeExpiredResolvedReports(io) {
  const retentionDays = getRetentionDays();
  const cutoff = new Date(Date.now() - retentionDays * ONE_DAY_MS);
  const reports = await EmergencyReport.find({
    status: "resolved",
    $or: [
      { resolvedAt: { $lte: cutoff } },
      // Reports resolved before the resolvedAt field was added use their last update as a safe fallback.
      { resolvedAt: null, updatedAt: { $lte: cutoff } },
    ],
  });

  for (const report of reports) {
    report.status = "closed";
    report.closedAt = new Date();
    report.actionLog.push({
      actorName: "System",
      actorRole: "system",
      action: "auto_close",
      fromStatus: "resolved",
      toStatus: "closed",
      message: `Automatically closed after ${retentionDays} days in resolved status.`,
    });
    await report.save();

    const reportId = report._id.toString();
    const userId = report.userId?.toString();
    // Photos stay out of socket payloads; dashboards load them on demand.
    const lean = report.toObject();
    delete lean.proofPhotos;
    delete lean.resolutionEvidence;

    if (userId) {
      const notification = await Notification.create({
        userId,
        recipientRole: "resident",
        reportId,
        title: statusTitle("closed"),
        message: statusMessage("closed"),
        category: "incident",
        type: "status_update",
        metadata: { status: "closed", automatic: true },
      });
      io?.to(userId).emit("notification", notification);
      // Only the owner. A bare io.emit sent this resident's full report, photos
      // included, to every connected client.
      io?.to(userId).emit(`statusUpdate-${reportId}`, lean);
    }

    io?.to("admin").emit("reportStatusChanged", lean);
    (report.notifiedAgencies || []).forEach((agency) => io?.to(agency).emit("reportStatusChanged", lean));
  }

  return reports.length;
}

function startResolvedReportAutoClose(io) {
  const run = async () => {
    try {
      const closedCount = await closeExpiredResolvedReports(io);
      if (closedCount) console.log(`Automatically closed ${closedCount} resolved incident report(s).`);
    } catch (error) {
      console.error("Automatic resolved-report closure failed:", error.message);
    }
  };

  run();
  return setInterval(run, 60 * 60 * 1000);
}

module.exports = { startResolvedReportAutoClose };
