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
      enum: ["fire", "flood", "emergency", "crime", "medical", "others"],
      required: true
    },
    notifiedAgencies: {
      type: [String],
      enum: ["BFP", "CDRRMO", "PNP"],
      required: true
    },
    assignedAgency: {
      type: String,
      enum: ["BFP", "CDRRMO", "PNP", "NONE"],
      default: "NONE"
    },
    assignedResponder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    description: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "responding", "resolved"],
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
      },
      name: {
        type: String,
        default: ""
      },
      barangay: {
        type: String,
        default: ""
      },
      street: {
        type: String,
        default: ""
      },
      purok: {
        type: String,
        default: ""
      }
    },
    actionLog: [
      {
        actorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        actorName: {
          type: String,
          default: "System"
        },
        actorRole: {
          type: String,
          default: ""
        },
        action: {
          type: String,
          required: true
        },
        fromStatus: {
          type: String,
          default: ""
        },
        toStatus: {
          type: String,
          default: ""
        },
        message: {
          type: String,
          default: ""
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmergencyReport", emergencyReportSchema);
