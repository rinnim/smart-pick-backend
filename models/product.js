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
      type: [String],
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
      type: Object,
      default: {},
      validate: {
        validator: function (value) {
          return Object.values(value).every((v) => typeof v === "string");
        },
        message: "All feature values must be strings",
      },
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
    totalClicks: {
      type: Number,
      default: 0,
    },
    totalFavorites: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
productSchema.index({ url: 1 }, { unique: true });
productSchema.index(
  {
    name: "text",
    brand: "text",
    model: "text",
    category: "text",
    subcategory: "text",
  },
  {
    weights: {
      name: 50, // Name is most important
      brand: 30, // Brand is second most important
      model: 30, // Model is equally important as brand
      category: 10, // Category is less important
      subcategory: 10, // Subcategory is equally important as category
    },
    name: "ProductSearchIndex", // Named index for easier management
  }
);
productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ totalFavorites: -1 });
productSchema.index({ totalClicks: -1 });
productSchema.index({ updatedAt: -1 });

// Composite Indexes for better query performance
productSchema.index({ category: 1, subcategory: 1, stockStatus: 1 });
productSchema.index({ brand: 1, price: 1 });
productSchema.index({ price: 1, stockStatus: 1 });

// Array field index (for priceTimeline.date field)
productSchema.index({ "priceTimeline.date": 1 });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
