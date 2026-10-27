const mongoose = require("mongoose");

/**
 * One registered voter, stored only as an HMAC fingerprint (see utils/voterMatch.js).
 * No name, address or birthdate is kept.
 */
const voterRecordSchema = new mongoose.Schema({
  matchKey: {
    type: String,
    required: true,
    unique: true,
  },
  // The one account allowed to verify against this record.
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  claimedAt: {
    type: Date,
    default: null,
  },
  // Other accounts that matched an already-claimed record, for admin review.
  disputedBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: undefined,
  },
});

module.exports = mongoose.model("VoterRecord", voterRecordSchema);
