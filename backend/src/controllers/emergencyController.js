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

const buildReadableLocationName = ({ landmark, barangay, purok, street, cityOrTown, userBarangay, userAddress, rawDisplayName }) => {
  const safeBarangay = cleanBarangay(barangay);
  const safePurok = cleanPurok(purok);
  const isGenericBarangay = !safeBarangay || /^(district|calbayog)$/i.test(safeBarangay);

  const parts = [];
  if (landmark && landmark !== street && landmark !== safeBarangay) parts.push(landmark);
  if (street) parts.push(street);
  if (safePurok) parts.push(safePurok);
  if (!isGenericBarangay) {
    parts.push(safeBarangay.toLowerCase().startsWith("brgy") ? safeBarangay : `Brgy. ${safeBarangay}`);
  } else if (userBarangay && !/^(district|calbayog)$/i.test(userBarangay)) {
    const safeUserBgy = cleanBarangay(userBarangay);
    if (safeUserBgy) {
      parts.push(safeUserBgy.toLowerCase().startsWith("brgy") ? safeUserBgy : `Brgy. ${safeUserBgy}`);
    }
  }

  const cityName = cityOrTown && !/calbayog/i.test(cityOrTown) ? cityOrTown : "Calbayog City";

  if (parts.length > 0) {
    parts.push(cityName);
    return parts.join(", ");
  }

  // If parts is empty (no landmark, no street, no specific barangay), parse rawDisplayName
  if (rawDisplayName) {
    const cleanedDisplay = rawDisplayName
      .replace(/,\s*(philippines|6710|eastern visayas|samar)\b/gi, "")
      .replace(/^[,\s]+|[,\s]+$/g, "")
      .trim();
    if (cleanedDisplay && !/^(calbayog|calbayog city)$/i.test(cleanedDisplay)) {
      return cleanedDisplay;
    }
  }

  if (userAddress) return userAddress;
  if (userBarangay && !/^(district|calbayog)$/i.test(userBarangay)) {
    return userBarangay.toLowerCase().startsWith("brgy") ? userBarangay : `Brgy. ${userBarangay}, Calbayog City`;
  }

  return "";
};

exports.createEmergencyReport = async (req, res) => {
  try {
    const { emergencyType, description, latitude, longitude } = req.body;
    const proofPhotos = Array.isArray(req.body.proofPhotos)
      ? req.body.proofPhotos
      : Array.isArray(req.body.photos)
      ? req.body.photos
      : [];

    if (proofPhotos.length < 2 || proofPhotos.length > 5) {
      return res.status(400).json({
        message: "Proof Photo Validation Error: Emergency reports require a minimum of 2 pictures and a maximum of 5 pictures as proof."
      });
    }

    // Account Status Guard: Check if resident account is restricted or suspended
    const User = require("../models/User");
    const resident = await User.findById(req.user.id);
    if (!resident) {
      return res.status(404).json({ message: "User account not found." });
    }

    if (resident.accountStatus && resident.accountStatus !== "active") {
      return res.status(403).json({
        message: `Account Restricted: Your resident account is currently ${resident.accountStatus}. You cannot submit emergency reports at this time.`,
      });
    }

    // Rate Limiting: Limit to 3 reports per 5 minutes per resident
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentReportsCount = await EmergencyReport.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: fiveMinutesAgo },
    });

    if (recentReportsCount >= 3) {
      return res.status(429).json({
        message: "Spam Protection: You have reached the limit of 3 reports within 5 minutes. Please wait before submitting another report.",
      });
    }

    // Duplicate Submission Detection: Prevent submitting duplicate report of same type within 3 minutes
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    const duplicateReport = await EmergencyReport.findOne({
      userId: req.user.id,
      emergencyType,
      createdAt: { $gte: threeMinutesAgo },
      isDeleted: { $ne: true },
    });

    if (duplicateReport) {
      return res.status(429).json({
        message: "Duplicate Alert: A report of this emergency type was already submitted recently. Emergency responders have been alerted.",
      });
    }


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

    let name = req.body.address || req.body.locationName || req.body.landmark || "";
    let barangay = req.body.barangay || "";
    let street = req.body.street || "";
    let purok = req.body.purok || "";
    let cityOrTown = "Calbayog City";
    let landmark = req.body.landmark || "";

    try {
      if (typeof fetch === "function") {
        const controller = new AbortController();
        const geoTimeout = setTimeout(() => controller.abort(), 350);

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
            if (!landmark) landmark = addr.amenity || addr.building || addr.office || addr.school || addr.hospital || addr.shop || addr.tourism || addr.leisure || addr.historic || addr.emergency || addr.place || data.name || "";
            if (!barangay) barangay = addr.suburb || addr.neighbourhood || addr.village || addr.quarter || addr.city_district || addr.hamlet || addr.subdistrict || addr.district || "";
            if (!street) street = addr.road || addr.street || addr.footway || addr.path || addr.pedestrian || "";
            cityOrTown = addr.city || addr.town || addr.municipality || addr.county || addr.state_district || "Calbayog City";

            if (!purok) {
              if (addr.neighbourhood && addr.neighbourhood.toLowerCase().includes("purok")) {
                purok = addr.neighbourhood;
              } else if (addr.suburb && addr.suburb.toLowerCase().includes("purok")) {
                purok = addr.suburb;
              } else if (addr.subdivision && addr.subdivision.toLowerCase().includes("purok")) {
                purok = addr.subdivision;
              }
            }

            barangay = cleanBarangay(barangay);
            purok = cleanPurok(purok);

            if (!name) {
              name = buildReadableLocationName({
                landmark,
                barangay,
                purok,
                street,
                cityOrTown,
                userBarangay: resident.barangay,
                userAddress: resident.completeAddress,
                rawDisplayName: data.display_name
              }) || "";
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Reverse geocoding failed:", err.message);
      }
    }

    if (!barangay && resident.barangay) {
      barangay = resident.barangay;
    }

    // Build exact resident location string prioritizing complete resident address / landmark:
    const finalParts = [];
    const userAddr = (resident.completeAddress || "").trim();
    const safeBgy = (barangay || resident.barangay || "").trim();
    const bgyFormatted = safeBgy ? (safeBgy.toLowerCase().startsWith("brgy") ? safeBgy : `Brgy. ${safeBgy}`) : "";

    if (userAddr) {
      finalParts.push(userAddr);
    } else if (landmark) {
      finalParts.push(landmark);
    } else if (name && !/^(calbayog|calbayog city)$/i.test(name)) {
      finalParts.push(name);
    }

    if (street && !finalParts.some(p => p.toLowerCase().includes(street.toLowerCase()))) {
      finalParts.push(street);
    }

    if (purok && !finalParts.some(p => p.toLowerCase().includes(purok.toLowerCase()))) {
      finalParts.push(purok);
    }

    if (bgyFormatted && !finalParts.some(p => p.toLowerCase().includes(safeBgy.toLowerCase()))) {
      finalParts.push(bgyFormatted);
    }

    if (!finalParts.some(p => /calbayog/i.test(p))) {
      finalParts.push("Calbayog City");
    }

    const exactLocationName = Array.from(new Set(finalParts)).join(", ");

    const report = await EmergencyReport.create({
      userId: req.user.id,
      emergencyType,
      notifiedAgencies,
      description,
      proofPhotos,
      location: {
        latitude,
        longitude,
        name: exactLocationName,
        barangay,
        street,
        purok
      }
    });

    const populatedReport = await EmergencyReport.findById(report._id)
      .populate("userId", "fullName email role phoneNumber avatar barangay completeAddress")
      .populate("assignedResponder", "fullName email role agency phoneNumber");

    const io = req.app.get("io");
    const residentInfo = populatedReport.userId;

    notifiedAgencies.forEach((agency) => {
      io.to(agency).emit("newEmergencyAlert", populatedReport);
    });

    io.to("admin").emit("newEmergencyAlert", populatedReport);

    // Create notifications for admin AND each notified responder agency
    const notifTitle = "New incident reported";
    const notifMessage = `A new ${populatedReport.emergencyType || "incident"} report has been submitted by ${residentInfo?.fullName || "a resident"}.`;
    const notifMeta = {
      emergencyType: populatedReport.emergencyType,
      location: populatedReport.location,
      proofPhotos: populatedReport.proofPhotos || [],
      resident: residentInfo ? {
        fullName: residentInfo.fullName || "",
        email: residentInfo.email || "",
        phoneNumber: residentInfo.phoneNumber || "",
        avatar: residentInfo.avatar || "",
        barangay: residentInfo.barangay || "",
      } : null,
    };

    try {
      // Admin notification
      const adminNotification = await Notification.create({
        recipientRole: "admin",
        reportId: populatedReport._id,
        title: notifTitle,
        message: notifMessage,
        category: "incident",
        type: "system_event",
        metadata: notifMeta,
      });
      io.to("admin").emit("notification", adminNotification);

      // Responder notifications — one per agency
      for (const agency of notifiedAgencies) {
        const responderNotif = await Notification.create({
          recipientRole: "responder",
          reportId: populatedReport._id,
          title: notifTitle,
          message: notifMessage,
          category: "incident",
          type: "system_event",
          metadata: { ...notifMeta, agency },
        });
        io.to(agency).emit("notification", responderNotif);
      }
    } catch (err) {
      console.error("Failed to persist notifications:", err.message);
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
      .select("-proofPhotos -resolutionEvidence")
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
      .select("-proofPhotos -resolutionEvidence")
      .populate("userId", "fullName email role")
      .populate("assignedResponder", "fullName email role agency phoneNumber")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await EmergencyReport.findById(id)
      .populate("userId", "fullName email role phoneNumber avatar barangay completeAddress")
      .populate("assignedResponder", "fullName email role agency phoneNumber");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report);
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

exports.deleteAllClosedReports = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only administrators can delete closed incidents." });
    }

    // Permanently delete all reports whose status is "closed"
    const result = await EmergencyReport.deleteMany({ status: "closed" });

    res.json({
      message: `${result.deletedCount} closed incident${result.deletedCount === 1 ? "" : "s"} deleted permanently.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReportsByAgency = async (req, res) => {
  try {
    const { agency } = req.params;
    const agencyUpper = String(agency).toUpperCase();

    let typeFallback = [];
    if (agencyUpper === "BFP") typeFallback = ["fire"];
    else if (agencyUpper === "PNP") typeFallback = ["crime"];
    else if (agencyUpper === "CDRRMO") typeFallback = ["fire", "flood", "emergency", "medical", "others"];

    const reports = await EmergencyReport.find({
      isDeleted: { $ne: true },
      $or: [
        { notifiedAgencies: { $in: [agencyUpper, agency, new RegExp(`^${agencyUpper}$`, "i")] } },
        { emergencyType: { $in: typeFallback } },
        { notifiedAgencies: { $exists: false } },
        { notifiedAgencies: { $size: 0 } }
      ]
    })
      .select("-proofPhotos -resolutionEvidence")
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
      .select("-proofPhotos -resolutionEvidence")
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
