import db from '../config/db.js';

class Department {
    static async create({ name, manager_id }) {

        if(manager_id) {
            const [manager] = await db.query('SELECT * FROM Users WHERE id = ? AND role = "manager"', [manager_id]);
            if (!manager.length) {
                throw { status: 400, message: 'Invalid manager_id: must be a manager' };
            }
            if (manager[0].department_id) {
                throw { status: 400, message: 'Manager is already assigned to another department' };
            }
        }

        const [result] = await db.query(
            'INSERT INTO Departments (name, manager_id) VALUES (?, ?)',
            [name, manager_id || null]
        );
        return { id: result.insertId, name, manager_id };
    }

    static async update(id, { name, manager_id }) {
        const updates = [];
        const values = [];

        if(await this.getById(id) === null) {
            throw { status: 404, message: 'Department not found' };
        }

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (manager_id !== undefined) {
            const [manager] = await db.query('SELECT * FROM Users WHERE id = ? AND role = "manager"', [manager_id]);
            if (!manager.length) {
                throw { status: 400, message: 'Invalid manager_id: must be a manager' };
            }
            if (manager[0].department_id) {
                throw { status: 400, message: 'Manager is already assigned to another department' + manager_id + " in department " + manager[0].department_id };
            }
            updates.push('manager_id = ?');
            values.push(manager_id);
        }

        if (updates.length === 0) return null;

        values.push(id);
        try {
            const query = `UPDATE Departments
                           SET ${updates.join(', ')}
                           WHERE id = ?`;
            await db.query(query, values);
            const updateManager = await db.query('UPDATE Users SET department_id = ? WHERE id = ?', [id, manager_id]);
        } catch (error) {
            throw { status: 500, message: error.message };
        }

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
        const [users] = await db.query('SELECT * FROM Users WHERE department_id = ?', [id]);
        if (users.length > 0) {
            throw { status: 400, message: 'Cannot delete department with associated categories or users' };
        }
        const [result] = await db.query('DELETE FROM Departments WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

export default Department;