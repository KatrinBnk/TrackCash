import db from '../config/db.js';

class User {
    static async findByUsername(username) {
        const [rows] = await db.query('SELECT * FROM Users WHERE username = ?', [username]);
        return rows[0];
    }

    static async create({ username, password, role, department_id }) {
        const [result] = await db.query(
            'INSERT INTO Users (username, password, role, department_id) VALUES (?, ?, ?, ?)',
            [username, password, role, department_id || null]
        );
        return { id: result.insertId, username, role };
    }
}

export default User;