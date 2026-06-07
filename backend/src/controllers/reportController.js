const EmergencyReport = require("../models/EmergencyReport");
const User = require("../models/User");

const ALLOWED_STATUS_UPDATES = new Set(["pending", "verified", "responding", "active", "resolved", "responded", "closed"]);

exports.updateReportStatus = async (req, res) => {
  try {
    const status = String(req.body.status || "").toLowerCase();
    const { id } = req.params;

    if (!ALLOWED_STATUS_UPDATES.has(status)) {
      return res.status(400).json({ message: "Invalid report status" });
    }

    const report = await EmergencyReport.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const currentUser = await User.findById(req.user.id).select("role agency");
    if (!currentUser) {
      return res.status(401).json({ message: "User not found" });
    }

    const isAdmin = currentUser.role === "admin";
    const isAssignedResponder =
      currentUser.role === "responder" &&
      currentUser.agency &&
      report.notifiedAgencies.includes(currentUser.agency);

    if (!isAdmin && !isAssignedResponder) {
      return res.status(403).json({ message: "You are not allowed to update this report status" });
    }

    report.status = status;
    await report.save();
    await report.populate("userId", "fullName email role phoneNumber");

    const io = req.app.get("io");
    if (io) {
      // 1. Emit real-time status update to tracking clients
      io.emit(`statusUpdate-${id}`, report);

      // 2. Notify the specific resident who submitted the report
      const userIdStr = report.userId && report.userId._id ? report.userId._id.toString() : report.userId?.toString();
      if (userIdStr) {
        let message = "";
        if (status === "verified") {
          message = "Your incident report has been verified. Rescue is on the way.";
        } else if (status === "responding" || status === "active") {
          message = "Your incident report is active. Rescue units are en route.";
        } else if (status === "resolved" || status === "responded") {
          message = "Your incident report has been resolved.";
        } else {
          message = `Your incident report status has been updated to ${status}.`;
        }

        io.to(userIdStr).emit("notification", {
          title: "Incident Update",
          message,
          reportId: id,
          status: report.status
        });
      }

      // 3. Notify agency rooms (like CDRRMO) and admin room so dashboards update in real time
      if (report.notifiedAgencies) {
        report.notifiedAgencies.forEach((agency) => {
          io.to(agency).emit("reportStatusChanged", report);
        });
      }
      io.to("admin").emit("reportStatusChanged", report);
    }

    res.json({
      message: "Report status updated",
      report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
