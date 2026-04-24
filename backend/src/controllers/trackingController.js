const Tracking = require("../models/Tracking");

exports.updateTracking = async (req, res) => {
  try {
    const { reportId, latitude, longitude } = req.body;
    
    const tracking = await Tracking.create({
      reportId,
      userId: req.user.id,
      latitude,
      longitude
    });

    const io = req.app.get("io");
    if (io) {
      io.emit(`trackingUpdate-${reportId}`, tracking);
    }

    res.status(200).json({ message: "Tracking updated", tracking });
  } catch (error) {
    console.error("Tracking Error:", error);
    res.status(500).json({ message: error.message });
  }
};
