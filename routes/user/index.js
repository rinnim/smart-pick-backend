const express = require("express");
const router = express.Router();

// User Routes
router.use(require("./profile"));


module.exports = router;
