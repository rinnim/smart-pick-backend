const express = require("express");
const userActions = require("../controllers/user_actions");
const { authenticateJWT } = require("../middlewares/auth");

const router = express.Router();

// Add to Favorites Route
router.post("/favorites", authenticateJWT, userActions.addOrRemoveFavorite);

// Add to Tracking Route
router.post("/trackings", authenticateJWT, userActions.addOrRemoveTracking);

// Add to Compare Route
router.post("/compares", authenticateJWT, userActions.addOrRemoveCompare);

// Get User Data Route
router.get("/data", authenticateJWT, userActions.getUserData);

module.exports = router;
