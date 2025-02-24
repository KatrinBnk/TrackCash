import express from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authenticateToken, requireManager } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, requireManager, categoryController.createCategory);
router.get('/', authenticateToken, categoryController.getCategories);
router.put('/:id', authenticateToken, requireManager, categoryController.updateCategory);
router.delete('/:id', authenticateToken, requireManager, categoryController.deleteCategory);

export default router;