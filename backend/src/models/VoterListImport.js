const mongoose = require("mongoose");

/** Who loaded the voters list, when, and under which data-sharing agreement. */
const voterListImportSchema = new mongoose.Schema({
  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  importedByName: {
    type: String,
    default: "",
  },
  importedAt: {
    type: Date,
    default: Date.now,
  },
  recordCount: {
    type: Number,
    default: 0,
  },
  // Birthdate is part of every fingerprint only when the uploaded list had it.
  includesBirthdate: {
    type: Boolean,
    default: false,
  },
  // Reference of the agreement under which COMELEC provided the list to the City.
  agreementReference: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("VoterListImport", voterListImportSchema);
