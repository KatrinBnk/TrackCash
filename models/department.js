import db from '../config/db.js';

class Department {
    static async create({ name, manager_id }) {
        const [result] = await db.query(
            'INSERT INTO Departments (name, manager_id) VALUES (?, ?)',
            [name, manager_id || null]
        );
        return { id: result.insertId, name, manager_id };
    }

    static async update(id, { name, manager_id }) {
        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (manager_id !== undefined) {
            updates.push('manager_id = ?');
            values.push(manager_id);
        }

        if (updates.length === 0) return null;

        values.push(id);
        const query = `UPDATE Departments SET ${updates.join(', ')} WHERE id = ?`;
        await db.query(query, values);

        const [updated] = await db.query('SELECT * FROM Departments WHERE id = ?', [id]);
        return updated[0];
    }

    static async getAll() {
        const [departments] = await db.query('SELECT * FROM Departments');
        return departments;
    }

    static async getById(id) {
        const [departments] = await db.query('SELECT * FROM Departments WHERE id = ?', [id]);
        return departments[0] || null;
    }
    static async delete(id) {
        const [result] = await db.query('DELETE FROM Departments WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

export default Department;