const mongoose = require("mongoose");
const userModel = require("../models/user_model");
const {
  incrementFavorites,
  decrementFavorites,
} = require("../utils/product_utils");

const addOrRemoveProductFromFavoriteList = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // Fetch the user from the database
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);

    // Check if the product is already in favoriteList
    const isFavorite = user.favoriteList.some((fav) =>
      fav.equals(productObjectId)
    );

    if (isFavorite) {
      // Remove the product from favoriteList
      user.favoriteList = user.favoriteList.filter(
        (fav) => !fav.equals(productObjectId)
      );
      await decrementFavorites(productId);
    } else {
      // Add the product to favoriteList
      user.favoriteList.push(productObjectId);
      await incrementFavorites(productId);
    }

    await userModel.findByIdAndUpdate(userId, {
      favoriteList: user.favoriteList,
    });

    return res.status(200).json({
      status: "success",
      message: isFavorite
        ? "Product removed from favorite list"
        : "Product added to favorite list",
      data: {
        favoriteList: user.favoriteList,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Error adding or removing product to favorite list",
      error: error.message,
    });
  }
};

const addOrRemoveWishlist = async (req, res) => {
  try {
    const { productId, expectedPrice } = req.body;
    const userId = req.user.id;
    console.log("Product ID: ", productId);
    console.log("Expected Price: ", expectedPrice);
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);
    const isWishlisted = user.wishlist.some((wishlist) =>
      wishlist.product.equals(productObjectId)
    );

    if (isWishlisted) {
      // Remove the product from wishlist
      user.wishlist = user.wishlist.filter(
        (wishlist) => !wishlist.product.equals(productObjectId)
      );
    } else {
      // Validate expectedPrice
      if (expectedPrice <= 0) {
        return res.status(400).json({
          status: "error",
          message: "Expected price cannot be zero or negative",
        });
      }

      // Add the product to wishlist
      user.wishlist.push({
        product: productObjectId,
        expectedPrice: expectedPrice,
      });
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { wishlist: user.wishlist },
      { new: true }
    );

    return res.status(200).json({
      status: "success",
      message: isWishlisted
        ? "Product removed from wishlist."
        : "Product added to wishlist.",
      data: {
        wishlist: updatedUser.wishlist,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Error updating wishlist",
      error: error.message,
    });
  }
};

const addOrRemoveProductFromCompareList = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // Fetch the user from the database
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);

    const isInComparisonList = user.compares.some((compare) =>
      compare.equals(productObjectId)
    );

    if (isInComparisonList) {
      // Remove the product from comparison
      user.compares = user.compares.filter(
        (compare) => !compare.equals(productObjectId)
      );
    } else {
      user.compares.push(productObjectId);
    }

    // Check there is not more than 2 products in comparison list
    if (user.compares.length >= 2) {
      return res.status(400).json({
        status: "error",
        message: "You can only compare up to 2 products.",
      });
    }
    // Save updated comparison list
    await userModel.findByIdAndUpdate(userId, { compares: user.compares });

    return res.status(200).json({
      status: "success",
      message: isInComparisonList
        ? "Product removed from comparison list"
        : "Product added to comparison list",
      data: {
        compares: user.compares,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Error updating comparison list",
      error: error.message,
    });
  }
};

// Get user data
const getUserData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch the user and populate the relevant fields
    const user = await userModel
      .findById(userId)
      .populate("favoriteList") // Populate favoriteList array
      .populate("wishlist.product") // Populate the product field within wishlist
      .populate("compares"); // Populate compares array

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Return success response with user data
    return res.status(200).json({
      status: "success",
      message: "User data fetched successfully",
      data: {
        favoriteList: user.favoriteList,
        wishlist: user.wishlist,
        compares: user.compares,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Error fetching user data",
      error: error.message,
    });
  }
};

module.exports = {
  addOrRemoveProductFromFavoriteList,
  addOrRemoveWishlist,
  addOrRemoveProductFromCompareList,
  getUserData,
};
