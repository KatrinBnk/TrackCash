import Transaction from '../models/transaction.js';
import db from '../config/db.js';

export const addTransaction = async (req, res) => {
    const { category_id, type, amount, date, comment } = req.body;
    const user_id = req.user.id;

    if (!category_id || !type || !amount || !date) {
        return res.status(400).json({ message: 'All required fields must be provided' });
    }

    try {
        const transaction = await Transaction.create({
            user_id,
            category_id,
            type,
            amount,
            date,
            comment,
        });
        res.status(201).json({ message: 'Transaction added successfully', transaction });
    } catch (err) {
        console.error('Error adding transaction:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const getTransactions = async (req, res) => {
    const userId = req.user.id;
    const { category_id, dateFrom, dateTo } = req.query;

    try {
        const transactions = await Transaction.getByUserId(userId, category_id, dateFrom, dateTo);
        res.status(200).json(transactions);
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const updateTransaction = async (req, res) => {
    const { id } = req.params;
    const { category_id, type, amount, date, comment } = req.body;
    const userId = req.user.id;

    try {
        // Проверяем, существует ли транзакция и принадлежит ли она сотруднику
        const [transaction] = await db.query('SELECT * FROM Transactions WHERE id = ?', [id]);
        if (!transaction.length) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        if (transaction[0].user_id !== userId) {
            return res.status(403).json({ message: 'You can only update your own transactions' });
        }

        // Собираем данные для обновления, используя существующие значения, если поля не указаны
        const updateData = {
            category_id: category_id || transaction[0].category_id,
            type: type || transaction[0].type,
            amount: amount !== undefined ? parseFloat(amount) : parseFloat(transaction[0].amount),
            date: date || transaction[0].date,
            comment: comment || transaction[0].comment,
        };

        // Проверяем, что все обязательные поля заполнены (даже если они из старых данных)
        if (!updateData.category_id || !updateData.type || !updateData.amount || !updateData.date) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        const updatedTransaction = await Transaction.update(id, updateData);
        res.status(200).json({ message: 'Transaction updated successfully', transaction: updatedTransaction });
    } catch (err) {
        console.error('Error updating transaction:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const deleteTransaction = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        console.log('Attempting to delete transaction with ID:', id, 'by user ID:', userId);
        const [transaction] = await db.query('SELECT * FROM Transactions WHERE id = ?', [id]);
        console.log('Found transaction:', transaction);
        if (!transaction.length) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        if (transaction[0].user_id !== userId) {
            return res.status(403).json({ message: 'You can only delete your own transactions' });
        }

        await Transaction.delete(id);
        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (err) {
        console.error('Error deleting transaction:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};