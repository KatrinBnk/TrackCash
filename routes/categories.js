import express from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authenticateToken, requireManager } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, requireManager, categoryController.createCategory);

export default router;