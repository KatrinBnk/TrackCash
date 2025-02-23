import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authenticateToken, requireAdmin, authController.register);
router.post('/login', authController.login);

export default router;