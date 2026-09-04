const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    recipientRole: {
      type: String,
      enum: ["admin", "staff", "responder", "resident", "all"],
      default: "resident",
      index: true
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmergencyReport",
      default: null,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: "system"
    },
    type: {
      type: String,
      enum: ["status_update", "responder_assigned", "user_event", "system_event", "message", "audit"],
      default: "system_event"
    },
    link: {
      type: String,
      default: ""
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

// Compound indexes to prevent "Sort exceeded memory limit" on MongoDB Atlas Free Tier (M0).
// These let MongoDB use index-based sorting instead of loading all documents into 32MB RAM.
notificationSchema.index({ recipientRole: 1, userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, createdAt: -1 });
notificationSchema.index({ read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
