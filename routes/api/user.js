const express = require('express');
const userController = require('../../controllers/userController.js');
const {authenticateToken, requireAdmin} = require('../../middleware/auth.js');

const router = express.Router();

router.get('/', authenticateToken, userController.getAllUsers);
router.get('/me', authenticateToken, userController.getMe);
router.get('/:id', authenticateToken, userController.getUserById);
router.put('/:id', authenticateToken, requireAdmin, userController.updateUser);
router.delete('/:id', authenticateToken, requireAdmin, userController.deleteUser);
router.get('/department/:id', authenticateToken, userController.getUsersByDepartmentId);

module.exports = router;