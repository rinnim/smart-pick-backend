const mongoose = require("mongoose");
const User = require("../models/user");
const { incrementFavorites, decrementFavorites } = require("../utils/product_utils");

const addOrRemoveFavorite = async (req, res) => {
    try {
      // console.log("Product ID: ", req.body.productId);
    const { productId } = req.body;
    const userId = req.user.id;

    // Fetch the user from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);

    // Check if the product is already in favorites
    const isFavorite = user.favorites.some((fav) =>
      fav.equals(productObjectId)
    );

    if (isFavorite) {
      // Remove the product from favorites
      user.favorites = user.favorites.filter(
        (fav) => !fav.equals(productObjectId)
      );
      await decrementFavorites(productId);
    } else {
      // Add the product to favorites
      user.favorites.push(productObjectId);
      await incrementFavorites(productId);
    }

    await User.findByIdAndUpdate(userId, { favorites: user.favorites });

    return res.status(200).json({
      message: isFavorite
        ? "Product removed from favorites"
        : "Product added to favorites",
      favorites: user.favorites,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message || error });
  }
};

const addOrRemoveTracking = async (req, res) => {
  try {
    const { productId, expectedPrice } = req.body;
    const userId = req.user.id;
    console.log("Product ID: ", productId);
    console.log("Expected Price: ", expectedPrice);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);
    const isTracking = user.trackings.some((tracking) =>
      tracking.product.equals(productObjectId)
    );

    if (isTracking) {
      // Remove the product from tracking
      user.trackings = user.trackings.filter(
        (tracking) => !tracking.product.equals(productObjectId)
      );
    } else {
      // Validate expectedPrice
      if (expectedPrice <= 0) {
        return res.status(400).json({ message: "Expected price cannot be zero or negative" });
      }
      
      // Add the product to tracking
      user.trackings.push({ product: productObjectId, expectedPrice });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { trackings: user.trackings },
      { new: true }
    );

    return res.status(200).json({
      message: isTracking
        ? "Product removed from tracking"
        : "Product added to tracking",
      trackings: updatedUser.trackings,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message || error });
  }
};

const addOrRemoveCompare = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);
    const isComparing = user.compares.some((compare) =>
      compare.equals(productObjectId)
    );

    if (isComparing) {
      // Remove the product from comparison
      user.compares = user.compares.filter(
        (compare) => !compare.equals(productObjectId)
      );
    } else {
      if (user.compares.length <2) {
        user.compares.push(productObjectId);
      } else {
        return res
          .status(400)
          .json({ message: "You can only compare up to 2 products" });
      }
    }

    await User.findByIdAndUpdate(userId, { compares: user.compares });
    

    return res.status(200).json({
      message: isComparing
        ? "Product removed from comparison"
        : "Product added to comparison",
      compares: user.compares,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message || error });
  }
};



const getUserData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch the user and populate the relevant fields
    const user = await User.findById(userId)
      .populate('favorites')  // Populate favorites array
      .populate('trackings.product')  // Populate the product field within trackings
      .populate('compares');  // Populate compares array

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      favorites: user.favorites,
      trackings: user.trackings,
      compares: user.compares,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message || error });
  }
};



module.exports = {
  addOrRemoveFavorite,
  addOrRemoveTracking,
  addOrRemoveCompare,
  getUserData,
};
