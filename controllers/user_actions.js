const mongoose = require("mongoose");
const User = require("../models/user");

const addOrRemoveFavorite = async (req, res) => {
    try {
      console.log("Product ID: ", req.body.productId);
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
    } else {
      // Add the product to favorites
      user.favorites.push(productObjectId);
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
    const { productId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);
    const isTracking = user.trackings.some((tracking) =>
      tracking.equals(productObjectId)
    );

    if (isTracking) {
      // Remove the product from tracking
      user.trackings = user.trackings.filter(
        (tracking) => !tracking.equals(productObjectId)
      );
    } else {
      // Add the product to tracking
      user.trackings.push(productObjectId);
    }

    await User.findByIdAndUpdate(userId, { trackings: user.trackings });
    

    return res.status(200).json({
      message: isTracking
        ? "Product removed from tracking"
        : "Product added to tracking",
      trackings: user.trackings,
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
          .status(201)
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
      .populate("favorites") // Populate the favorites with Product details
      .populate("trackings") // Populate the trackings with Tracking details
      .populate("compares"); // Populate the compares with Product details

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
