import Transaction from '../models/transaction.js';

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
        console.error(err); // Логируем ошибку для диагностики
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};