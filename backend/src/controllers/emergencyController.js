const EmergencyReport = require("../models/EmergencyReport");
const Notification = require("../models/Notification");
const mapAgencies = require("../utils/agencyMapper");
const { getSettingValue } = require("./settingsController");

const cleanText = (value = "") =>
  String(value)
    .replace(/\s+/g, " ")
    .replace(/\b(calbayog\s+city|city\s+of\s+calbayog|calbayog|samar|philippines)\b/gi, "")
    .replace(/(^|,\s*)(brgy\.?|barangay)\s*$/gi, "")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim();

const cleanBarangay = (value = "") =>
  cleanText(value)
    .replace(/^(brgy\.?|barangay)\s+/i, "")
    .replace(/\s+district$/i, " District")
    .trim();

const cleanPurok = (value = "") => {
  const cleaned = cleanText(value);
  const match = cleaned.match(/\bpurok\s+([a-z0-9 -]+)/i);
  if (!match) return "";
  const name = match[1].replace(/,\s*.*/, "").trim();
  return name ? `Purok ${name}` : "";
};

const buildReadableLocationName = ({ barangay, purok }) => {
  const safeBarangay = cleanBarangay(barangay);
  const safePurok = cleanPurok(purok);
  if (!safeBarangay || !safePurok) return "";
  return `${safePurok}, Brgy. ${safeBarangay}, Calbayog City`;
};

exports.createEmergencyReport = async (req, res) => {
  try {
    const { emergencyType, description, latitude, longitude } = req.body;

    // Check if this category is currently disabled in admin settings
    const activeCategories = await getSettingValue("activeCategories");
    if (activeCategories) {
      const typeKey = (emergencyType || "").toLowerCase();
      // Map report type to category key used in settings
      const categoryKey = typeKey === "emergency" ? "others" : typeKey;
      if (activeCategories[categoryKey] === false) {
        return res.status(403).json({
          message: `${emergencyType} incident reports are currently disabled by the system administrator. Please contact your local authority directly.`
        });
      }
    }

    const notifiedAgencies = mapAgencies(emergencyType);

    if (!notifiedAgencies) {
      return res.status(400).json({ message: "Invalid emergency type" });
    }

    let name = "";
    let barangay = "";
    let street = "";
    let purok = "";

    try {
      if (typeof fetch === "function") {
        const controller = new AbortController();
        const geoTimeout = setTimeout(() => controller.abort(), 1000);

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
          {
            headers: { "User-Agent": "AlertoCalbayog/1.0" },
            signal: controller.signal
          }
        );
        clearTimeout(geoTimeout);

        if (response.ok) {
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            barangay = addr.suburb || addr.neighbourhood || addr.village || addr.quarter || addr.city_district || "";
            street = addr.road || addr.street || addr.footway || addr.path || "";

            if (addr.neighbourhood && addr.neighbourhood.toLowerCase().includes("purok")) {
              purok = addr.neighbourhood;
            } else if (addr.suburb && addr.suburb.toLowerCase().includes("purok")) {
              purok = addr.suburb;
            } else if (addr.subdivision && addr.subdivision.toLowerCase().includes("purok")) {
              purok = addr.subdivision;
            }

            const parts = [];
            barangay = cleanBarangay(barangay);
            purok = cleanPurok(purok);

            if (purok) parts.push(purok);
            if (street && street !== purok) parts.push(street);
            if (barangay && barangay !== purok && barangay !== street) {
              parts.push(barangay.toLowerCase().startsWith("brgy") ? barangay : `Brgy. ${barangay}`);
            }
            if (addr.city) parts.push(addr.city);

            name = buildReadableLocationName({ barangay, purok }) || "";
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Reverse geocoding failed:", err.message);
      }
    }

    const report = await EmergencyReport.create({
      userId: req.user.id,
      emergencyType,
      notifiedAgencies,
      description,
      location: {
        latitude,
        longitude,
        name,
        barangay,
        street,
        purok
      }
    });

    const populatedReport = await EmergencyReport.findById(report._id)
      .populate("userId", "fullName email role phoneNumber")
      .populate("assignedResponder", "fullName email role agency phoneNumber");

    const io = req.app.get("io");

    notifiedAgencies.forEach((agency) => {
      io.to(agency).emit("newEmergencyAlert", populatedReport);
    });

    io.to("admin").emit("newEmergencyAlert", populatedReport);

    try {
      const adminNotification = await Notification.create({
        recipientRole: "admin",
        reportId: populatedReport._id,
        title: "New incident reported",
        message: `A new ${populatedReport.emergencyType || "incident"} report has been submitted by ${populatedReport.userId?.fullName || "a resident"}.`,
        category: "incident",
        type: "system_event",
        metadata: {
          emergencyType: populatedReport.emergencyType,
          location: populatedReport.location,
        },
      });
      io.to("admin").emit("notification", adminNotification);
    } catch (err) {
      console.error("Failed to persist admin notification:", err.message);
    }

    res.status(201).json({
      message: "Emergency report created successfully",
      report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await EmergencyReport.find({ isDeleted: { $ne: true } })
      .populate("userId", "fullName email role")
      .populate("assignedResponder", "fullName email role agency phoneNumber")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const reports = await EmergencyReport.find({ userId: req.user.id, isDeleted: { $ne: true } })
      .populate("userId", "fullName email role")
      .populate("assignedResponder", "fullName email role agency phoneNumber")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMyReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await EmergencyReport.findById(id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Admins can delete any report; residents can only delete their own
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && report.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own reports" });
    }

    const notifiedAgencies = report.notifiedAgencies || [];

    // Soft-delete: update isDeleted flag to true instead of removing from database
    report.isDeleted = true;
    await report.save();

    // Emit real-time deletion event to all connected dashboards to remove from active views
    const io = req.app.get("io");
    if (io) {
      io.to("admin").emit("reportDeleted", { id });
      notifiedAgencies.forEach((agency) => {
        io.to(agency).emit("reportDeleted", { id });
      });
    }

    res.json({ message: "Report soft-deleted successfully", report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReportsByAgency = async (req, res) => {
  try {
    const { agency } = req.params;
    const reports = await EmergencyReport.find({ notifiedAgencies: agency, isDeleted: { $ne: true } })
      .populate("userId", "fullName email role phoneNumber")
      .populate("assignedResponder", "fullName email role agency phoneNumber")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDeletedReports = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only administrators can view deleted reports." });
    }
    const reports = await EmergencyReport.find({ isDeleted: true })
      .populate("userId", "fullName email role")
      .populate("assignedResponder", "fullName email role agency phoneNumber")
      .sort({ updatedAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.restoreReport = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only administrators can restore reports." });
    }

    const report = await EmergencyReport.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.isDeleted = false;
    await report.save();

    const populatedReport = await EmergencyReport.findById(id)
      .populate("userId", "fullName email role phoneNumber")
      .populate("assignedResponder", "fullName email role agency phoneNumber");

    const io = req.app.get("io");
    if (io) {
      // Broadcast newEmergencyAlert to bring it back to active report lists in dashboards
      io.to("admin").emit("newEmergencyAlert", populatedReport);
      (populatedReport.notifiedAgencies || []).forEach((agency) => {
        io.to(agency).emit("newEmergencyAlert", populatedReport);
      });
    }

    res.json({ message: "Report restored successfully", report: populatedReport });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
