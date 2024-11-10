const express = require("express");
const userActions = require("../controllers/user_actions");
const { authenticateJWT } = require("../middlewares/auth");

const router = express.Router();

// Add to Favorites Route
router.post("/favoriteList", authenticateJWT, userActions.addOrRemoveProductFromFavoriteList);

// Add to Wishlist Route
router.post("/wishlist", authenticateJWT, userActions.addOrRemoveWishlist);


// Add to Compare Route
router.post("/compares", authenticateJWT, userActions.addOrRemoveProductFromCompareList);

// Get User Data Route
router.get("/data", authenticateJWT, userActions.getUserData);

module.exports = router;
