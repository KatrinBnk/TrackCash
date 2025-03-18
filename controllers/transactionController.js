import Transaction from '../models/transaction.js';
import db from '../config/db.js';

export const addTransaction = async (req, res) => {
    const { user_id, category_id, type, amount, date, comment } = req.body;
    const requesterId = req.user.id;

    // Проверяем обязательные поля в зависимости от типа
    if (!user_id || !type || !amount || !date) {
        console.log("All required fields (user_id, type, amount, date) must be provided");
        console.log(user_id, type, amount, date);
        return res.status(400).json({ message: 'All required fields (user_id, type, amount, date) must be provided' });
    }

    try {
        // Проверяем тип транзакции и роль
        if (type === 'expense') {
            if (requesterId !== user_id) {
                return res.status(403).json({ message: 'You can only add expenses for yourself' });
            }
            const [user] = await db.query('SELECT department_id FROM Users WHERE id = ? AND role = ?', [user_id, 'employee']);
            if (!user.length || !user[0].department_id) {
                console.log("User is not assigned to a department");
                return res.status(400).json({ message: 'User is not assigned to a department' });
            }
            const [category] = await db.query('SELECT * FROM Categories WHERE id = ?', [category_id]);
            if (!category.length) {
                console.log('invalid category_id');
                return res.status(400).json({ message: 'Invalid category_id' });
            }
            if (category[0].department_id !== user[0].department_id) {
                console.log("Category doesn't belong to your department");
                return res.status(400).json({ message: 'Category does not belong to your department' });
            }
        }else if (type === 'income') {
            // Для доходов — только менеджер может добавлять для сотрудников своего отдела
            const [department] = await db.query('SELECT * FROM Departments WHERE manager_id = ?', [requesterId]);
            if (!department.length) {
                return res.status(400).json({ message: 'Manager is not assigned to a department' });
            }
            const departmentId = department[0].id;

            const [employee] = await db.query('SELECT * FROM Users WHERE id = ? AND department_id = ? AND role = ?', [user_id, departmentId, 'employee']);
            if (!employee.length) {
                return res.status(400).json({ message: 'Invalid user_id or user not in your department' });
            }
            // Для доходов category_id необязателен
        } else {
            return res.status(400).json({ message: 'Invalid transaction type. Use "expense" or "income"' });
        }

        // Создаём транзакцию
        const transaction = await Transaction.create({
            user_id,
            category_id: category_id || null, // Позволяем null для доходов
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
        const [transaction] = await db.query('SELECT * FROM Transactions WHERE id = ?', [id]);
        if (!transaction.length) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        if (transaction[0].user_id !== userId) {
            return res.status(403).json({ message: 'You can only update your own transactions' });
        }

        const updateData = {
            category_id: category_id || transaction[0].category_id,
            type: type || transaction[0].type,
            amount: amount !== undefined ? parseFloat(amount) : parseFloat(transaction[0].amount),
            date: date || transaction[0].date,
            comment: comment || transaction[0].comment,
        };

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