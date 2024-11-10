const express = require("express");
const {
  register,
  login,
  getAdminById,
  sendOTPforPasswordReset,
  verifyOTPforPasswordReset,
  resetPassword,
  sendOTPForEmailVerification,
  verifyOTPForEmailVerification,
  changePassword,
  updateAdminProfile,
  deleteAdmin,
} = require("../controllers/admin_controller");
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
router.get("/profile", authenticateJWT, getAdminById);
router.post("/reset-password", authenticateJWT, resetPassword);
router.post("/change-password", authenticateJWT, changePassword);
router.put("/update-profile", authenticateJWT, updateAdminProfile);
router.delete("/delete-profile", authenticateJWT, deleteAdmin);

module.exports = router;
