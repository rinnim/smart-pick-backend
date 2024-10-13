const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  trackings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tracking",
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
