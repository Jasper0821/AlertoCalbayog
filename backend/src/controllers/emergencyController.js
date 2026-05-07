const EmergencyReport = require("../models/EmergencyReport");
const mapAgencies = require("../utils/agencyMapper");

exports.createEmergencyReport = async (req, res) => {
  try {
    const { emergencyType, description, latitude, longitude } = req.body;

    const notifiedAgencies = mapAgencies(emergencyType);

    if (!notifiedAgencies) {
      return res.status(400).json({ message: "Invalid emergency type" });
    }

    const report = await EmergencyReport.create({
      userId: req.user.id,
      emergencyType,
      notifiedAgencies,
      description,
      location: {
        latitude,
        longitude
      }
    });

    // Populate user info before emitting
    const populatedReport = await EmergencyReport.findById(report._id)
      .populate("userId", "fullName email role");

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
      .sort({ createdAt: -1 });

    res.json(reports);
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
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};