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
    proofPhotos: {
      type: [String],
      default: []
    },
    // Quick "What's happening?" chips picked by the reporter, e.g. "Chest pain".
    symptoms: {
      type: [String],
      default: []
    },
    peopleCount: {
      type: Number,
      min: 1,
      max: 20,
      default: 1
    },
    status: {
      type: String,
      enum: ["pending", "responding", "resolved", "closed", "cancelled", "rejected"],
      default: "pending"
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolutionEvidence: {
      type: [String],
      default: []
    },
    // What the responders did, written when they resolve. Shown to the reporter.
    resolutionNotes: {
      type: String,
      default: "",
      maxlength: 500
    },
    // Why dispatch rejected the report, so the reporter is not left guessing.
    rejectionReason: {
      type: String,
      default: "",
      maxlength: 200
    },
    // Keep an explicit closing timestamp so a closed record can be identified
    // reliably after an API/server restart as well as in the admin history.
    closedAt: {
      type: Date,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    // Set when the reporter withdraws the report before any agency took it.
    cancelledAt: {
      type: Date,
      default: null
    },
    // The reporter checked the responders' evidence and said they are okay. This
    // does not close the case — admin closure stays the official final step.
    residentConfirmedAt: {
      type: Date,
      default: null
    },
    // Removed from the reporter's own "My reports" list only. The report stays in
    // every agency and admin record, unlike isDeleted.
    hiddenByResident: {
      type: Boolean,
      default: false
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
      },
      // What responders actually navigate by once GPS gets them to the block.
      landmark: {
        type: String,
        default: ""
      },
      // GPS uncertainty in metres, as reported by the device. Lets dispatch tell
      // a ±12 m fix from a ±480 m one instead of trusting every pin equally.
      accuracy: {
        type: Number,
        default: null
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
        // Which agency the actor belonged to. Lets the admin console show who
        // actually responded rather than only who was alerted.
        actorAgency: {
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
    ],
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmergencyReport", emergencyReportSchema);
