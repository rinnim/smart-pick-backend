const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "Product URL is required"],
      unique: true,
      validate: {
        validator: (v) => /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(v),
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    regularPrice: {
      type: Number,
      min: [0, "Regular price cannot be negative"],
    },
    stockStatus: {
      type: String,
      required: true,
      default: "Out Of Stock",
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
    },
    model: {
      type: String,
      required: [true, "Model is required"],
    },
    warranty: {
      type: String,
      required: [true, "Warranty information is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    subcategory: {
      type: String,
      required: [true, "Subcategory is required"],
    },
    images: {
      type: [String], // Array of strings for image URLs
      required: [true, "At least one image is required"],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "There must be at least one image URL.",
      },
    },
    shop: {
      type: String,
      required: [true, "Shop name is required"],
    },
    features: {
      type: Map,
      of: String, // Each feature key will have a string value
    },
    priceTimeline: [
      {
        date: {
          type: Date,
          default: Date.now,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: [0, "Price cannot be negative"],
        },
      },
    ],
  },
  { timestamps: true }
);

// Create index on URL for better performance on lookups
productSchema.index({ url: 1 }, { unique: true });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
