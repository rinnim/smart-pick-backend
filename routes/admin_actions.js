const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middlewares/auth'); 
const { getTotalUserAndAdmin, getUsersByDate } = require('../controllers/stat_report');
const {getAllUsers, deleteUserByAdmin, searchUsersByAnyField} = require('../controllers/user');   
const { deleteProduct } = require('../controllers/product');
// Import controllers
const {
    getProductStockStatusByShop,
} = require('../controllers/admin_actions');


// Protected Route
// router.get("/shop-stats", authenticateJWT, getProductStockStatusByShop);
// router.get("/user-admin-stats", authenticateJWT, getTotalUserAndAdmin);
// router.get("/users-by-date", authenticateJWT, getUsersByDate);
// router.get("/all-users", authenticateJWT, getAllUsers);
// router.get("/search-users", authenticateJWT, searchUsersByAnyField);
// router.delete("/delete-user/:userId", authenticateJWT, deleteUserByAdmin);
// router.delete("/delete-product/:productId", authenticateJWT, deleteProduct);

// will delete after testing
router.get("/shop-stats", getProductStockStatusByShop);
router.get("/user-admin-stats", getTotalUserAndAdmin);
router.get("/users-by-date", getUsersByDate);
router.get("/all-users", getAllUsers);
router.get("/search-users", searchUsersByAnyField);
router.delete("/delete-user/:userId", deleteUserByAdmin);
router.delete("/delete-product/:productId", deleteProduct);

// Product Routes


module.exports = router; 