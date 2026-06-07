const EmergencyReport = require("../models/EmergencyReport");
const mapAgencies = require("../utils/agencyMapper");

exports.createEmergencyReport = async (req, res) => {
  try {
    const { emergencyType, description, latitude, longitude } = req.body;

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
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
          {
            headers: {
              "User-Agent": "AlertoCalbayog/1.0"
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            barangay = addr.suburb || addr.neighbourhood || addr.village || addr.quarter || addr.city_district || "";
            street = addr.road || addr.street || addr.footway || addr.path || "";
            
            // Extract Purok if mentioned
            if (addr.neighbourhood && addr.neighbourhood.toLowerCase().includes("purok")) {
              purok = addr.neighbourhood;
            } else if (addr.suburb && addr.suburb.toLowerCase().includes("purok")) {
              purok = addr.suburb;
            } else if (addr.subdivision && addr.subdivision.toLowerCase().includes("purok")) {
              purok = addr.subdivision;
            }

            // Build clean location name
            const parts = [];
            if (purok) parts.push(purok);
            if (street && street !== purok) parts.push(street);
            if (barangay && barangay !== purok && barangay !== street) {
              parts.push(barangay.toLowerCase().startsWith("brgy") ? barangay : `Brgy. ${barangay}`);
            }
            if (addr.city) parts.push(addr.city);
            
            name = parts.join(", ") || data.display_name || "";
          }
        }
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err.message);
    }

    if (!name) {
      name = `Coordinates: ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
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

    // Populate user info before emitting
    const populatedReport = await EmergencyReport.findById(report._id)
      .populate("userId", "fullName email role phoneNumber")
      .populate("assignedResponder", "fullName email role agency phoneNumber");

    const io = req.app.get("io");

    // Emit to each notified agency room
    notifiedAgencies.forEach((agency) => {
      io.to(agency).emit("newEmergencyAlert", populatedReport);
    });

    // Always notify admin
    io.to("admin").emit("newEmergencyAlert", populatedReport);

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
    const reports = await EmergencyReport.find()
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
    const reports = await EmergencyReport.find({ userId: req.user.id })
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

    // Ensure the report belongs to the currently logged-in user
    if (report.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own reports" });
    }

    await EmergencyReport.findByIdAndDelete(id);

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReportsByAgency = async (req, res) => {
  try {
    const { agency } = req.params;
    // notifiedAgencies is an array — MongoDB matches if the value exists in the array
    const reports = await EmergencyReport.find({ notifiedAgencies: agency })
      .populate("userId", "fullName email role")
      .populate("assignedResponder", "fullName email role agency phoneNumber")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
