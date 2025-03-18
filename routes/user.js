import express from 'express';
import * as userController from '../controllers/userController.js';
import {authenticateToken, requireAdmin} from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, userController.getAllUsers);
router.get('/:id', authenticateToken, userController.getUserById);
router.put('/:id', authenticateToken, requireAdmin, userController.updateUser);
router.delete('/:id', authenticateToken, requireAdmin, userController.deleteUser);



export default router;