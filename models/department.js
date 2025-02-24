import db from '../config/db.js';

class Department {
    static async create({ name, manager_id }) {
        const [result] = await db.query(
            'INSERT INTO Departments (name, manager_id) VALUES (?, ?)',
            [name, manager_id || null]
        );
        return { id: result.insertId, name, manager_id };
    }
}

export default Department;