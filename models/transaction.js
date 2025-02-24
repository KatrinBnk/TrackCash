import db from '../config/db.js';

class Transaction {
    static async create({ user_id, category_id, type, amount, date, comment }) {
        const [result] = await db.query(
            'INSERT INTO Transactions (user_id, category_id, type, amount, date, comment) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, category_id, type, amount, date, comment || null]
        );
        return { id: result.insertId, user_id, category_id, type, amount, date, comment };
    }
}

export default Transaction;