import db from '../config/db.js';

class Transaction {
    static async create({ user_id, category_id, type, amount, date, comment }) {
        const [result] = await db.query(
            'INSERT INTO Transactions (user_id, category_id, type, amount, date, comment) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, category_id, type, amount, date, comment || null]
        );
        return { id: result.insertId, user_id, category_id, type, amount, date, comment };
    }

    static async getByUserId(userId, categoryIdFilter = null, dateFrom = null, dateTo = null) {
        let query = 'SELECT * FROM Transactions WHERE user_id = ?';
        const params = [userId];

        if (categoryIdFilter) {
            query += ' AND category_id = ?';
            params.push(categoryIdFilter);
        }
        if (dateFrom) {
            query += ' AND date >= ?';
            params.push(dateFrom);
        }
        if (dateTo) {
            query += ' AND date <= ?';
            params.push(dateTo);
        }

        const [transactions] = await db.query(query, params);
        return transactions.map(tx => ({
            ...tx,
            amount: parseFloat(tx.amount),
            date: new Date(tx.date).toISOString().split('T')[0]
        }));
    }

    static async update(id, { category_id, type, amount, date, comment }) {
        await db.query(
            'UPDATE Transactions SET category_id = ?, type = ?, amount = ?, date = ?, comment = ? WHERE id = ?',
            [category_id, type, amount, date, comment || null, id]
        );
        const [updated] = await db.query('SELECT * FROM Transactions WHERE id = ?', [id]);
        return updated[0];
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM Transactions WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

export default Transaction;