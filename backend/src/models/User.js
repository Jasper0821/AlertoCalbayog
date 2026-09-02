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
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    emergencyContactNumber: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "mobile", "google", "facebook"],
      default: "local",
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId && !this.facebookId;
      },
    },
    visiblePassword: {
      type: String,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
    },
    lastSeen: {
      type: Date,
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
    googleVerified: {
      type: Boolean,
      default: false,
    },
    barangay: {
      type: String,
      default: "",
    },
    completeAddress: {
      type: String,
      default: "",
    },
    residentVerificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    accountStatus: {
      type: String,
      enum: ["active", "restricted", "suspended", "deactivated"],
      default: "active",
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
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: transformUserJSON },
    toObject: { virtuals: true, transform: transformUserJSON }
  }
);

userSchema.pre("save", function () {
  if (this.mobileNumber && !this.phoneNumber) {
    this.phoneNumber = this.mobileNumber;
  } else if (this.phoneNumber && !this.mobileNumber) {
    this.mobileNumber = this.phoneNumber;
  }
});

function transformUserJSON(doc, ret) {
  ret.resident_id = ret._id ? ret._id.toString() : "";
  ret.google_sub = ret.googleId || "";
  ret.google_email = ret.email || "";
  ret.full_name = ret.fullName || "";
  ret.profile_picture = ret.avatar || "";
  ret.mobile_number = ret.mobileNumber || ret.phoneNumber || "";
  ret.phone_number = ret.phoneNumber || ret.mobileNumber || "";
  ret.emergency_contact_number = ret.emergencyContactNumber || "";
  ret.barangay = ret.barangay || "";
  ret.complete_address = ret.completeAddress || "";
  ret.google_verified = ret.googleVerified || ret.authProvider === "google";
  ret.resident_verification_status = ret.residentVerificationStatus || "pending";
  ret.account_status = ret.accountStatus || "active";
  ret.created_at = ret.createdAt;
  ret.updated_at = ret.updatedAt;
  ret.last_login = ret.lastLogin;
  delete ret.password;
  delete ret.visiblePassword;
  return ret;
}

module.exports = mongoose.model("User", userSchema);
