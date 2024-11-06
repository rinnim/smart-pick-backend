const express = require("express");
const router = express.Router();
const userController = require("../../controllers/user_controller");

// User Profile Routes
router.get("/profile", userController.getUserProfile);
router.put("/profile", userController.updateUserProfile);  
router.delete("/profile", userController.deleteUserProfile);   




module.exports = router;