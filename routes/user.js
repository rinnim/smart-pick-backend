const express = require("express");
const { register, login, getUser } = require("../controllers/user");
const { authenticateJWT } = require("../middlewares/auth");

const router = express.Router();

// Public Routes
router.post("/register", register);
router.post("/login", login);

// Protected Route
router.get("/profile", authenticateJWT, getUser);

module.exports = router;
