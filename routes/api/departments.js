import express from 'express';
import * as departmentController from '../../controllers/departmentController.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, requireAdmin, departmentController.createDepartment);
router.put('/:id', authenticateToken, requireAdmin, departmentController.updateDepartment);
router.get('/', authenticateToken, departmentController.getDepartments);
router.get('/:id', authenticateToken, departmentController.getDepartmentById);
router.delete('/:id', authenticateToken, requireAdmin, departmentController.deleteDepartment);

export default router;