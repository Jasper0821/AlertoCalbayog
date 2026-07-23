const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true
    },
    username: {
      type: String,
      unique: true,
      sparse: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true
    },
    visiblePassword: {
      type: String,
    },
    role: {
      type: String,
      enum: ["resident", "responder", "staff", "admin"],
      default: "resident"
    },
    agency: {
      type: String,
      enum: ["BFP", "CDRRMO", "PNP", "NONE"],
      default: "NONE"
    },
    phoneNumber: {
      type: String
    },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "approved"
    },
    avatar: {
      type: String,
      default: ""
    },
    employeeId: { type: String },
    rank: { type: String },
    bio: { type: String },
    twoFactor: { type: Boolean, default: false },
    loginAlerts: { type: Boolean, default: true },
    sessionTimeout: { type: Boolean, default: true },
    ipRestriction: { type: Boolean, default: false },
    language: { type: String, default: "English (US)" },
    timezone: { type: String, default: "Asia/Manila (UTC+8)" },
    dateFormat: { type: String, default: "MM/DD/YYYY" },
    timeFormat: { type: String, default: "12-Hour (AM/PM)" },
    soundAlerts: { type: Boolean, default: true },
    loopAlarm: { type: Boolean, default: true },
    desktopPush: { type: Boolean, default: true },
    emailDigest: { type: Boolean, default: false },
    smsAlerts: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
