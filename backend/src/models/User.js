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
      sparse: true // Allows nulls to coexist if index already exists
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
      enum: ["resident", "responder", "admin"],
      default: "resident"
    },
    agency: {
      type: String,
      enum: ["BFP", "DRRMO", "EMS", "NONE"],
      default: "NONE"
    },
    phoneNumber: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);