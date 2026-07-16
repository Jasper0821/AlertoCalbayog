require("dotenv").config();
const mongoose = require("mongoose");
const EmergencyReport = require("./src/models/EmergencyReport");

const inspectStreets = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const reports = await EmergencyReport.find({ "location.barangay": /district/i });
    const streets = {};
    const names = {};
    reports.forEach(r => {
      const s = r.location?.street || "No Street";
      streets[s] = (streets[s] || 0) + 1;
      const n = r.location?.name || "No Name";
      names[n] = (names[n] || 0) + 1;
    });
    console.log("Streets:", JSON.stringify(streets, null, 2));
    console.log("Names:", JSON.stringify(names, null, 2));
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

inspectStreets();
