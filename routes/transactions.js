import express from 'express';
import * as transactionController from '../controllers/transactionController.js';
import { authenticateToken, requireEmployee } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, requireEmployee, transactionController.addTransaction);
router.get('/', authenticateToken, requireEmployee, transactionController.getTransactions);
router.put('/:id', authenticateToken, requireEmployee, transactionController.updateTransaction);
router.delete('/:id', authenticateToken, requireEmployee, transactionController.deleteTransaction);

export default router;