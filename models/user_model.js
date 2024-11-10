const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
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
    favoriteList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    wishlist: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        expectedPrice: {
          type: Number,
        },
      },
    ],
    compares: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    role: {
      type: String,
      default: "user",
    },
  },
  {
    timestamps: true,
    // Remove password and version key in the JSON response 
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password; // Remove password from JSON
        delete ret.__v; // Remove version key
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("User", userSchema);
