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
      enum: ["fire", "flood", "medical"],
      required: true
    },
    assignedAgency: {
      type: String,
      enum: ["BFP", "DRRMO", "EMS"],
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