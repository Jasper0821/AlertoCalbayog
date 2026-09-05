const EmergencyReport = require("../models/EmergencyReport");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { isValidEvidenceImage } = require("../utils/evidenceImages");

const ALLOWED_STATUS_UPDATES = new Set(["pending", "responding", "resolved", "closed", "cancelled", "rejected"]);
const TERMINAL_REPORT_STATUSES = new Set(["resolved", "closed", "cancelled", "rejected"]);
const MAX_RESOLUTION_EVIDENCE_IMAGES = 10;

const isAllowedStatusTransition = (fromStatus, toStatus, isAdmin = false) => {
  if (fromStatus === toStatus) return true;
  // A completed incident awaits administrative closure. Agencies cannot alter it.
  if (fromStatus === "resolved") return isAdmin && toStatus === "closed";
  if (TERMINAL_REPORT_STATUSES.has(fromStatus)) return false;

  // Agency queues progress incidents in one direction only:
  // pending -> responding -> resolved. Rejection is only possible while pending.
  if (fromStatus === "pending") return ["responding", "rejected"].includes(toStatus);
  if (fromStatus === "responding") return toStatus === "resolved";
  return false;
};

const populateReport = (query) =>
  query
    .populate("userId", "fullName email role phoneNumber")
    .populate("assignedResponder", "fullName email role agency phoneNumber");

const buildStatusMessage = (status) => {
  if (status === "pending") {
    return "Your incident report has been received and is waiting for response.";
  }
  if (status === "responding") {
    return "Rescue/responders are on the way to your incident.";
  }
  if (status === "resolved") {
    return "Your incident has been completed.";
  }
  if (status === "closed") {
    return "Your incident report has been officially closed by the administration.";
  }
  if (status === "cancelled") {
    return "Your incident report has been cancelled and removed from the active queue.";
  }
  if (status === "rejected") {
    return "Your incident report has been rejected. Please ensure your reports are legitimate emergencies.";
  }
  return `Your incident report status has been updated to ${status}.`;
};

const emitReportChange = async (req, report, notificationMessage, notificationType = "status_update") => {
  const io = req.app.get("io");
  if (!io) return;

  const reportId = report._id.toString();
  io.emit(`statusUpdate-${reportId}`, report);

  const userIdStr = report.userId && report.userId._id ? report.userId._id.toString() : report.userId?.toString();
  if (userIdStr && notificationMessage) {
    // Persist the notification in the database for the incident owner
    try {
      const saved = await Notification.create({
        userId: userIdStr,
        recipientRole: "resident",
        reportId,
        title: report.status === "resolved" ? "Responder Completed Scene" : "Incident Update",
        message: notificationMessage,
        category: "incident",
        type: notificationType,
        metadata: {
          status: report.status,
          resolutionEvidence: report.resolutionEvidence || [],
          proofPhotos: report.proofPhotos || []
        }
      });

      io.to(userIdStr).emit("notification", saved);
    } catch (err) {
      console.error("Failed to persist notification:", err.message);
      io.to(userIdStr).emit("notification", {
        title: "Incident Update",
        message: notificationMessage,
        reportId,
        type: notificationType,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  try {
    const adminNotification = await Notification.create({
      recipientRole: "admin",
      reportId,
      title: "Incident Status Changed",
      message: `Report ${reportId} status is now ${report.status}.`,
      category: "incident",
      type: notificationType,
      metadata: { status: report.status, reportId }
    });
    io.to("admin").emit("notification", adminNotification);
  } catch (err) {
    console.error("Failed to persist admin notification:", err.message);
  }

  if (report.notifiedAgencies) {
    report.notifiedAgencies.forEach((agency) => {
      io.to(agency).emit("reportStatusChanged", report);
    });
  }

  if (report.assignedResponder?._id) {
    io.to(report.assignedResponder._id.toString()).emit("reportAssigned", report);
  }

  io.to("admin").emit("reportStatusChanged", report);
};

exports.updateReportStatus = async (req, res) => {
  try {
    let status = String(req.body.status || "").trim().toLowerCase();
    if (status === "active") status = "responding";
    if (status === "responded") status = "resolved";
    const { id } = req.params;

    if (!ALLOWED_STATUS_UPDATES.has(status)) {
      return res.status(400).json({ message: "Invalid report status" });
    }

    const report = await EmergencyReport.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const currentUser = await User.findById(req.user.id).select("fullName role agency");
    if (!currentUser) {
      return res.status(401).json({ message: "User not found" });
    }

    const isAdmin = currentUser.role === "admin";
    const isAgencyUser =
      ["staff", "responder"].includes(currentUser.role) &&
      currentUser.agency &&
      report.notifiedAgencies.includes(currentUser.agency);

    if (!isAdmin && !isAgencyUser) {
      return res.status(403).json({ message: "You are not allowed to update this report status" });
    }

    const previousStatus = report.status;
    if (!isAllowedStatusTransition(previousStatus, status, isAdmin)) {
      return res.status(400).json({
        message: `Invalid status transition from ${previousStatus} to ${status}`
      });
    }

    const evidenceImages = Array.isArray(req.body.evidenceImages) ? req.body.evidenceImages : [];
    if (previousStatus === "responding" && status === "resolved") {
      if (evidenceImages.length === 0) {
        return res.status(400).json({ message: "At least one incident proof image is required before resolving." });
      }
      // Accepts uploaded Cloudinary URLs and legacy inline base64 alike.
      if (
        evidenceImages.length > MAX_RESOLUTION_EVIDENCE_IMAGES ||
        !evidenceImages.every(isValidEvidenceImage)
      ) {
        return res.status(400).json({ message: "Submit between 1 and 10 valid incident proof images." });
      }
      report.resolutionEvidence = evidenceImages;
    }

    report.status = status;

    // Record which agency actually took the incident. `assignedAgency` previously
    // stayed "NONE" forever because the only writer (PUT /reports/:id/assign) has no
    // UI, so the admin console could show who was *alerted* but never who *responded*.
    if (status === "responding" && isAgencyUser && currentUser.agency) {
      report.assignedAgency = currentUser.agency;
    }

    if (status === "resolved" && previousStatus !== "resolved") {
      report.resolvedAt = new Date();
      report.closedAt = null;
    } else if (status === "closed" && previousStatus !== "closed") {
      report.closedAt = new Date();
    } else if (status === "rejected" && previousStatus !== "rejected") {
      report.rejectedAt = new Date();
    } else if (!["resolved", "closed"].includes(status)) {
      report.resolvedAt = null;
      report.closedAt = null;
      report.rejectedAt = null;
    }
    report.actionLog.push({
      actorId: currentUser._id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      actorAgency: currentUser.agency || "",
      action: "status_update",
      fromStatus: previousStatus,
      toStatus: status,
      message: `Status changed from ${previousStatus} to ${status}`
    });
    await report.save();
    await report.populate("userId", "fullName email role phoneNumber");
    await report.populate("assignedResponder", "fullName email role agency phoneNumber");

    await emitReportChange(req, report, buildStatusMessage(status), "status_update");

    res.json({
      message: "Report status updated",
      report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignReportResponder = async (req, res) => {
  try {
    const { id } = req.params;
    const { responderId } = req.body;

    const currentUser = await User.findById(req.user.id).select("fullName role agency");
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({ message: "Only admins can assign responders" });
    }

    const report = await EmergencyReport.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const responder = await User.findById(responderId).select("fullName email role agency phoneNumber");
    if (!responder || responder.role !== "responder") {
      return res.status(400).json({ message: "Selected user is not a responder" });
    }

    if (!report.notifiedAgencies.includes(responder.agency)) {
      return res.status(400).json({ message: "Responder agency is not assigned to this incident type" });
    }

    report.assignedResponder = responder._id;
    report.assignedAgency = responder.agency;
    report.actionLog.push({
      actorId: currentUser._id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      action: "responder_assignment",
      fromStatus: report.status,
      toStatus: report.status,
      message: `Assigned ${responder.fullName} (${responder.agency})`
    });

    await report.save();
    const populatedReport = await populateReport(EmergencyReport.findById(report._id));

    await emitReportChange(
      req,
      populatedReport,
      `A responder has been assigned to your incident report. Current status: ${populatedReport.status}.`,
      "responder_assigned"
    );

    res.json({
      message: "Responder assigned",
      report: populatedReport
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
