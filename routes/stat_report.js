const express = require('express');
const router = express.Router();
const { getTotalUserAndAdmin } = require('../controllers/stat_report');
const { authenticateJWT } = require('../middlewares/auth');

router.get('/user-admin-stats',  authenticateJWT, getTotalUserAndAdmin);

module.exports = router; 