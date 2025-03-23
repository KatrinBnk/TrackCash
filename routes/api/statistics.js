import express from 'express';
import * as statisticsController from '../../controllers/statisticsController.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.get('/summary', authenticateToken, statisticsController.getSummaryStatistics);
router.get('/detailed', authenticateToken, statisticsController.getDetailedStatistics);

export default router;