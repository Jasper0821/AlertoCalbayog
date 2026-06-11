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
      unique: true
    },
    password: {
      type: String,
      required: true
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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
