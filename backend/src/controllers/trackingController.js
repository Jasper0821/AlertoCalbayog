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

    const report = await EmergencyReport.findById(reportId);
    if (report && report.location) {
      report.location.latitude = latitude;
      report.location.longitude = longitude;
      await report.save();
    }

    const io = req.app.get("io");
    if (io) {
      const payload = {
        reportId,
        latitude,
        longitude,
        userId: req.user.id,
        tracking
      };
      io.emit(`trackingUpdate-${reportId}`, tracking);
      io.to("CDRRMO").emit("liveLocationUpdate", payload);
      io.to("PNP").emit("liveLocationUpdate", payload);
      io.to("BFP").emit("liveLocationUpdate", payload);
      io.to("admin").emit("liveLocationUpdate", payload);
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
