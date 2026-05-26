require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

const createAdmin = async () => {
  const args = process.argv.slice(2);
  const email = args[0] || "admin@alertocalbayog.com";
  const password = args[1] || "admin123";
  const fullName = args[2] || "System Administrator";

  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Check if the user already exists
    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role === "admin") {
        console.log(`Admin account already exists for: ${email}`);
      } else {
        // Promote existing user to admin
        existing.role = "admin";
        await existing.save();
        console.log(`Successfully promoted existing user to ADMIN: ${email}`);
      }
      await mongoose.disconnect();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      fullName,
      username: email, // Satisfy MongoDB unique index
      email,
      password: hashedPassword,
      role: "admin",
      agency: "NONE",
      phoneNumber: "0000000000",
    });

    console.log("Admin account created successfully!");
    console.log(`  Name:     ${fullName}`);
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${args[1] ? "(custom password provided)" : "admin123"}`);
    console.log(`  Role:     admin`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

createAdmin();
