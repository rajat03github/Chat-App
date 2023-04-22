// User-Model for the Database
const mongoose = require("mongoose");

// Define Schema
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    password: { type: String },
  },
  { timestamps: true }
);

//Exporting The Module
const UsermModel = mongoose.model("User", UserSchema);
module.exports = UsermModel;
