const express = require("express");
const { register, login, getUser, sendOTPforPasswordReset, verifyOTPforPasswordReset, resetPassword, sendOTPForEmailVerification, verifyOTPForEmailVerification } = require("../controllers/user");
const { authenticateJWT } = require("../middlewares/auth");

const router = express.Router();

// Public Routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password/send-otp", sendOTPforPasswordReset);
router.post("/forgot-password/verify-otp", verifyOTPforPasswordReset);
router.post("/signup/send-otp", sendOTPForEmailVerification);
router.post("/signup/verify-otp", verifyOTPForEmailVerification);

// Protected Route
router.get("/profile", authenticateJWT, getUser);
router.post("/reset-password", authenticateJWT, resetPassword);


module.exports = router;
