const Product = require("../models/product_model");

// Increment the total clicks of a product
const incrementClicks = async (productId) => {
  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      { $inc: { totalClicks: 1 } },
      { new: true }
    );

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  } catch (error) {
    throw error;
  }
};

// Increment the total favoriteList of a product
const incrementFavorites = async (productId) => {
  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      { $inc: { totalFavorites: 1 } },
      { new: true }
    );
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  } catch (error) {
    throw error;
  }
};

// Decrement the total favoriteList of a product
const decrementFavorites = async (productId) => {
  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      { $inc: { totalFavorites: -1 } },
      { new: true }
    );
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  incrementClicks,
  incrementFavorites,
  decrementFavorites,
};
