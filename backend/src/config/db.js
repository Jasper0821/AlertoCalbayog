const mongoose = require("mongoose");

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is missing. Please check your .env file in the backend directory.");
  }

  // Register event listeners once
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB connection lost. Mongoose will auto-reconnect...");
  });
  mongoose.connection.on("reconnected", () => {
    console.log("✅ MongoDB reconnected successfully.");
  });
  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

  // Retry loop for initial connection (handles Atlas cold start + Render wake delays)
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔌 MongoDB connection attempt ${attempt}/${MAX_RETRIES}...`);
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 15000,  // 15s — Atlas free tier can take 10s+ to wake
        socketTimeoutMS: 45000,
        connectTimeoutMS: 15000,
      });
      console.log("✅ MongoDB connected");

      // Clean up null/empty values for sparse-indexed fields and resync indexes
      try {
        const User = require("../models/User");
        await User.updateMany({ email: { $in: [null, ""] } }, { $unset: { email: "" } });
        await User.updateMany({ username: { $in: [null, ""] } }, { $unset: { username: "" } });
        await User.updateMany({ googleId: { $in: [null, ""] } }, { $unset: { googleId: "" } });
        await User.updateMany({ facebookId: { $in: [null, ""] } }, { $unset: { facebookId: "" } });
        await User.syncIndexes();
        console.log("✅ MongoDB User indexes synchronized successfully.");
      } catch (indexErr) {
        console.warn("Index synchronization warning:", indexErr.message);
      }

      return; // Connection successful — exit the retry loop
    } catch (error) {
      console.error(`❌ MongoDB attempt ${attempt} failed: ${error.message}`);
      if (attempt < MAX_RETRIES) {
        console.log(`   Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        console.error("❌ All MongoDB connection attempts exhausted. Server will start but DB routes will return 503.");
        // Do NOT process.exit(1) — let the server start so Render doesn't enter a crash loop.
        // The health-check middleware in app.js will return 503 for API routes until DB reconnects.
      }
    }
  }
};

module.exports = connectDB;