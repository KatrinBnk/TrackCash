const express = require('express');
const statisticsController = require('../../controllers/statisticsController.js');
const { authenticateToken } = require('../../middleware/auth.js');

const router = express.Router();

router.get('/summary', authenticateToken, statisticsController.getSummaryStatistics);
router.get('/detailed', authenticateToken, statisticsController.getDetailedStatistics);

module.exports = router;