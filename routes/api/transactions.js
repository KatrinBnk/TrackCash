import express from 'express';
import * as transactionController from '../../controllers/transactionController.js';
import { authenticateToken, requireEmployee, requireManager } from '../../middleware/auth.js';

const router = express.Router();

const requireRoleForCreate = (req, res, next) => {
    const { type } = req.body;
    if (type === 'balance') {
        return requireManager(req, res, next);
    } else if (type === 'income' || type === 'expense') {
        return requireEmployee(req, res, next);
    } else {
        return res.status(400).json({ message: 'Недопустимый тип транзакции. Используйте "income", "expense" или "balance"' });
    }
};

const requireRoleForUpdate = (req, res, next) => {
    const { type } = req.body;
    if (type === 'balance') {
        return requireManager(req, res, next);
    } else if (type === 'income' || type === 'expense') {
        return requireEmployee(req, res, next);
    } else {
        return res.status(400).json({ message: 'Недопустимый тип транзакции. Используйте "income", "expense" или "balance"' });
    }
};

router.post('/', authenticateToken, requireRoleForCreate, transactionController.addTransaction);
router.put('/:id', authenticateToken, requireRoleForUpdate, transactionController.updateTransaction);
router.delete('/:id', authenticateToken, requireEmployee, transactionController.deleteTransaction);

export default router;