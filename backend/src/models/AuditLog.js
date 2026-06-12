const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["user_activity", "password_security"],
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorName: {
      type: String,
      default: "System",
    },
    actorEmail: {
      type: String,
      default: "",
    },
    actorRole: {
      type: String,
      default: "",
    },
    // For password security entries
    otpCode: {
      type: String,
      default: "",
    },
    otpVerifiedAt: {
      type: Date,
      default: null,
    },
    details: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
