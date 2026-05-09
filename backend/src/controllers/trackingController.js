const Tracking = require("../models/Tracking");
const EmergencyReport = require("../models/EmergencyReport");

exports.updateTracking = async (req, res) => {
  try {
    const { reportId, latitude, longitude } = req.body;
    
    const tracking = await Tracking.create({
      reportId,
      userId: req.user.id,
      latitude,
      longitude
    });

    // Fetch the current status of the report
    const report = await EmergencyReport.findById(reportId).select("status");

    const io = req.app.get("io");
    if (io) {
      io.emit(`trackingUpdate-${reportId}`, tracking);
    }

    res.status(200).json({ 
      message: "Tracking updated", 
      tracking,
      status: report ? report.status : "pending"
    });
  } catch (error) {
    console.error("Tracking Error:", error);
    res.status(500).json({ message: error.message });
  }
};
