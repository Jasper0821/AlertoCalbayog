const EmergencyReport = require("../models/EmergencyReport");

exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const report = await EmergencyReport.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({
      message: "Report status updated",
      report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};