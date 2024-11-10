const express = require("express");
const {
  register,
  login,
  getUserById,
  sendOTPforPasswordReset,
  verifyOTPforPasswordReset,
  resetPassword,
  sendOTPForEmailVerification,
  changePassword,   
  updateUserProfile,
  deleteUserByUser,
} = require("../controllers/user_controller");
const { authenticateJWT } = require("../middlewares/auth");

const router = express.Router();

// Public Routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password/send-otp", sendOTPforPasswordReset);
router.post("/forgot-password/verify-otp", verifyOTPforPasswordReset);
router.post("/signup/send-otp", sendOTPForEmailVerification);

// Protected Route
router.get("/profile", authenticateJWT, getUserById);
router.post("/reset-password", authenticateJWT, resetPassword);
router.post("/change-password", authenticateJWT, changePassword);
router.put("/update-profile", authenticateJWT, updateUserProfile);
router.delete("/delete-profile", authenticateJWT, deleteUserByUser);

module.exports = router;
