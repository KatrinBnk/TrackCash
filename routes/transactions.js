import express from 'express';
import * as transactionController from '../controllers/transactionController.js';
import { authenticateToken, requireEmployee, requireManager } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, (req, res, next) => {
    if (req.body.type === 'income') {
        requireManager(req, res, next);
    } else {
        requireEmployee(req, res, next);
    }
}, transactionController.addTransaction);
router.get('/', authenticateToken, requireEmployee, transactionController.getTransactions);
router.put('/:id', authenticateToken, requireEmployee, transactionController.updateTransaction);
router.delete('/:id', authenticateToken, requireEmployee, transactionController.deleteTransaction);

export default router;