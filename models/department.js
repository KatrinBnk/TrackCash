import db from '../config/db.js';

class Department {
    static async create({ name }) {
        const [result] = await db.query(
            'INSERT INTO Departments (name, manager_id) VALUES (?, ?)',
            [name, null]
        );
        return { id: result.insertId, name };
    }

    static async update(id, { name, manager_id }) {
        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (manager_id !== undefined) { // Позволяем обнулить manager_id
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
}

export default Department;