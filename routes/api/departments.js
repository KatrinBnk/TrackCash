const express = require('express');
const departmentController = require('../../controllers/departmentController.js');
const { authenticateToken, requireAdmin } = require('../../middleware/auth.js');

const router = express.Router();

router.post('/', authenticateToken, requireAdmin, departmentController.createDepartment);
router.put('/:id', authenticateToken, requireAdmin, departmentController.updateDepartment);
router.get('/', authenticateToken, departmentController.getDepartments);
router.get('/:id', authenticateToken, departmentController.getDepartmentById);
router.delete('/:id', authenticateToken, requireAdmin, departmentController.deleteDepartment);

module.exports = router;