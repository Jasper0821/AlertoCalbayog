require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ email: "admin@alertocalbayog.com" });
    if (existing) {
      console.log("Admin already exists:", existing.email);
      await mongoose.disconnect();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await User.create({
      fullName: "System Administrator",
      username: "admin@alertocalbayog.com",
      email: "admin@alertocalbayog.com",
      password: hashedPassword,
      role: "admin",
      agency: "NONE",
      phoneNumber: "0000000000",
    });

    console.log("Admin account created successfully!");
    console.log("  Email:    admin@alertocalbayog.com");
    console.log("  Password: admin123");
    console.log("  Role:     admin");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

createAdmin();
