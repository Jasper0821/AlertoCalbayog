const EmergencyReport = require("../models/EmergencyReport");
const mapAgency = require("../utils/agencyMapper");

exports.createEmergencyReport = async (req, res) => {
  try {
    const { emergencyType, description, latitude, longitude } = req.body;

    const assignedAgency = mapAgency(emergencyType);

    if (!assignedAgency) {
      return res.status(400).json({ message: "Invalid emergency type" });
    }

    const report = await EmergencyReport.create({
      userId: req.user.id,
      emergencyType,
      assignedAgency,
      description,
      location: {
        latitude,
        longitude
      }
    });

    const io = req.app.get("io");
    io.emit("newEmergencyAlert", report);

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
    const reports = await EmergencyReport.find({ assignedAgency: agency })
      .populate("userId", "fullName email role")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};