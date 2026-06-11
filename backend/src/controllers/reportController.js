const EmergencyReport = require("../models/EmergencyReport");
const User = require("../models/User");
const Notification = require("../models/Notification");

const ALLOWED_STATUS_UPDATES = new Set(["pending", "responding", "resolved"]);

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
  return `Your incident report status has been updated to ${status}.`;
};

const emitReportChange = async (req, report, notificationMessage, notificationType = "status_update") => {
  const io = req.app.get("io");
  if (!io) return;

  const reportId = report._id.toString();
  io.emit(`statusUpdate-${reportId}`, report);

  const userIdStr = report.userId && report.userId._id ? report.userId._id.toString() : report.userId?.toString();
  if (userIdStr && notificationMessage) {
    // Persist the notification in the database
    try {
      const saved = await Notification.create({
        userId: userIdStr,
        reportId,
        title: "Incident Update",
        message: notificationMessage,
        status: report.status,
        type: notificationType
      });

      // Emit real-time notification with the persisted document _id
      io.to(userIdStr).emit("notification", {
        _id: saved._id.toString(),
        title: saved.title,
        message: saved.message,
        reportId,
        status: report.status,
        type: notificationType,
        read: false,
        createdAt: saved.createdAt
      });
    } catch (err) {
      console.error("Failed to persist notification:", err.message);
      // Still emit the socket event even if DB save fails
      io.to(userIdStr).emit("notification", {
        title: "Incident Update",
        message: notificationMessage,
        reportId,
        status: report.status,
        type: notificationType,
        read: false,
        createdAt: new Date().toISOString()
      });
    }
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
    const assignedResponderId = report.assignedResponder?.toString();
    const isRoutedStaff =
      currentUser.role === "staff" &&
      currentUser.agency &&
      report.notifiedAgencies.includes(currentUser.agency);
    const isAssignedResponder =
      currentUser.role === "responder" &&
      (assignedResponderId
        ? assignedResponderId === currentUser._id.toString()
        : currentUser.agency && report.notifiedAgencies.includes(currentUser.agency));

    if (!isAdmin && !isAssignedResponder && !isRoutedStaff) {
      return res.status(403).json({ message: "You are not allowed to update this report status" });
    }

    const previousStatus = report.status;
    report.status = status;
    report.actionLog.push({
      actorId: currentUser._id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
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
