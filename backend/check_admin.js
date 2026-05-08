require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admins = await User.find({ role: "admin" });
    if (admins.length > 0) {
      console.log("Admin accounts found:");
      admins.forEach((a) => console.log(`  Email: ${a.email} | Name: ${a.fullName}`));
    } else {
      console.log("No admin accounts found in the database.");
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

checkAdmin();
