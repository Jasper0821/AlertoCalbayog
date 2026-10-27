const EmergencyReport = require("../models/EmergencyReport");
const { isValidEvidenceImage } = require("../utils/evidenceImages");
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

// Android's geocoder names an unnamed spot by its Plus Code ("3H9V+8H2"), which the app
// sent as the landmark. That code is for the geocoder's snapped point, not the GPS fix;
// the dashboards derive the accurate one from the coordinates, so it is dropped here.
const withoutPlusCode = (value = "") =>
  String(value)
    .replace(/\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]*/gi, "")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim();

const cleanPurok = (value = "") => {
  const cleaned = cleanText(value);
  const match = cleaned.match(/\bpurok\s+([a-z0-9 -]+)/i);
  if (!match) return "";
  const name = match[1].replace(/,\s*.*/, "").trim();
  return name ? `Purok ${name}` : "";
};

// Builds a name for the INCIDENT's position. It intentionally takes no reporter
// profile data: falling back to the reporter's home barangay or address produced
// confident, wrong locations for any emergency reported away from home.
const buildReadableLocationName = ({ landmark, barangay, purok, street, cityOrTown, rawDisplayName }) => {
  const safeBarangay = cleanBarangay(barangay);
  const safePurok = cleanPurok(purok);
  const isGenericBarangay = !safeBarangay || /^(district|calbayog)$/i.test(safeBarangay);

  const parts = [];
  if (landmark && landmark !== street && landmark !== safeBarangay) parts.push(landmark);
  if (street) parts.push(street);
  if (safePurok) parts.push(safePurok);
  if (!isGenericBarangay) {
    parts.push(safeBarangay.toLowerCase().startsWith("brgy") ? safeBarangay : `Brgy. ${safeBarangay}`);
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

  // Nothing resolved. Return empty and let the caller surface coordinates rather
  // than substituting the reporter's home address for the incident's position.
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

    // Accepts uploaded Cloudinary URLs and legacy inline base64 alike.
    if (!proofPhotos.every(isValidEvidenceImage)) {
      return res.status(400).json({
        message: "Proof Photo Validation Error: each photo must be an uploaded photo URL or an inline image."
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

    // Address describing THE INCIDENT. The reporting device geocodes on-site and
    // sends these; anything it could not determine is filled in below.
    let name = withoutPlusCode(req.body.address || req.body.locationName || "");
    // cleanBarangay also empties the province ("Samar"), which Android reports in the
    // barangay's place when it has none; no Calbayog barangay contains that word.
    let barangay = cleanBarangay(req.body.barangay || "");
    if (/^district$/i.test(barangay)) barangay = "";
    let street = withoutPlusCode(req.body.street || "");
    let purok = (req.body.purok || "").trim();
    let cityOrTown = "Calbayog City";
    let landmark = withoutPlusCode(req.body.landmark || "");

    const accuracy = Number.isFinite(Number(req.body.accuracy))
      ? Number(req.body.accuracy)
      : null;

    // The phone geocodes with the OS geocoder while the reporter is standing at the
    // scene, so Nominatim is only a fallback for whatever it could not resolve.
    const needsServerGeocode = !barangay || !street;

    try {
      if (needsServerGeocode && typeof fetch === "function") {
        const controller = new AbortController();
        // 350ms was not enough to complete a TLS handshake to nominatim.openstreetmap.org
        // from this region, so the lookup aborted on essentially every report.
        const geoTimeout = setTimeout(() => controller.abort(), 3000);

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
                rawDisplayName: data.display_name
              }) || "";
            }
          }
        }
      }
    } catch (err) {
      // Previously an AbortError was swallowed entirely, so a lookup that timed out
      // on every single report left no trace anywhere in the logs.
      console.warn(
        `[Geocode] Reverse lookup failed for ${latitude},${longitude}:`,
        err.name === "AbortError" ? "timed out after 3000ms" : err.message
      );
    }

    // Build a location string that describes THE INCIDENT.
    //
    // This deliberately does NOT fall back to the reporter's registered home address
    // or home barangay. Doing so produced a confident, readable, WRONG address for any
    // emergency reported away from home, and a responder navigating to that text would
    // go to the wrong place. The reporter's own address is still returned separately on
    // userId.completeAddress, clearly labelled as their registered address.
    const finalParts = [];
    const bgyFormatted = barangay
      ? (barangay.toLowerCase().startsWith("brgy") ? barangay : `Brgy. ${barangay}`)
      : "";

    // The city is appended once at the end, so it is stripped from the geocoded name here.
    const cleanedName = cleanText(name).replace(/,(\s*,)+/g, ",");
    if (landmark) {
      finalParts.push(landmark);
    } else if (cleanedName) {
      finalParts.push(cleanedName);
    }

    if (street && !finalParts.some(p => p.toLowerCase().includes(street.toLowerCase()))) {
      finalParts.push(street);
    }

    if (purok && !finalParts.some(p => p.toLowerCase().includes(purok.toLowerCase()))) {
      finalParts.push(purok);
    }

    if (bgyFormatted && !finalParts.some(p => p.toLowerCase().includes(barangay.toLowerCase()))) {
      finalParts.push(bgyFormatted);
    }

    // Ends with the locality the way Google Maps writes it ("…, Calbayog, Samar"), or
    // the other town Nominatim placed the incident in. Left empty rather than emitting
    // a bare city, which carries no information and only masks that no address was
    // resolved; the dashboards still show the Plus Code derived from the coordinates.
    // A different town is named alone: its province is not necessarily Samar.
    const locality = cityOrTown && !/calbayog|samar|visayas/i.test(cityOrTown)
      ? cityOrTown
      : "Calbayog, Samar";
    const address = Array.from(new Set(finalParts)).join(", ");
    const exactLocationName = !address
      ? ""
      : address.toLowerCase().endsWith(locality.toLowerCase())
      ? address
      : `${address}, ${locality}`;

    // Optional quick details from the reporter. Bounded so a client cannot bloat
    // the document; anything malformed is simply dropped.
    const symptoms = Array.isArray(req.body.symptoms)
      ? req.body.symptoms
          .filter((s) => typeof s === "string" && s.trim())
          .map((s) => s.trim().slice(0, 40))
          .slice(0, 10)
      : [];
    const requestedPeople = parseInt(req.body.peopleCount, 10);
    const peopleCount = Number.isFinite(requestedPeople)
      ? Math.min(Math.max(requestedPeople, 1), 20)
      : 1;

    const report = await EmergencyReport.create({
      userId: req.user.id,
      emergencyType,
      notifiedAgencies,
      description,
      proofPhotos,
      symptoms,
      peopleCount,
      location: {
        latitude,
        longitude,
        name: exactLocationName,
        barangay,
        street,
        purok,
        landmark,
        accuracy
      }
    });

    const populatedReport = await EmergencyReport.findById(report._id)
      .populate("userId", "fullName email role phoneNumber residentVerificationStatus avatar barangay completeAddress")
      .populate("assignedResponder", "fullName email role agency phoneNumber");

    const io = req.app.get("io");
    const residentInfo = populatedReport.userId;

    // Photos are stripped from the broadcast. Sending them meant ~40MB of egress
    // per report once the fan-out across both agency rooms and admin is counted,
    // and the dashboards already load evidence on demand via GET /emergency/:id.
    const alertPayload = populatedReport.toObject();
    delete alertPayload.proofPhotos;
    delete alertPayload.resolutionEvidence;

    notifiedAgencies.forEach((agency) => {
      io.to(agency).emit("newEmergencyAlert", alertPayload);
    });

    io.to("admin").emit("newEmergencyAlert", alertPayload);

    // Create notifications for admin AND each notified responder agency
    const notifTitle = "New incident reported";
    const notifMessage = `A new ${populatedReport.emergencyType || "incident"} report has been submitted by ${residentInfo?.fullName || "a resident"}.`;
    // Neither proofPhotos nor the resident's base64 avatar belong here: both were
    // duplicated into every notification document, persisted a second time, and
    // re-sent over the socket to each agency plus admin.
    const notifMeta = {
      emergencyType: populatedReport.emergencyType,
      location: populatedReport.location,
      resident: residentInfo ? {
        fullName: residentInfo.fullName || "",
        email: residentInfo.email || "",
        phoneNumber: residentInfo.phoneNumber || "",
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
    // Bounded so the response cannot grow without limit as incidents accumulate.
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 500, 1), 2000);

    const reports = await EmergencyReport.find({ isDeleted: { $ne: true } })
      .select("-proofPhotos -resolutionEvidence")
      // barangay/completeAddress are the reporter's REGISTERED address, shown to
      // dispatchers as labelled context. They are never the incident's location.
      .populate("userId", "fullName email role phoneNumber residentVerificationStatus barangay completeAddress")
      .populate("assignedResponder", "fullName email role agency phoneNumber")
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const reports = await EmergencyReport.find({
      userId: req.user.id,
      isDeleted: { $ne: true },
      hiddenByResident: { $ne: true },
    })
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
      .populate("userId", "fullName email role phoneNumber residentVerificationStatus avatar barangay completeAddress")
      .populate("assignedResponder", "fullName email role agency phoneNumber");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Pushes a reporter-side change to the dashboards that hold the report, without
// photos: those are loaded on demand via GET /emergency/:id.
const broadcastReportChange = (req, report) => {
  const io = req.app.get("io");
  if (!io) return;
  const lean = report.toObject();
  delete lean.proofPhotos;
  delete lean.resolutionEvidence;
  io.to("admin").emit("reportStatusChanged", lean);
  (report.notifiedAgencies || []).forEach((agency) => {
    io.to(agency).emit("reportStatusChanged", lean);
  });
  io.to(report.userId.toString()).emit(`statusUpdate-${report._id}`, lean);
};

/**
 * The reporter withdraws a report that is no longer needed. Only allowed while it
 * is still pending: once an agency is responding, cancelling from the phone could
 * recall a team already on the road, so that has to go through the hotline.
 */
exports.cancelMyReport = async (req, res) => {
  try {
    const report = await EmergencyReport.findById(req.params.id);
    if (!report || report.isDeleted) {
      return res.status(404).json({ message: "Report not found" });
    }
    if (report.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only cancel your own reports" });
    }
    if (report.status !== "pending") {
      return res.status(409).json({
        message: "Responders are already handling this report. Please call the hotline to cancel it.",
        status: report.status,
      });
    }

    report.status = "cancelled";
    report.cancelledAt = new Date();
    report.actionLog.push({
      actorId: req.user.id,
      actorRole: req.user.role,
      actorName: "Reporter",
      action: "cancelled_by_reporter",
      fromStatus: "pending",
      toStatus: "cancelled",
      message: "Cancelled by the reporter: no longer needed.",
    });
    await report.save();

    broadcastReportChange(req, report);
    const lean = report.toObject();
    delete lean.proofPhotos;
    delete lean.resolutionEvidence;
    res.json({ message: "Report cancelled", report: lean });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * The reporter has seen the responders' evidence and says they are okay. Recorded
 * for the admin, who still makes the formal closure; the reporter's own list moves
 * the report to "Closed".
 */
exports.confirmMyReport = async (req, res) => {
  try {
    const report = await EmergencyReport.findById(req.params.id);
    if (!report || report.isDeleted) {
      return res.status(404).json({ message: "Report not found" });
    }
    if (report.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only confirm your own reports" });
    }
    if (!["resolved", "closed"].includes(report.status)) {
      return res.status(409).json({ message: "Responders haven't finished this report yet." });
    }

    if (!report.residentConfirmedAt) {
      report.residentConfirmedAt = new Date();
      report.actionLog.push({
        actorId: req.user.id,
        actorRole: req.user.role,
        actorName: "Reporter",
        action: "resident_confirmed",
        fromStatus: report.status,
        toStatus: report.status,
        message: "Reporter confirmed the incident is resolved.",
      });
      await report.save();

      try {
        const notification = await Notification.create({
          recipientRole: "admin",
          reportId: report._id,
          title: "Reporter confirmed resolution",
          message: `The reporter confirmed report ${report._id} is resolved. It is ready to close.`,
          category: "incident",
          type: "status_update",
          metadata: { status: report.status, reportId: report._id.toString(), residentConfirmed: true },
        });
        req.app.get("io")?.to("admin").emit("notification", notification);
      } catch (err) {
        console.warn("Resident confirmation notification failed:", err.message);
      }
      broadcastReportChange(req, report);
    }

    const lean = report.toObject();
    delete lean.proofPhotos;
    delete lean.resolutionEvidence;
    res.json({ message: "Thanks for confirming", report: lean });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Adds scene photos to a report after it was sent, up to the same 5-photo cap. */
exports.addMyReportPhotos = async (req, res) => {
  try {
    const photos = Array.isArray(req.body.photos) ? req.body.photos : [];
    if (photos.length === 0 || !photos.every(isValidEvidenceImage)) {
      return res.status(400).json({ message: "Each photo must be an uploaded photo URL or an inline image." });
    }

    const report = await EmergencyReport.findById(req.params.id);
    if (!report || report.isDeleted) {
      return res.status(404).json({ message: "Report not found" });
    }
    if (report.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only add photos to your own reports" });
    }
    if (!["pending", "responding"].includes(report.status)) {
      return res.status(409).json({ message: "This report is no longer active." });
    }
    if (report.proofPhotos.length + photos.length > 5) {
      return res.status(400).json({
        message: `A report can have at most 5 photos. You can add ${Math.max(0, 5 - report.proofPhotos.length)} more.`,
      });
    }

    report.proofPhotos.push(...photos);
    await report.save();

    broadcastReportChange(req, report);
    res.json({ message: "Photos added", report });
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

    // A resident only removes the report from their own "My reports" list. This used
    // to soft-delete the report itself and pull it from every agency dashboard, so a
    // resident could make an emergency in progress vanish from responders' queues and
    // erase the agencies' record of a closed case.
    if (!isAdmin) {
      if (["pending", "responding"].includes(report.status)) {
        return res.status(409).json({
          message: "Active reports can't be removed. Cancel the report first, or call the hotline.",
        });
      }
      report.hiddenByResident = true;
      await report.save();
      return res.json({ message: "Report removed from your history" });
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

    // This endpoint is polled by every open agency dashboard, so it must stay
    // bounded. It previously returned every matching report on every call, which
    // grows without limit as the city files more incidents.
    //
    // The full status range is still returned by default because the dashboard
    // derives Queuing, Incident History, Rejected and Closed Cases from this one
    // response. `status` narrows it when a caller only needs open incidents.
    const query = {
      isDeleted: { $ne: true },
      $or: [
        { notifiedAgencies: { $in: [agencyUpper, agency, new RegExp(`^${agencyUpper}$`, "i")] } },
        { emergencyType: { $in: typeFallback } },
        { notifiedAgencies: { $exists: false } },
        { notifiedAgencies: { $size: 0 } }
      ]
    };

    const requestedStatuses = String(req.query.status || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    if (requestedStatuses.length > 0) {
      query.status = { $in: requestedStatuses };
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 500, 1), 2000);

    const reports = await EmergencyReport.find(query)
      .select("-proofPhotos -resolutionEvidence -actionLog")
      .populate("userId", "fullName email role phoneNumber residentVerificationStatus barangay completeAddress")
      .populate("assignedResponder", "fullName email role agency phoneNumber")
      .sort({ createdAt: -1 })
      .limit(limit);

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
      .populate("userId", "fullName email role phoneNumber residentVerificationStatus")
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
