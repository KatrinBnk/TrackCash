import express from 'express';
import * as departmentController from '../controllers/departmentController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, requireAdmin, departmentController.createDepartment);
router.put('/:id', authenticateToken, requireAdmin, departmentController.updateDepartment);

export default router;