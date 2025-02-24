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