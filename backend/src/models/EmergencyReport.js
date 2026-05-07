const mongoose = require("mongoose");

const emergencyReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    emergencyType: {
      type: String,
      enum: ["fire", "flood", "emergency", "crime"],
      required: true
    },
    notifiedAgencies: {
      type: [String],
      enum: ["BFP", "CDRRMO", "PNP"],
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "responding", "resolved", "closed"],
      default: "pending"
    },
    location: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmergencyReport", emergencyReportSchema);