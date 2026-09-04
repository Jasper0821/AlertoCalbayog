const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is missing. Please check your .env file in the backend directory.");
    }

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB connection lost. Attempting auto-reconnect...");
    });
    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected successfully.");
    });
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB connected");

    // Clean up null/empty values for sparse-indexed fields and resync MongoDB indexes
    try {
      const User = require("../models/User");
      await User.updateMany({ email: { $in: [null, ""] } }, { $unset: { email: "" } });
      await User.updateMany({ username: { $in: [null, ""] } }, { $unset: { username: "" } });
      await User.updateMany({ googleId: { $in: [null, ""] } }, { $unset: { googleId: "" } });
      await User.updateMany({ facebookId: { $in: [null, ""] } }, { $unset: { facebookId: "" } });
      await User.syncIndexes();
      console.log("MongoDB User indexes synchronized successfully.");
    } catch (indexErr) {
      console.warn("Index synchronization warning:", indexErr.message);
    }
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;