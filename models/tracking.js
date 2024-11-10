const mongoose = require("mongoose");

const wishlistchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  targetPrice: { type: Number, required: true },
  notified: { type: Boolean, default: false },
});

module.exports = mongoose.model("Wishlist", wishlistchema);
