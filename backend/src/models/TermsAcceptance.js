const mongoose = require("mongoose");

const termsAcceptanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    googleId: {
      type: String,
      default: "",
    },
    termsAccepted: {
      type: Boolean,
      default: true,
    },
    termsVersion: {
      type: String,
      default: "1.0",
    },
    privacyPolicyAccepted: {
      type: Boolean,
      default: true,
    },
    privacyPolicyVersion: {
      type: String,
      default: "1.0",
    },
    acceptedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TermsAcceptance", termsAcceptanceSchema);
