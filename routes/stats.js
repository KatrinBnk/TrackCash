import express from 'express';
import * as statsController from '../controllers/statsController.js';
import { authenticateToken, requireManager } from '../middleware/auth.js';

const router = express.Router();

router.get('/department', authenticateToken, requireManager, statsController.getDepartmentStats);

export default router;